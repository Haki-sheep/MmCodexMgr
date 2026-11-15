// Running one particle from its birth to the sampled time and writing it (and its
// trail, including a trail that outlives its particle) to the layer's output.

import type { Emitter3D } from '../types3d';
import { hexToRgb } from '../simulate';
import { evalCurve } from '../curve';
import { DT, TRAIL_STEP, MAX_TRAIL_POINTS } from './constants';
import { pushParticle, pushTrail, type Out } from './output';
import { dieOnCollision } from './floorCollision';
import { step, sizeAt, sizeAxes, look, rotationAt, type Ctx, type PState } from './particle';

/**
 * Integrate a particle from `birth` to `t` and write it (and its trail).
 * `mult` multiplies colour and size (sub-emitter inheritance).
 */
export function runParticle(c: Ctx, p: PState, birth: number, t: number, o: Out, mult: { r: number; g: number; b: number; a?: number; size: number } | null) {
  const age = t - birth;
  // a dead particle is only run for a trail that outlives it (Die with Particles off)
  const dead = age >= p.life;
  const simAge = dead ? p.life : age;
  const steps = Math.floor(simAge / DT + 1e-7);
  const rem0 = simAge - steps * DT;
  const rem = rem0 > 1e-6 ? rem0 : 0; // float noise must not add a step (and a floor contact)
  const trailSecs = p.hasTrail ? c.trailLife * p.life : 0;
  const pts: number[] | null = trailSecs > 0 ? [] : null;
  const trailStart = t - trailSecs;
  const em = c.em;
  let lost = 0;
  for (let s = 0; s <= steps; s++) {
    const dt = s < steps ? DT : rem;
    if (dt <= 0) break;
    const tt = birth + s * DT;
    if (pts && tt >= trailStart && s % TRAIL_STEP === 0) pts.push(p.x, p.y, p.z, (t - tt) / trailSecs);
    const radiusSize = em.floor ? sizeAt(em, p, (tt - birth + lost) / p.life) * (mult ? mult.size : 1) : 0;
    const hit = step(c, p, tt, dt, radiusSize, (tt - birth + lost) / p.life);
    if (hit >= 0 && dieOnCollision(em, p, hit, (lost += em.lifetimeLoss * p.life), tt + dt - birth)) return;
  }
  if (dead) {
    if (pts && lost === 0) lingeringTrail(c, p, pts, birth + p.life, t, trailSecs, o, mult);
    return;
  }
  if (age + lost >= p.life) return; // used up its lifetime in collisions
  // lifetime lost in collisions moves the particle along its colour and size curves
  const f = Math.min(1, (age + lost) / p.life);
  let size = sizeAt(em, p, f);
  let [cr, cg, cb, a] = look(c, p, f);
  if (mult) {
    cr *= mult.r;
    cg *= mult.g;
    cb *= mult.b;
    a *= mult.a ?? 1;
    size *= mult.size;
  }
  if (a <= 0.003 || size <= 0.0005) return;
  if (o.count >= o.cap) return;
  const [ky, kz] = em.startSize3D || em.sizeCurveY.length || em.sizeCurveZ.length ? sizeAxes(em, p, f) : [1, 1];
  const d2r = Math.PI / 180;
  pushParticle(o, p, size, rotationAt(em, p, age) * d2r, cr, cg, cb, a, f, ky, kz, (p.rx0 + p.spinX * age) * d2r, (p.ry0 + p.spinY * age) * d2r);
  if (pts) {
    pts.push(p.x, p.y, p.z, 0);
    // keep newest points if the trail is long
    let list = pts;
    const n = pts.length / 4;
    if (n > MAX_TRAIL_POINTS) {
      const keep: number[] = [];
      const stepN = n / MAX_TRAIL_POINTS;
      for (let i = 0; i < MAX_TRAIL_POINTS - 1; i++) {
        const j = Math.floor(i * stepN) * 4;
        keep.push(pts[j], pts[j + 1], pts[j + 2], pts[j + 3]);
      }
      keep.push(...pts.slice(pts.length - 4));
      list = keep;
    }
    trailOut(c, list, f, size, cr, cg, cb, a, o);
  }
}

/** Write a trail whose particle (colour, size and alpha at life fraction f) is as given. */
function trailOut(c: Ctx, list: number[], f: number, size: number, cr: number, cg: number, cb: number, a: number, o: Out) {
  const em = c.em;
  const tc = hexToRgb(em.trailColor);
  const tr = em.trailInheritColor ? (cr * tc[0]) / 255 : tc[0];
  const tg = em.trailInheritColor ? (cg * tc[1]) / 255 : tc[1];
  const tb = em.trailInheritColor ? (cb * tc[2]) / 255 : tc[2];
  const lifeA = em.trailLifeAlpha.length ? evalCurve(em.trailLifeAlpha, f) : 1;
  // Size affects Width off: the width is in metres, not a multiple of the particle size
  pushTrail(o, list, (em.trailSizeAffectsWidth ? size : 1) * em.trailWidth, tr, tg, tb, (em.trailInheritColor ? a : em.alpha) * lifeA);
}

/**
 * The trail of a particle that died at `death` while its trail lives on (Die with Particles
 * off): it keeps the particle's last look and shortens from the tail as its points expire;
 * its head stays the start of the trail (u = 0).
 */
function lingeringTrail(c: Ctx, p: PState, pts: number[], death: number, t: number, trailSecs: number, o: Out, mult: { r: number; g: number; b: number; a?: number; size: number } | null) {
  const head = (t - death) / trailSecs;
  if (head >= 1) return;
  pts.push(p.x, p.y, p.z, head);
  for (let i = 3; i < pts.length; i += 4) pts[i] = (pts[i] - head) / (1 - head);
  const f = 1 - 1e-4;
  let size = sizeAt(c.em, p, f);
  let [cr, cg, cb, a] = look(c, p, f);
  if (mult) {
    cr *= mult.r;
    cg *= mult.g;
    cb *= mult.b;
    a *= mult.a ?? 1;
    size *= mult.size;
  }
  trailOut(c, pts.length / 4 > MAX_TRAIL_POINTS ? pts.slice(pts.length - MAX_TRAIL_POINTS * 4) : pts, f, size, cr, cg, cb, a, o);
}

/** How long a layer's particles stay in the simulation after they die (a trail that outlives them), as a share of their life. */
export function lingerShare(em: Emitter3D): number {
  return em.trails && !em.trailDieWithParticles ? em.trailLifetime : 0;
}

// ---------------------------------------------------------------------------
