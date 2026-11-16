// One instanced draw per effect layer: a quad for billboards, or one of the
// built-in or custom meshes for mesh particles. Uploads the simulated particles.

import * as THREE from 'three';
import { STRIDE3, type LayerFrame3D, type Mat3 } from '../simulate3d';
import type { Emitter3D } from '../types3d';
import { meshData } from '../meshes/kinds';
import { BILLBOARD_VERT, MESH_VERT } from './shaders';
import { applyLayer, particleMaterial, type DepthInputs } from './particleMaterial';
import { customShader } from '../customShaders';
import { customMesh } from '../meshes/customMeshes';
import { FX_LAYER } from './layers';

const MODE = { billboard: 0, stretched: 1, horizontal: 2, vertical: 3, mesh: 0, none: 0 } as const;
const ALIGN = { velocity: 0, random: 1, local: 2, view: 3 } as const;
type Attr = 'iPos' | 'iSize' | 'iRot' | 'iColor' | 'iVel' | 'iData' | 'iShape';
const SIZES: Record<Attr, number> = { iPos: 3, iSize: 1, iRot: 1, iColor: 4, iVel: 3, iData: 3, iShape: 4 };

interface Slot {
  key: string; // 'quad' or 'mesh:<kind>'
  mesh: THREE.Mesh;
  geo: THREE.InstancedBufferGeometry;
  mat: THREE.ShaderMaterial;
  cap: number;
  attrs: Record<Attr, THREE.InstancedBufferAttribute>;
}

