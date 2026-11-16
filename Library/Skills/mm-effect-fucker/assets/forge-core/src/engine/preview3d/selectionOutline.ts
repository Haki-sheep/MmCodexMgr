// Editor outline around the particles of the selected layers (preview only,
// like Unity's selection outline): those layers are drawn into a mask target,
// and a post pass draws a line where the mask ends.

import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SELECT_LAYER } from './layers';

const OUTLINE_SHADER = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    tMask: { value: null as THREE.Texture | null },
    uTexel: { value: new THREE.Vector2(1, 1) },
    uColor: { value: new THREE.Color(1.0, 0.45, 0.05) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tMask;
    uniform vec2 uTexel;
    uniform vec3 uColor;
    varying vec2 vUv;
    // coverage of the selected particles: bright or opaque enough to count
    float cover(vec2 uv) {
      vec4 m = texture2D(tMask, uv);
      return step(0.04, max(max(m.r, m.g), max(m.b, m.a)));
    }
    void main() {
      vec4 src = texture2D(tDiffuse, vUv);
      float inside = cover(vUv);
      float near = 0.0;
      for (int r = 1; r <= 2; r++) {
        vec2 d = uTexel * float(r);
        near = max(near, cover(vUv + vec2(d.x, 0.0)));
        near = max(near, cover(vUv - vec2(d.x, 0.0)));
        near = max(near, cover(vUv + vec2(0.0, d.y)));
        near = max(near, cover(vUv - vec2(0.0, d.y)));
        near = max(near, cover(vUv + d));
        near = max(near, cover(vUv - d));
        near = max(near, cover(vUv + vec2(d.x, -d.y)));
        near = max(near, cover(vUv + vec2(-d.x, d.y)));
      }
      float edge = near * (1.0 - inside);
      gl_FragColor = vec4(mix(src.rgb, uColor, edge), src.a);
    }`,
};

export class SelectionOutline {
  readonly pass = new ShaderPass(OUTLINE_SHADER);
  private target = new THREE.WebGLRenderTarget(1, 1);

  constructor() {
    this.pass.enabled = false;
    this.pass.uniforms.tMask.value = this.target.texture;
  }

  setSize(w: number, h: number) {
    this.target.setSize(w, h);
    this.pass.uniforms.uTexel.value.set(1 / Math.max(1, w), 1 / Math.max(1, h));
  }

  /** Draws `objects` (the selected layers' particles and trails) into the mask; none turns the outline off. */
  update(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, objects: THREE.Object3D[]) {
    const shown = objects.filter((o) => o.visible);
    this.pass.enabled = shown.length > 0;
    if (!this.pass.enabled) return;
    const mask = camera.layers.mask;
    const bg = scene.background;
    const clear = renderer.getClearAlpha();
    for (const o of shown) o.layers.enable(SELECT_LAYER);
    camera.layers.set(SELECT_LAYER);
    scene.background = null;
    renderer.setClearAlpha(0);
    renderer.setRenderTarget(this.target);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.setClearAlpha(clear);
    scene.background = bg;
    camera.layers.mask = mask;
    for (const o of shown) o.layers.disable(SELECT_LAYER);
  }

  dispose() {
    this.target.dispose();
    this.pass.dispose();
  }
}
