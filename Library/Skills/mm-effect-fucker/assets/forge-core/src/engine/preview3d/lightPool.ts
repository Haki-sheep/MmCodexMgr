// A layer's Unity Light component in the preview: point lights lighting the
// ground. Drawn additively on the floor (y = 0) as what such a light adds to the
// Unity verify scene's floor, with Unity's built-in falloff (measured in 2022.3):
// 1 / (1 + 25 r^2), r = distance / range, faded linearly to 0 from r^2 = 0.64 to 1;
// colour x intensity converted gamma -> linear as pow 2.2 (Linear project).
// The floor is the verify scene's: Unity's Standard material (albedo (0.035, 0.032,
// 0.05), smoothness 0.5, not metallic) with Unity's BRDF1_Unity_PBS: Disney diffuse
// plus GGX specular (Smith joint visibility, Schlick Fresnel with F0 0.04).

import * as THREE from 'three';
import type { Effect3D } from '../types3d';
import { visibleInTree, worldPose } from '../hierarchy3d';

export const MAX_POOL_LIGHTS = 8;
/** The verify scene's floor colour (0.035, 0.032, 0.05) as linear albedo. */
const FLOOR_ALBEDO = new THREE.Vector3(0.0027, 0.0025, 0.004);

const VERT = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const FRAG = /* glsl */ `
  #define PI 3.14159265
  uniform vec3 uAlbedo;
  uniform int uCount;
  uniform vec3 uPos[${MAX_POOL_LIGHTS}];
  uniform vec3 uColor[${MAX_POOL_LIGHTS}]; // linear colour x intensity
  uniform float uRange[${MAX_POOL_LIGHTS}];
  varying vec3 vWorld;
  void main() {
    vec3 n = vec3(0.0, 1.0, 0.0);
    vec3 v = normalize(cameraPosition - vWorld);
    float nv = abs(dot(n, v));
    const float pr = 0.5;            // perceptual roughness = 1 - smoothness
    const float rough = pr * pr;
    vec3 diffColor = uAlbedo * 0.96; // one minus the dielectric reflectivity
    vec3 sum = vec3(0.0);
    for (int i = 0; i < ${MAX_POOL_LIGHTS}; i++) {
      if (i >= uCount) break;
      vec3 l = uPos[i] - vWorld;
      float d = length(l);
      float r2 = (d * d) / max(uRange[i] * uRange[i], 1e-6);
      if (r2 >= 1.0 || l.y <= 0.0) continue;
      float atten = 1.0 / (1.0 + 25.0 * r2) * (r2 > 0.64 ? (1.0 - r2) / 0.36 : 1.0);
      l /= max(d, 1e-4);
      vec3 hv = normalize(l + v);
      float nl = max(dot(n, l), 0.0), nh = max(dot(n, hv), 0.0), lh = max(dot(l, hv), 0.0);
      // Disney diffuse
      float fd90 = 0.5 + 2.0 * lh * lh * pr;
      float diffuse = (1.0 + (fd90 - 1.0) * pow(1.0 - nl, 5.0)) * (1.0 + (fd90 - 1.0) * pow(1.0 - nv, 5.0)) * nl;
      // GGX specular, Smith joint visibility
      float lambdaV = nl * (nv * (1.0 - rough) + rough);
      float lambdaL = nv * (nl * (1.0 - rough) + rough);
      float vis = 0.5 / (lambdaV + lambdaL + 1e-5);
      float a2 = rough * rough;
      float dd = (nh * a2 - nh) * nh + 1.0;
      float D = a2 / (PI * (dd * dd + 1e-7));
      float spec = max(0.0, vis * D * PI * nl);
      vec3 F = vec3(0.04) + (1.0 - 0.04) * pow(1.0 - lh, 5.0);
      sum += uColor[i] * atten * (diffColor * diffuse + spec * F);
    }
    gl_FragColor = vec4(sum, 1.0);
  }
`;

export class LightPool {
  private mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  /**
   * The same lights for the lit stand-in character (three's own lighting; a fixed set so the
   * shader never recompiles). three's 1/d^2 falloff with its Lambert 1/pi matches Unity's
   * 1 / (1 + 25 (d/range)^2) beyond a short distance at intensity pi x range^2 / 25.
   */
  private standIn: THREE.PointLight[] = [];

  constructor(scene: THREE.Scene) {
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uAlbedo: { value: FLOOR_ALBEDO },
        uCount: { value: 0 },
        uPos: { value: Array.from({ length: MAX_POOL_LIGHTS }, () => new THREE.Vector3()) },
        uColor: { value: Array.from({ length: MAX_POOL_LIGHTS }, () => new THREE.Vector3()) },
        uRange: { value: new Array(MAX_POOL_LIGHTS).fill(1) },
      },
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), this.mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0.0005;
    this.mesh.renderOrder = -500;
    this.mesh.visible = false;
    scene.add(this.mesh);
    for (let i = 0; i < MAX_POOL_LIGHTS; i++) {
      const p = new THREE.PointLight(0xffffff, 0, 1, 2);
      this.standIn.push(p);
      scene.add(p);
    }
  }

  /** The effect's lit lights (in tree order; Unity draws up to its pixel light count, FX Forge up to 8). */
  update(effect: Effect3D) {
    const u = this.mat.uniforms;
    let n = 0;
    for (const em of effect.layers) {
      if (n >= MAX_POOL_LIGHTS) break;
      const L = em.light;
      if (!L.enabled || L.intensity <= 0 || L.range <= 0 || !visibleInTree(effect, em)) continue;
      const p = worldPose(effect, em).pos;
      (u.uPos.value[n] as THREE.Vector3).set(p.x, p.y, -p.z); // Unity -> three axes
      const hex = parseInt(L.color.slice(1), 16) || 0; // the sRGB (gamma) components, as Unity's Light colour
      const g = (v: number) => Math.pow(Math.max(0, (v / 255) * L.intensity), 2.2);
      const col = u.uColor.value[n] as THREE.Vector3;
      col.set(g((hex >> 16) & 255), g((hex >> 8) & 255), g(hex & 255));
      u.uRange.value[n] = L.range;
      const peak = Math.max(col.x, col.y, col.z, 1e-6);
      const s = this.standIn[n];
      s.position.set(p.x, p.y, -p.z);
      s.color.setRGB(col.x / peak, col.y / peak, col.z / peak, THREE.LinearSRGBColorSpace);
      s.intensity = (Math.PI * peak * L.range * L.range) / 25;
      s.distance = L.range;
      n++;
    }
    u.uCount.value = n;
    for (let i = n; i < MAX_POOL_LIGHTS; i++) this.standIn[i].intensity = 0;
    this.mesh.visible = n > 0;
  }
}
