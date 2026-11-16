// Emission schedule of one layer over one loop.

import type { Emitter3D } from '../types3d';
import { evalCurve } from '../curve';
import { hash32, hashString } from '../simulate';

// Emission schedule (one loop)

export interface Schedule {
  times: Float64Array;
  /** Per birth: index within the births at the same time (a burst), and their number (the arc's burstSpread). */
  index: Int32Array;
  count: Int32Array;
}
/** Births come this much before their exact time (see scheduleFor). */
const EARLY = 1e-4;

export const scheduleCache = new Map<string, Schedule>();

export function scheduleFor(em: Emitter3D, duration: number): Schedule {
  const key = `${em.id}|${em.rate}|${em.startDelay}|${em.stopAfter}|${duration}|${JSON.stringify(em.rateCurve)}|${JSON.stringify(em.bursts)}`;
  const hit = scheduleCache.get(key);
  if (hit) return hit;
  const list: number[] = [];
  const start = Math.min(em.startDelay, duration);
  const end = em.stopAfter > 0 ? Math.min(em.stopAfter, duration) : duration;
  if (em.rate > 0 && end > start) {
    if (em.rateCurve.length) rateCurveTimes(em, duration, start, end, list);
    else {
      const k = Math.max(1, Math.round((end - start) * em.rate));
      const step = (end - start) / k;
      // like Unity's emission accumulator, the n-th particle comes when n are due (n / rate; measured in 2022.3),
      // a hair early (EARLY) so births never sit exactly on the 1/60 s step grid, where float noise decides
      for (let i = 0; i < k; i++) list.push(Math.max(start, start + (i + 1) * step - EARLY));
    }
  }
  // bursts: Unity's cycles every `interval`, each fired with `probability` (a fixed, per-layer pseudo-random draw)
  const seed = hashString(em.id);
  em.bursts.forEach((b, bi) => {
    const cycles = b.cycles ?? 1, interval = b.interval ?? 0.1, prob = b.probability ?? 1;
    for (let c = 0; c < cycles; c++) {
      const t = b.time + c * interval;
      if (t < 0 || t >= duration) break;
      if (prob < 1 && hash32(seed, bi * 131 + c) / 4294967296 >= prob) continue;
      for (let i = 0; i < b.count; i++) list.push(t);
    }
  });
  list.sort((a, b) => a - b);
  const times = Float64Array.from(list);
  const index = new Int32Array(times.length), count = new Int32Array(times.length);
  for (let i = 0; i < times.length; ) {
    let j = i;
    while (j < times.length && times[j] === times[i]) j++;
    for (let k = i; k < j; k++) { index[k] = k - i; count[k] = j - i; }
    i = j;
  }
  const s = { times, index, count };
  if (scheduleCache.size > 200) scheduleCache.clear();
  scheduleCache.set(key, s);
  return s;
}

/**
 * Emission times for a rate that follows `rateCurve` over the duration: the
 * i-th particle (from 1) is born where the accumulated count reaches i, like
 * Unity's emission accumulator.
 */
function rateCurveTimes(em: Emitter3D, duration: number, start: number, end: number, list: number[]) {
  const N = 2048;
  const dt = (end - start) / N;
  let acc = 0;
  let next = 1;
  for (let i = 0; i < N; i++) {
    const t0 = start + i * dt;
    const r = em.rate * evalCurve(em.rateCurve, Math.min(1, (t0 + dt / 2) / duration));
    const add = r * dt;
    while (add > 0 && acc + add >= next) {
      list.push(Math.max(start, t0 + ((next - acc) / add) * dt - EARLY));
      next += 1;
    }
    acc += add;
  }
}

export function upperBound(arr: Float64Array, v: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (arr[m] <= v) lo = m + 1;
    else hi = m;
  }
  return lo;
}

// ---------------------------------------------------------------------------