/** Base geometry in three's axes (Unity's Z flipped). */
function baseGeometry(em: Emitter3D): THREE.BufferGeometry {
  if (em.renderMode !== 'mesh') return new THREE.PlaneGeometry(1, 1);
  const m = meshData(em.mesh);
  const flip = (a: number[]) => a.map((v, i) => (i % 3 === 2 ? -v : v));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(flip(m.positions), 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(flip(m.normals), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(m.uvs, 2));
  g.setIndex(m.indices);
  return g;
}

/**
 * The order Unity's Sort Mode draws a layer's particles in (null = as simulated, which is
 * emission order): by distance from the camera, farthest first, or by age.
 */
function drawOrder(fr: LayerFrame3D, camPos?: THREE.Vector3): Int32Array | null {
  const mode = fr.emitter.sortMode;
  if (mode === 'none' || fr.count < 2 || (mode === 'distance' && !camPos)) return null;
  const d = fr.data;
  const key = new Float64Array(fr.count);
  for (let k = 0; k < fr.count; k++) {
    const o = k * STRIDE3;
    if (mode === 'distance') {
      // three's axes: Unity z flipped
      const dx = d[o] - camPos!.x, dy = d[o + 1] - camPos!.y, dz = -d[o + 2] - camPos!.z;
      key[k] = -(dx * dx + dy * dy + dz * dz); // farthest first
    } else key[k] = mode === 'youngestInFront' ? -d[o + 14] : d[o + 14]; // drawn last = in front
  }
  const order = new Int32Array(fr.count);
  for (let k = 0; k < fr.count; k++) order[k] = k;
  order.sort((a, b) => key[a] - key[b]);
  return order;
}

/** The layer's rotation in three's axes: S·M·S with S = diag(1, 1, -1). */
function localRotation(M: Mat3, out: THREE.Matrix3) {
  out.set(M[0], M[1], -M[2], M[3], M[4], -M[5], -M[6], -M[7], M[8]);
}

export class ParticleLayers {
  private slots: Slot[] = [];

  constructor(private scene: THREE.Scene) {}

  upload(frames: LayerFrame3D[], depth: DepthInputs, camPos?: THREE.Vector3) {
    frames.forEach((fr, i) => {
      const em = fr.emitter;
      const s = this.ensure(i, em, fr.count);
      s.mesh.visible = fr.count > 0 && em.rendered && em.renderMode !== 'none';
      s.mesh.renderOrder = i;
      applyLayer(s.mat, em, depth);
      const u = s.mat.uniforms;
      u.uMode.value = MODE[em.renderMode];
      u.uLengthScale.value = em.lengthScale;
      u.uVelocityScale.value = em.velocityScale;
      u.uAlign.value = ALIGN[em.meshAlign];
      (u.uPivot.value as THREE.Vector3).set(em.pivot.x, em.pivot.y, em.pivot.z);
      (u.uFlip.value as THREE.Vector2).set(em.flip.x, em.flip.y);
      u.uApplyColorSpace.value = em.applyColorSpace ? 1 : 0;
      (u.uSizeLimit.value as THREE.Vector2).set(em.minParticleSize, Math.max(em.minParticleSize, em.maxParticleSize));
      localRotation(fr.rot, u.uLocalRot.value);
      this.fill(s, fr, drawOrder(fr, camPos));
    });
    for (let i = frames.length; i < this.slots.length; i++) if (this.slots[i]) this.slots[i].mesh.visible = false;
  }

  /** The particle meshes of the given layer indices (for the selection outline). */
  objectsFor(indices: ReadonlySet<number>): THREE.Object3D[] {
    return this.slots.filter((s, i) => s && indices.has(i)).map((s) => s.mesh);
  }

  private fill(s: Slot, fr: LayerFrame3D, order: Int32Array | null) {
    const A = s.attrs;
    const P = A.iPos.array as Float32Array, S = A.iSize.array as Float32Array, R = A.iRot.array as Float32Array;
    const C = A.iColor.array as Float32Array, V = A.iVel.array as Float32Array, D = A.iData.array as Float32Array;
    const H = A.iShape.array as Float32Array;
    const d = fr.data;
    for (let k = 0; k < fr.count; k++) {
      const o = (order ? order[k] : k) * STRIDE3;
      P[k * 3] = d[o];
      P[k * 3 + 1] = d[o + 1];
      P[k * 3 + 2] = -d[o + 2]; // Unity left-handed -> three right-handed
      S[k] = d[o + 3];
      R[k] = -d[o + 4];
      C[k * 4] = d[o + 5];
      C[k * 4 + 1] = d[o + 6];
      C[k * 4 + 2] = d[o + 7];
      C[k * 4 + 3] = d[o + 8];
      V[k * 3] = d[o + 9];
      V[k * 3 + 1] = d[o + 10];
      V[k * 3 + 2] = -d[o + 11];
      D[k * 3] = d[o + 12];
      D[k * 3 + 1] = d[o + 13];
      D[k * 3 + 2] = d[o + 14];
      H[k * 4] = d[o + 15];
      H[k * 4 + 1] = d[o + 16];
      H[k * 4 + 2] = d[o + 17];
      H[k * 4 + 3] = d[o + 18];
    }
    for (const a of Object.values(A)) {
      a.needsUpdate = true;
      a.clearUpdateRanges();
      a.addUpdateRange(0, fr.count * a.itemSize);
    }
    s.geo.instanceCount = fr.count;
  }

  private ensure(i: number, em: Emitter3D, need: number): Slot {
    // a custom shader is part of the material: its id and version are part of the key
    const custom = em.material.shader ? customShader(em.material.shader) : null;
    // so is a custom mesh: a new version of it rebuilds the geometry
    const meshVer = em.renderMode === 'mesh' ? (customMesh(em.mesh)?.version ?? 0) : 0;
    const key = `${em.renderMode === 'mesh' ? `mesh:${em.mesh}@${meshVer}` : 'quad'}${custom ? `|${em.material.shader}@${custom.version}` : ''}`;
    let s = this.slots[i];
    if (s && s.key === key && s.cap >= need) return s;
    if (s) {
      this.scene.remove(s.mesh);
      s.geo.dispose();
      s.mat.dispose();
    }
    const cap = Math.max(256, Math.ceil(need * 1.5));
    const base = baseGeometry(em);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    for (const name of ['position', 'normal', 'uv']) if (base.getAttribute(name)) geo.setAttribute(name, base.getAttribute(name));
    const attrs = {} as Record<Attr, THREE.InstancedBufferAttribute>;
    for (const [k, n] of Object.entries(SIZES) as [Attr, number][]) {
      const a = new THREE.InstancedBufferAttribute(new Float32Array(cap * n), n);
      a.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute(k, a);
      attrs[k] = a;
    }
    const mat = particleMaterial(em.renderMode === 'mesh' ? MESH_VERT : BILLBOARD_VERT, custom?.code ?? null);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.layers.set(FX_LAYER);
    this.scene.add(mesh);
    s = { key, mesh, geo, mat, cap, attrs };
    this.slots[i] = s;
    return s;
  }
}
