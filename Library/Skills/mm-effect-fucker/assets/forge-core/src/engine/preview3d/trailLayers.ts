// Camera-facing ribbons through each trail's points (Unity trails, Stretch
// texture mode), one dynamic mesh per effect layer.

import * as THREE from 'three';
import { evalCurve } from '../curve';
import { hexToRgb } from '../simulate';
import type { ColorStop } from '../types';

const WHITE: [number, number, number] = [1, 1, 1];

/** A colour gradient at t (0..1), linear between stops, as 0..1 sRGB components (multiplies the vertex colour). */
function stopColor(stops: ColorStop[], t: number): [number, number, number] {
  let a = stops[0], b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) if (t >= stops[i].t && t <= stops[i + 1].t) { a = stops[i]; b = stops[i + 1]; break; }
  const ca = hexToRgb(a.color), cb = hexToRgb(b.color);
  const k = b.t > a.t ? Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t))) : 0;
  return [(ca[0] + (cb[0] - ca[0]) * k) / 255, (ca[1] + (cb[1] - ca[1]) * k) / 255, (ca[2] + (cb[2] - ca[2]) * k) / 255];
}
import type { LayerFrame3D } from '../simulate3d';
import { TRAIL_FRAG, TRAIL_VERT } from './shaders';
import { assetTexture, trailTex } from './textures';
import { assetImage } from '../assetImages';
import { setBlend } from './particleMaterial';
import { FX_LAYER } from './layers';

interface TrailMesh {
  mesh: THREE.Mesh;
  geo: THREE.BufferGeometry;
  mat: THREE.ShaderMaterial;
  capV: number;
  pos: THREE.BufferAttribute;
  col: THREE.BufferAttribute;
  uv: THREE.BufferAttribute;
  index: THREE.BufferAttribute;
}

export class TrailLayers {
  private meshes: TrailMesh[] = [];

  constructor(private scene: THREE.Scene) {}

  /** The trail meshes of the given layer indices (for the selection outline). */
  objectsFor(indices: ReadonlySet<number>): THREE.Object3D[] {
    return this.meshes.filter((m, i) => m && indices.has(i)).map((m) => m.mesh);
  }

  upload(frames: LayerFrame3D[], cam: THREE.Vector3) {
    frames.forEach((fr, i) => {
      if (!fr.trailCount || !fr.emitter.rendered) {
        if (this.meshes[i]) this.meshes[i].mesh.visible = false;
        return;
      }
      let verts = 0;
      for (let k = 0, n = 0; n < fr.trailCount; n++) {
        const pts = fr.trails[k];
        verts += pts * 2;
        k += 6 + pts * 4;
      }
      const m = this.ensure(i, verts);
      m.mesh.visible = true;
      m.mesh.renderOrder = i - 0.5; // just under the particles of the same layer
      const em = fr.emitter;
      setBlend(m.mat, em.trailBlend ? { ...em, blend: em.trailBlend } : em);
      m.mat.uniforms.uIntensity.value = em.material.intensity * em.trailIntensity;
      const img = em.trailTexture ? assetImage(em.trailTexture) : null;
      m.mat.uniforms.uMap.value = img ? assetTexture(em.trailTexture, img) : trailTex();
      m.mat.uniforms.uApplyColorSpace.value = fr.emitter.applyColorSpace ? 1 : 0;
      m.geo.setDrawRange(0, this.build(m, fr, cam));
    });
    for (let i = frames.length; i < this.meshes.length; i++) if (this.meshes[i]) this.meshes[i].mesh.visible = false;
  }

