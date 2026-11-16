// Frame pipeline of the preview: an optional depth pre-pass of the opaque
// scene (for soft particles), the main pass into a linear HDR target, Bloom,
// the editor's selection outline, and the output pass (sRGB encoding, no tone
// mapping, like Unity's default).

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import type { Bloom3D } from '../types3d';
import type { DepthInputs } from './particleMaterial';
import { GROUND_DEPTH_LAYER, OPAQUE_LAYER } from './layers';
import { SelectionOutline } from './selectionOutline';

export class PostPipeline {
  private composer: EffectComposer;
  private renderPass: RenderPass;
  private bloom: UnrealBloomPass;
  private depthTarget: THREE.WebGLRenderTarget;
  private size = new THREE.Vector2(1, 1);
  readonly outline = new SelectionOutline();

  constructor(private renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(renderer, target);
    this.renderPass = new RenderPass(scene, camera);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 1, 0.5, 1);
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloom);
    this.composer.addPass(this.outline.pass);
    this.composer.addPass(new OutputPass());
    this.depthTarget = new THREE.WebGLRenderTarget(1, 1, { depthTexture: new THREE.DepthTexture(1, 1) });
  }

  setSize(w: number, h: number) {
    const pr = this.renderer.getPixelRatio();
    this.composer.setPixelRatio(pr);
    this.composer.setSize(w, h);
    this.size.set(Math.max(1, Math.floor(w * pr)), Math.max(1, Math.floor(h * pr)));
    this.depthTarget.setSize(this.size.x, this.size.y);
    this.outline.setSize(this.size.x, this.size.y);
  }

  /** Renders the opaque scene's depth; returns what the particle shader needs to read it. */
  renderDepth(scene: THREE.Scene, camera: THREE.PerspectiveCamera): DepthInputs {
    const mask = camera.layers.mask;
    camera.layers.set(OPAQUE_LAYER);
    camera.layers.enable(GROUND_DEPTH_LAYER);
    const bg = scene.background;
    scene.background = null;
    this.renderer.setRenderTarget(this.depthTarget);
    this.renderer.clear();
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);
    scene.background = bg;
    camera.layers.mask = mask;
    return { texture: this.depthTarget.depthTexture, width: this.size.x, height: this.size.y, near: camera.near, far: camera.far };
  }

  noDepth(camera: THREE.PerspectiveCamera): DepthInputs {
    return { texture: null, width: this.size.x, height: this.size.y, near: camera.near, far: camera.far };
  }

  render(bloom: Bloom3D) {
    this.bloom.enabled = bloom.enabled;
    this.bloom.strength = bloom.intensity;
    this.bloom.radius = bloom.radius;
    this.bloom.threshold = bloom.threshold;
    this.composer.render();
  }

  dispose() {
    this.composer.dispose();
    this.bloom.dispose();
    this.depthTarget.dispose();
    this.outline.dispose();
  }
}
