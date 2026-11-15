// Sweep: a ribbon or a round tube along a path (spiral bands, slash arcs,
// coils, lightning-like strands). U runs along the path by length, V across.

import type { MeshData } from '../meshData';
import type { SweepSource, V3 } from '../meshSource';
import { add, cross, dot, emptyMesh, len, norm, scale, sub } from './common';

/** Path samples with their fractional index into the original points (for per-point widths). */
function resample(path: V3[], smooth: boolean): { p: V3; f: number }[] {
  if (!smooth || path.length < 3) return path.map((p, i) => ({ p, f: i }));
  // enough to round sparse paths; dense paths (helices) need little more
  const steps = Math.max(1, Math.min(8, Math.floor(256 / path.length)));
  const at = (i: number) => path[Math.max(0, Math.min(path.length - 1, i))];
  const out: { p: V3; f: number }[] = [];
  for (let i = 0; i + 1 < path.length; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      const c = (k: number) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push({ p: [c(0), c(1), c(2)], f: i + t });
    }
  }
  out.push({ p: path[path.length - 1], f: path.length - 1 });
  return out;
}

function widthAt(s: SweepSource, f: number): number {
  const w = s.width;
  if (w.length === 1) return w[0];
  const x = (f / Math.max(1, s.path.length - 1)) * (w.length - 1);
  const i = Math.min(w.length - 2, Math.floor(x));
  return w[i] + (w[i + 1] - w[i]) * (x - i);
}

export function buildSweep(s: SweepSource): MeshData {
  const pts = resample(s.path, s.smooth);
  const arc = [0];
  for (let i = 1; i < pts.length; i++) arc.push(arc[i - 1] + len(sub(pts[i].p, pts[i - 1].p)));
  const total = arc[arc.length - 1] || 1;
  const up = norm(s.up, [0, 1, 0]);
  const twist = (s.twist * Math.PI) / 180;
  const cols = s.sides ? s.sides + 1 : 2;
  const m = emptyMesh();
  let prevSide: V3 | null = null;

  for (let i = 0; i < pts.length; i++) {
    const t = norm(sub(pts[Math.min(pts.length - 1, i + 1)].p, pts[Math.max(0, i - 1)].p));
    let side = cross(t, up);
    // path parallel to up: keep the last good side (or any perpendicular)
    if (len(side) < 1e-6) side = prevSide ?? cross(t, Math.abs(t[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1]);
    side = norm(sub(side, scale(t, dot(side, t))));
    prevSide = side;
    let b = norm(cross(side, t));
    const u = arc[i] / total;
    const th = twist * u;
    [side, b] = [add(scale(side, Math.cos(th)), scale(b, Math.sin(th))), add(scale(side, -Math.sin(th)), scale(b, Math.cos(th)))];
    const r = widthAt(s, pts[i].f) / 2;
    const p = pts[i].p;
    if (!s.sides) {
      const [wd, nn] = s.widthAxis === 'side' ? [side, b] : [b, side];
      m.positions.push(...sub(p, scale(wd, r)), ...add(p, scale(wd, r)));
      m.normals.push(...nn, ...nn);
      m.uvs.push(u * s.uRepeat, 0, u * s.uRepeat, s.vRepeat);
    } else {
      for (let k = 0; k <= s.sides; k++) {
        const a = (k / s.sides) * Math.PI * 2;
        const d = add(scale(side, Math.cos(a)), scale(b, Math.sin(a)));
        m.positions.push(...add(p, scale(d, r)));
        m.normals.push(...d);
        m.uvs.push(u * s.uRepeat, (k / s.sides) * s.vRepeat);
      }
    }
  }
  for (let i = 0; i + 1 < pts.length; i++)
    for (let k = 0; k + 1 < cols; k++) {
      const a = i * cols + k;
      m.indices.push(a, a + 1, a + cols + 1, a, a + cols + 1, a + cols);
    }
  return m;
}
