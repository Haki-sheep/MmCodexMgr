// Unity's Ribbon trails: instead of one trail per particle, the trail runs through the
// living particles of the layer in the order they were emitted (newest at the head),
// split over `trailRibbonCount` ribbons (particle i goes to ribbon i mod count). The
// ribbon takes the particles' size for its width and the newest particle's colour.

import type { Emitter3D } from '../types3d';
import { STRIDE3 } from './constants';
import { pushTrail, type Out } from './output';
import { evalCurve } from '../curve';
import { hexToRgb } from '../simulate';

/** Adds the ribbons through the particles written to `o` from index `from` on. */
export function pushRibbons(em: Emitter3D, o: Out, from: number) {
  const n = o.count - from;
  const count = Math.max(1, em.trailRibbonCount);
  if (n < 2) return;
  const d = o.data;
  for (let r = 0; r < count; r++) {
    const idx: number[] = [];
    for (let i = from + r; i < o.count; i += count) idx.push(i);
    if (idx.length < 2) continue;
    // newest particle first: the head of the ribbon
    idx.reverse();
    const pts: number[] = [];
    let size = 0;
    idx.forEach((i, j) => {
      const k = i * STRIDE3;
      pts.push(d[k], d[k + 1], d[k + 2], j / (idx.length - 1));
      size += d[k + 3];
    });
    size /= idx.length;
    const head = idx[0] * STRIDE3;
    const tc = hexToRgb(em.trailColor);
    const cr = em.trailInheritColor ? d[head + 5] * tc[0] : tc[0];
    const cg = em.trailInheritColor ? d[head + 6] * tc[1] : tc[1];
    const cb = em.trailInheritColor ? d[head + 7] * tc[2] : tc[2];
    const lifeA = em.trailLifeAlpha.length ? evalCurve(em.trailLifeAlpha, d[head + 12]) : 1;
    const a = (em.trailInheritColor ? d[head + 8] : em.alpha) * lifeA;
    pushTrail(o, pts, (em.trailSizeAffectsWidth ? size : 1) * em.trailWidth, cr, cg, cb, a);
  }
}
