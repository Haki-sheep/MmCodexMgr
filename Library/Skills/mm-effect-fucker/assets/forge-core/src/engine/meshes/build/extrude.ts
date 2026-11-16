// Extrude: a 2D outline in the XY plane. Flat (depth 0) it is a shaped card
// facing -Z like the quad; with depth it gets a back face and side walls.
// UVs on the faces fill 0..1 over the outline's bounds.

import type { MeshData } from '../meshData';
import type { ExtrudeSource } from '../meshSource';
import { emptyMesh } from './common';
import { signedArea, triangulate } from './triangulate';

export function buildExtrude(s: ExtrudeSource): MeshData {
  let pts = s.outline.slice();
  const [f, l] = [pts[0], pts[pts.length - 1]];
  if (pts.length > 3 && Math.hypot(f[0] - l[0], f[1] - l[1]) < 1e-9) pts = pts.slice(0, -1);
  if (signedArea(pts) < 0) pts.reverse();
  const tris = triangulate(pts);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) (x0 = Math.min(x0, x)), (x1 = Math.max(x1, x)), (y0 = Math.min(y0, y)), (y1 = Math.max(y1, y));
  const w = x1 - x0 || 1, h = y1 - y0 || 1;
  const m = emptyMesh();
  const half = s.depth / 2;

  const face = (z: number, nz: number) => {
    const base = m.positions.length / 3;
    for (const [x, y] of pts) {
      m.positions.push(x, y, z);
      m.normals.push(0, 0, nz);
      m.uvs.push((x - x0) / w, (y - y0) / h);
    }
    for (let t = 0; t < tris.length; t += 3) m.indices.push(base + tris[t], base + tris[t + 1], base + tris[t + 2]);
  };
  face(-half, -1);
  if (s.depth <= 0) return m;
  face(half, 1);

  // side walls, one quad per edge with its own outward normal
  let perim = 0;
  const edge = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    perim += d;
    return d;
  });
  let u = 0;
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
    const d = edge[i] || 1;
    const nx = (by - ay) / d, ny = -(bx - ax) / d; // outward for a counter-clockwise outline
    const u0 = u / perim, u1 = (u + edge[i]) / perim;
    u += edge[i];
    const base = m.positions.length / 3;
    m.positions.push(ax, ay, -half, bx, by, -half, bx, by, half, ax, ay, half);
    for (let k = 0; k < 4; k++) m.normals.push(nx, ny, 0);
    m.uvs.push(u0, 0, u1, 0, u1, 1, u0, 1);
    m.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return m;
}
