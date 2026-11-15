// Lathe: a profile turned around an axis (funnels, tornadoes, cones, bowls,
// vases). U runs around (seam duplicated), V along the profile by arc length.

import type { MeshData } from '../meshData';
import type { LatheSource, V3 } from '../meshSource';
import { emptyMesh, norm } from './common';

export function buildLathe(s: LatheSource): MeshData {
  const m = emptyMesh();
  const rows = s.profile;
  const seg = s.segments;
  // V by arc length in the (height, radius) plane
  const arc = [0];
  for (let p = 1; p < rows.length; p++) arc.push(arc[p - 1] + Math.hypot(rows[p][0] - rows[p - 1][0], rows[p][1] - rows[p - 1][1]));
  const total = arc[arc.length - 1] || 1;
  // normals point away from the axis when the profile climbs; flip if it is written top-down
  const dir = rows[rows.length - 1][0] >= rows[0][0] ? 1 : -1;
  const twist = (s.twist * Math.PI) / 180;
  const place = (h: number, x: number, y: number): V3 => (s.axis === 'y' ? [x, h, y] : [x, y, h]);

  for (let p = 0; p < rows.length; p++) {
    const [h, r, oa, ob] = rows[p];
    const v = arc[p] / total;
    const [h0, r0] = rows[Math.max(0, p - 1)], [h1, r1] = rows[Math.min(rows.length - 1, p + 1)];
    const dh = (h1 - h0) * dir, dr = (r1 - r0) * dir;
    for (let k = 0; k <= seg; k++) {
      const a = (k / seg) * Math.PI * 2 + twist * v;
      const c = Math.cos(a), sn = Math.sin(a);
      m.positions.push(...place(h, c * r + oa, sn * r + ob));
      m.normals.push(...norm(place(-dr, c * dh, sn * dh), place(1, 0, 0)));
      m.uvs.push((k / seg) * s.uRepeat, v * s.vRepeat);
    }
  }
  const row = seg + 1;
  for (let p = 0; p + 1 < rows.length; p++)
    for (let k = 0; k < seg; k++) {
      const a = p * row + k;
      m.indices.push(a, a + 1, a + row + 1, a, a + row + 1, a + row);
    }
  return m;
}
