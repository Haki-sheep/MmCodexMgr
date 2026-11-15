// Helpers shared by the custom mesh builders: normals, flat shading, planar
// UVs and the scale / rotate / offset step.

import { apply, eulerToMat3 } from '../../sim3d/math';
import type { MeshData } from '../meshData';
import type { MeshTransform, V3 } from '../meshSource';

export const emptyMesh = (): MeshData => ({ positions: [], normals: [], uvs: [], indices: [] });

export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: V3, fallback: V3 = [0, 0, 1]): V3 => {
  const l = len(a);
  return l > 1e-9 ? [a[0] / l, a[1] / l, a[2] / l] : fallback;
};

const vert = (a: number[], i: number): V3 => [a[i * 3], a[i * 3 + 1], a[i * 3 + 2]];

/**
 * Smooth normals from the triangles, averaged over every vertex at the same
 * position (so UV seams do not show as creases). Weighted by triangle area.
 */
export function smoothNormals(m: MeshData) {
  const count = m.positions.length / 3;
  const key = (i: number) => `${Math.round(m.positions[i * 3] * 1e4)},${Math.round(m.positions[i * 3 + 1] * 1e4)},${Math.round(m.positions[i * 3 + 2] * 1e4)}`;
  const group = new Map<string, number>();
  const ids = new Int32Array(count);
  for (let i = 0; i < count; i++) {
    const k = key(i);
    let g = group.get(k);
    if (g === undefined) group.set(k, (g = group.size));
    ids[i] = g;
  }
  const acc = new Float64Array(group.size * 3);
  for (let t = 0; t < m.indices.length; t += 3) {
    const [a, b, c] = [m.indices[t], m.indices[t + 1], m.indices[t + 2]];
    const fn = cross(sub(vert(m.positions, b), vert(m.positions, a)), sub(vert(m.positions, c), vert(m.positions, a)));
    for (const i of [a, b, c]) for (let k = 0; k < 3; k++) acc[ids[i] * 3 + k] += fn[k];
  }
  m.normals = [];
  for (let i = 0; i < count; i++) m.normals.push(...norm([acc[ids[i] * 3], acc[ids[i] * 3 + 1], acc[ids[i] * 3 + 2]]));
}

/** Every triangle gets its own three vertices and its face normal, turned to agree with the smooth normals. */
export function flatShade(m: MeshData): MeshData {
  const out = emptyMesh();
  for (let t = 0; t < m.indices.length; t += 3) {
    const tri = [m.indices[t], m.indices[t + 1], m.indices[t + 2]];
    const [a, b, c] = tri.map((i) => vert(m.positions, i));
    let fn = norm(cross(sub(b, a), sub(c, a)));
    const avg = tri.reduce<V3>((s, i) => add(s, vert(m.normals, i)), [0, 0, 0]);
    if (dot(fn, avg) < 0) fn = scale(fn, -1);
    for (const i of tri) {
      out.positions.push(...vert(m.positions, i));
      out.normals.push(...fn);
      out.uvs.push(m.uvs[i * 2], m.uvs[i * 2 + 1]);
      out.indices.push(out.indices.length);
    }
  }
  return out;
}

/** UVs from the XY bounds (0..1 on both axes, like the quad). */
export function planarUVs(m: MeshData) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < m.positions.length; i += 3) {
    x0 = Math.min(x0, m.positions[i]);
    x1 = Math.max(x1, m.positions[i]);
    y0 = Math.min(y0, m.positions[i + 1]);
    y1 = Math.max(y1, m.positions[i + 1]);
  }
  const w = x1 - x0 || 1, h = y1 - y0 || 1;
  m.uvs = [];
  for (let i = 0; i < m.positions.length; i += 3) m.uvs.push((m.positions[i] - x0) / w, (m.positions[i + 1] - y0) / h);
}

/** Scale, then rotate (Unity Euler order), then offset; normals follow (inverse-transpose for non-uniform scale). */
export function applyTransform(m: MeshData, t: MeshTransform) {
  const s = t.scale ?? [1, 1, 1];
  const r = t.rotate ? eulerToMat3({ x: t.rotate[0], y: t.rotate[1], z: t.rotate[2] }) : null;
  const o = t.offset ?? [0, 0, 0];
  for (let i = 0; i < m.positions.length; i += 3) {
    let p: V3 = [m.positions[i] * s[0], m.positions[i + 1] * s[1], m.positions[i + 2] * s[2]];
    let nn: V3 = norm([m.normals[i] / (s[0] || 1), m.normals[i + 1] / (s[1] || 1), m.normals[i + 2] / (s[2] || 1)]);
    // a mirroring scale flips the surface; keep normals pointing the same way relative to it
    if (s[0] * s[1] * s[2] < 0) nn = scale(nn, -1);
    if (r) {
      p = apply(r, ...p);
      nn = apply(r, ...nn);
    }
    m.positions[i] = p[0] + o[0];
    m.positions[i + 1] = p[1] + o[1];
    m.positions[i + 2] = p[2] + o[2];
    m.normals[i] = nn[0];
    m.normals[i + 1] = nn[1];
    m.normals[i + 2] = nn[2];
  }
  if (s[0] * s[1] * s[2] < 0) for (let t3 = 0; t3 < m.indices.length; t3 += 3) [m.indices[t3 + 1], m.indices[t3 + 2]] = [m.indices[t3 + 2], m.indices[t3 + 1]];
}

/** Axis-aligned bounds. */
export function bounds(m: MeshData): { min: V3; max: V3 } {
  const min: V3 = [Infinity, Infinity, Infinity], max: V3 = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < m.positions.length; i += 3)
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], m.positions[i + k]);
      max[k] = Math.max(max[k], m.positions[i + k]);
    }
  return m.positions.length ? { min, max } : { min: [0, 0, 0], max: [0, 0, 0] };
}