  /** Writes the ribbon vertices; returns the index count. */
  private build(m: TrailMesh, fr: LayerFrame3D, cam: THREE.Vector3): number {
    const em = fr.emitter;
    const P = m.pos.array as Float32Array;
    const C = m.col.array as Float32Array;
    const U = m.uv.array as Float32Array;
    const I = m.index.array as Uint32Array;
    let v = 0;
    let ii = 0;
    const t = fr.trails;
    for (let k = 0, n = 0; n < fr.trailCount; n++) {
      const pts = t[k];
      const size = t[k + 1];
      const r = t[k + 2], g = t[k + 3], b = t[k + 4], a = t[k + 5];
      const base = k + 6;
      for (let j = 0; j < pts; j++) {
        const o = base + j * 4;
        const x = t[o], y = t[o + 1], z = -t[o + 2], u = t[o + 3];
        const jp = Math.max(0, j - 1), jn = Math.min(pts - 1, j + 1);
        let tx = t[base + jn * 4] - t[base + jp * 4];
        let ty = t[base + jn * 4 + 1] - t[base + jp * 4 + 1];
        let tz = -(t[base + jn * 4 + 2] - t[base + jp * 4 + 2]);
        const tl = Math.hypot(tx, ty, tz) || 1;
        tx /= tl;
        ty /= tl;
        tz /= tl;
        const cx = cam.x - x, cy = cam.y - y, cz = cam.z - z;
        let sx = ty * cz - tz * cy, sy = tz * cx - tx * cz, sz = tx * cy - ty * cx;
        const sl = Math.hypot(sx, sy, sz) || 1;
        const w = (size * (em.trailWidthCurve.length ? evalCurve(em.trailWidthCurve, u) : 1 + (em.trailWidthEnd - 1) * u)) / 2;
        sx = (sx / sl) * w;
        sy = (sy / sl) * w;
        sz = (sz / sl) * w;
        const al = a * (em.trailAlongAlpha.length ? evalCurve(em.trailAlongAlpha, u) : 1 - u);
        const along = em.trailAlongColors.length ? stopColor(em.trailAlongColors, u) : WHITE;
        for (const side of [-1, 1]) {
          P[v * 3] = x + sx * side;
          P[v * 3 + 1] = y + sy * side;
          P[v * 3 + 2] = z + sz * side;
          C[v * 4] = r * along[0];
          C[v * 4 + 1] = g * along[1];
          C[v * 4 + 2] = b * along[2];
          C[v * 4 + 3] = al;
          U[v * 2] = u;
          U[v * 2 + 1] = side < 0 ? 0 : 1;
          v++;
        }
        if (j > 0) {
          const q = v - 4;
          I[ii++] = q;
          I[ii++] = q + 1;
          I[ii++] = q + 2;
          I[ii++] = q + 1;
          I[ii++] = q + 3;
          I[ii++] = q + 2;
        }
      }
      k += 6 + pts * 4;
    }
    for (const a of [m.pos, m.col, m.uv, m.index]) a.needsUpdate = true;
    return ii;
  }

  private ensure(i: number, verts: number): TrailMesh {
    let m = this.meshes[i];
    if (m && m.capV >= verts) return m;
    if (m) {
      this.scene.remove(m.mesh);
      m.geo.dispose();
      m.mat.dispose();
    }
    const capV = Math.max(1024, Math.ceil(verts * 1.5));
    const geo = new THREE.BufferGeometry();
    const pos = new THREE.BufferAttribute(new Float32Array(capV * 3), 3);
    const col = new THREE.BufferAttribute(new Float32Array(capV * 4), 4);
    const uv = new THREE.BufferAttribute(new Float32Array(capV * 2), 2);
    const index = new THREE.BufferAttribute(new Uint32Array(capV * 3), 1);
    for (const a of [pos, col, uv, index]) a.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', pos);
    geo.setAttribute('aColor', col);
    geo.setAttribute('uv', uv);
    geo.setIndex(index);
    const mat = new THREE.ShaderMaterial({
      vertexShader: TRAIL_VERT,
      fragmentShader: TRAIL_FRAG,
      uniforms: { uMap: { value: trailTex() }, uIntensity: { value: 1 }, uBlendKind: { value: 0 }, uApplyColorSpace: { value: 1 } },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.layers.set(FX_LAYER);
    this.scene.add(mesh);
    m = { mesh, geo, mat, capV, pos, col, uv, index };
    this.meshes[i] = m;
    return m;
  }
}
