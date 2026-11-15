// When a 3D layer's emission cycles happen on the effect clock, following
// Unity's per-system timing (measured in 2022.3):
// - each system loops over its own Duration (`loopDuration`, 0 = the effect's);
// - Start Delay (`startOffset`) shifts the whole system once: with Looping and
//   no Prewarm the first cycle starts at the delay, and cycles follow every Duration;
// - Looping + Prewarm ('perfect') is already in its steady, periodic state at t = 0;
// - Looping without Prewarm ('loop') starts empty at t = 0 and builds up;
// - not looping ('once') runs one cycle.

import type { Effect3D, Emitter3D } from '../types3d';

/** The layer's cycle length in seconds. */
export function layerDuration(effect: Effect3D, em: Emitter3D): number {
  return em.loopDuration > 0 ? em.loopDuration : effect.duration;
}

/**
 * Start times (effect clock) of the layer's cycles that can hold births in
 * [from, t], oldest first. A birth is `offset + schedule time`.
 */
export function cycleOffsets(effect: Effect3D, em: Emitter3D, from: number, t: number): number[] {
  const L = layerDuration(effect, em);
  const o = em.startOffset;
  let first: number, last: number;
  if (effect.loop === 'once') first = last = 0;
  else {
    last = Math.floor((t - o) / L);
    first = effect.loop === 'loop' ? 0 : Math.floor((from - o) / L) - 1;
  }
  const out: number[] = [];
  for (let c = first; c <= last; c++) {
    const off = o + c * L;
    if (off + L <= from) continue;
    if (off > t) break;
    out.push(off);
  }
  return out;
}
