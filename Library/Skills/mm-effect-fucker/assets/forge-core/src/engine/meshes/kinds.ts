// The built-in particle meshes. All are about 1 unit across (Unity scales a
// mesh particle by its size) and point along +Z where they have a direction.

import type { MeshKind, MeshRef } from '../render3d/meshKinds';
import { customMesh, isCustomMesh } from './customMeshes';
import { faceted, lathe, type MeshData } from './meshData';

/** Ice spike: a hexagonal point, long and sharp at the front (+Z), short at the back. */
const spike = () =>
  lathe(
    [
      [-0.32, 0],
      [-0.12, 0.13],
      [0.12, 0.16],
      [0.68, 0],
    ],
    6,
    false,
  );

/** Crystal: hexagonal prism with pointed ends. */
const crystal = () =>
  lathe(
    [
      [-0.5, 0],
      [-0.28, 0.17],
      [0.28, 0.17],
      [0.5, 0],
    ],
    6,
    false,
  );

/** Shard: an irregular, flattened chunk of ice or rock. */
function shard(): MeshData {
  const v: [number, number, number][] = [
    [0.06, 0.5, 0.04], // top
    [-0.05, -0.46, -0.02], // bottom
    [0.38, 0.04, 0.09],
    [0.04, -0.02, 0.17],
    [-0.33, 0.12, 0.05],
    [-0.02, 0.06, -0.15],
  ];
  const ring = [2, 3, 4, 5];
  const faces: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const a = ring[i], b = ring[(i + 1) % 4];
    faces.push([0, a, b], [1, b, a]);
  }
  return faceted(v, faces, [0, 0.02, 0.03]);
}

/** Flat ring in the XY plane (faces +Z like a quad): u around, v from inner to outer edge. */
function ring(): MeshData {
  const m: MeshData = { positions: [], normals: [], uvs: [], indices: [] };
  const seg = 48, inner = 0.34, outer = 0.5;
  for (let s = 0; s <= seg; s++) {
    const a = (s / seg) * Math.PI * 2;
    const c = Math.cos(a), sn = Math.sin(a);
    for (const [r, v] of [[inner, 0], [outer, 1]]) {
      m.positions.push(c * r, sn * r, 0);
      m.normals.push(0, 0, -1);
      m.uvs.push(s / seg, v);
    }
  }
  for (let s = 0; s < seg; s++) {
    const a = s * 2;
    m.indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
  }
  return m;
}

/** Open tube from z = 0 to z = 1 (radius 0.5): u around, v along. Grows from its base. */
const cylinder = () =>
  lathe(
    [
      [0, 0.5],
      [1, 0.5],
    ],
    32,
    true,
  );

/** UV sphere, radius 0.5. */
function sphere(): MeshData {
  const profile: [number, number][] = [];
  for (let i = 0; i <= 12; i++) {
    const a = (Math.PI * i) / 12;
    profile.push([-0.5 * Math.cos(a), 0.5 * Math.sin(a)]);
  }
  const m = lathe(profile, 20, true);
  // exact normals: straight out from the centre
  for (let i = 0; i < m.normals.length; i += 3) {
    const x = m.positions[i], y = m.positions[i + 1], z = m.positions[i + 2];
    const l = Math.hypot(x, y, z) || 1;
    m.normals[i] = x / l;
    m.normals[i + 1] = y / l;
    m.normals[i + 2] = z / l;
  }
  return m;
}

function cube(): MeshData {
  const v: [number, number, number][] = [];
  for (const x of [-0.5, 0.5]) for (const y of [-0.5, 0.5]) for (const z of [-0.5, 0.5]) v.push([x, y, z]);
  const faces = [
    [0, 1, 3, 2],
    [4, 6, 7, 5],
    [0, 4, 5, 1],
    [2, 3, 7, 6],
    [0, 2, 6, 4],
    [1, 5, 7, 3],
  ];
  return faceted(v, faces);
}

/** Flat 1 x 1 card in the XY plane (faces +Z like the ring), UV 0..1: a texture that turns in 3D (leaves, petals, cards). */
function quad(): MeshData {
  return {
    positions: [-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0],
    normals: [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1],
    uvs: [0, 0, 1, 0, 1, 1, 0, 1],
    indices: [0, 1, 2, 0, 2, 3],
  };
}

const BUILDERS: Record<MeshKind, () => MeshData> = { spike, crystal, shard, ring, cylinder, sphere, cube, quad };
const cache = new Map<MeshKind, MeshData>();

/** A built-in mesh, or a custom one from the library (a missing custom mesh draws as the shard). */
export function meshData(ref: MeshRef): MeshData {
  if (isCustomMesh(ref)) return customMesh(ref)?.data ?? meshData('shard');
  const kind = ref as MeshKind;
  let m = cache.get(kind);
  if (!m) cache.set(kind, (m = BUILDERS[kind]()));
  return m;
}
