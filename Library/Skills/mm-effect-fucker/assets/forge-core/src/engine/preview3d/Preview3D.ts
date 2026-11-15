// three.js preview for 3D effects: owns the renderer, camera and scene and
// runs one frame (simulate, upload particles and trails, post-process).
// Simulation coordinates are Unity's (left-handed); uploads flip Z.

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { simulateFrame3D } from '../simulate3d';
import type { Effect3D, Emitter3D } from '../types3d';
import { ParticleLayers } from './particleLayers';
import { FX_LAYER, HELPER_LAYER } from './layers';
import { TrailLayers } from './trailLayers';
import { ShapeGizmo } from './shapeGizmo';
import { visibleInTree, worldPose } from '../hierarchy3d';
import { buildStage, type StageProps } from './stage';
import { PostPipeline } from './postPipeline';
import { fxTimeUniform } from './particleMaterial';
import { LightPool } from './lightPool';

const NONE: ReadonlySet<string> = new Set();

export class Preview3D {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(40, 1, 0.05, 500);
  readonly controls: OrbitControls;
  private particles3d: ParticleLayers;
  private trails: TrailLayers;
  private gizmo = new ShapeGizmo();
  private stage: StageProps;
  private post: PostPipeline;
  private lights: LightPool;
  particles = 0;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera.layers.enable(FX_LAYER);
    this.camera.layers.enable(HELPER_LAYER);
    this.resetView();
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(0, 1, 0);
    this.controls.enableDamping = true;
    this.controls.update();
    this.stage = buildStage(this.scene);
    this.gizmo.group.layers.set(HELPER_LAYER);
    this.scene.add(this.gizmo.group);
    this.particles3d = new ParticleLayers(this.scene);
    this.trails = new TrailLayers(this.scene);
    this.lights = new LightPool(this.scene);
    this.post = new PostPipeline(this.renderer, this.scene, this.camera);
  }

  setSize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.post.setSize(w, h);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  }

  /** Camera position and orbit target (three's axes), to save and restore a view. */
  getView(): { position: [number, number, number]; target: [number, number, number] } {
    const r = (v: number) => Math.round(v * 1000) / 1000;
    const p = this.camera.position, t = this.controls.target;
    return { position: [r(p.x), r(p.y), r(p.z)], target: [r(t.x), r(t.y), r(t.z)] };
  }

  setView(v: { position: [number, number, number]; target: [number, number, number] }) {
    this.camera.position.set(...v.position);
    this.controls.target.set(...v.target);
    this.controls.update();
  }

  resetView() {
    this.camera.position.set(5, 3.4, 7.2);
    this.controls?.target.set(0, 1, 0);
    this.controls?.update();
  }

  /** `outlined`: ids of the layers whose particles get the selection outline (editor only). */
  render(effect: Effect3D, t: number, selected: Emitter3D | null, outlined: ReadonlySet<string> = NONE) {
    this.scene.background = new THREE.Color(effect.background);
    this.stage.character.visible = effect.showCharacter;
    fxTimeUniform.value = t;
    const frames = simulateFrame3D(effect, t, this);
    this.particles = frames.reduce((s, f) => s + f.count, 0);
    this.controls.update();
    // the depth pre-pass only runs when a visible layer uses soft particles
    const soft = effect.layers.some((l) => l.visible && l.material.softness > 0);
    const depth = soft ? this.post.renderDepth(this.scene, this.camera) : this.post.noDepth(this.camera);
    this.particles3d.upload(frames, depth, this.camera.position);
    this.trails.upload(frames, this.camera.position);
    this.lights.update(effect);
    const shown = selected && visibleInTree(effect, selected) ? selected : null;
    this.gizmo.update(shown, shown ? worldPose(effect, shown) : null);
    const idx = new Set(effect.layers.flatMap((l, i) => (outlined.has(l.id) ? [i] : [])));
    this.post.outline.update(this.renderer, this.scene, this.camera, idx.size ? [...this.particles3d.objectsFor(idx), ...this.trails.objectsFor(idx)] : []);
    this.post.render(effect.bloom);
  }

  dispose() {
    this.controls.dispose();
    this.post.dispose();
    this.renderer.dispose();
  }
}
