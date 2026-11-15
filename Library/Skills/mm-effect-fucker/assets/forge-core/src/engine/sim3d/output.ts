// Per-layer output buffers: packed particles and trail polylines.

import { STRIDE3 } from './constants';
import type { PState } from './particle';

// Output buffers

export interface Out {
  data: Float32Array;
  count: number;
  cap: number;
  trails: Float32Array;
  trailFloats: number;
  trailCount: number;
}

export const buffers = new WeakMap<object, Out[]>();
export function outFor(owner: object, i: number, cap: number): Out {
  let list = buffers.get(owner);
  if (!list) buffers.set(owner, (list = []));
  let o = list[i];
  if (!o) list[i] = o = { data: new Float32Array(256 * STRIDE3), count: 0, cap, trails: new Float32Array(4096), trailFloats: 0, trailCount: 0 };
  o.count = 0;
  o.cap = cap;
  o.trailFloats = 0;
  o.trailCount = 0;
  return o;
}

/** Stable per-particle random in [0, 1) from its start values (does not touch the simulation's RNG). */
function stableRandom(p: PState): number {
  let h = Math.imul(Math.round(p.size0 * 1e6) ^ 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ Math.round(p.rot0 * 1e4), 0xc2b2ae35);
  h = Math.imul(h ^ Math.round(p.life * 1e6), 0x27d4eb2f);
  h = Math.imul(h ^ Math.round(p.cmix * 1e6), 0x165667b1);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/**
 * `f` is the life fraction (0..1, including lifetime lost in collisions); `ky` / `kz` the Y / Z
 * size relative to `size` (3D size), `rx` / `ry` the X / Y rotation in radians (3D rotation).
 * Layout: 0-2 position, 3 size, 4 rotation Z, 5-8 colour, 9-11 velocity, 12 life, 13 random,
 * 14 age, 15-16 size Y / Z factors, 17-18 rotation X / Y.
 */
export function pushParticle(o: Out, p: PState, size: number, rot: number, r: number, g: number, b: number, a: number, f: number, ky = 1, kz = 1, rx = 0, ry = 0) {
  if ((o.count + 1) * STRIDE3 > o.data.length) {
    const n = new Float32Array(o.data.length * 2);
    n.set(o.data);
    o.data = n;
  }
  const k = o.count * STRIDE3;
  const d = o.data;
  d[k] = p.x;
  d[k + 1] = p.y;
  d[k + 2] = p.z;
  d[k + 3] = size;
  d[k + 4] = rot;
  d[k + 5] = r / 255;
  d[k + 6] = g / 255;
  d[k + 7] = b / 255;
  d[k + 8] = a;
  d[k + 9] = p.vx + p.ax;
  d[k + 10] = p.vy + p.ay;
  d[k + 11] = p.vz + p.az;
  d[k + 12] = f;
  d[k + 13] = stableRandom(p);
  d[k + 14] = f * p.life; // age as Unity's shader sees it (AgePercent / InvStartLifetime)
  d[k + 15] = ky;
  d[k + 16] = kz;
  d[k + 17] = rx;
  d[k + 18] = ry;
  o.count++;
}

export function pushTrail(o: Out, pts: number[], size: number, r: number, g: number, b: number, a: number) {
  const n = pts.length / 4;
  if (n < 2) return;
  const need = o.trailFloats + 6 + pts.length;
  if (need > o.trails.length) {
    const t = new Float32Array(Math.max(need, o.trails.length * 2));
    t.set(o.trails.subarray(0, o.trailFloats));
    o.trails = t;
  }
  const t = o.trails;
  let k = o.trailFloats;
  t[k++] = n;
  t[k++] = size;
  t[k++] = r / 255;
  t[k++] = g / 255;
  t[k++] = b / 255;
  t[k++] = a;
  for (let i = 0; i < pts.length; i++) t[k++] = pts[i];
  o.trailFloats = k;
  o.trailCount++;
}
