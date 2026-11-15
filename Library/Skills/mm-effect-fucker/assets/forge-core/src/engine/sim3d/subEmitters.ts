// Sub-emitters: events of a parent layer's particles (birth, death,
// collision) spawn the child layer's particles.

import type { Effect3D, Emitter3D } from '../types3d';
import { hash32, hashString } from '../simulate';
import { Rng } from './math';
import { scheduleFor, upperBound } from './schedule';
import { cycleOffsets, layerDuration } from './layerTiming';
import { DT } from './constants';
import { makeCtx, spawn, step, look, sizeAt } from './particle';
import { runParticle, lingerShare } from './runParticle';
import { pushRibbons } from './ribbons';
import { dieOnCollision } from './floorCollision';
import type { Out } from './output';
import { visibleInTree, worldPose } from '../hierarchy3d';

// Parent particles of a sub-emitter

export interface ParentEvent {
  time: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  r: number; // colour multipliers 0..1 (parent's current colour)
  g: number;
  b: number;
  a: number; // parent's current alpha (Inherit Color multiplies it too)
  size: number; // parent's current size
  key: number; // stable id for seeding
  /** Birth sub-emitter: how many particles this event emits at once (a burst), else one. */
  count?: number;
}

/** A birth sub-emitter's bursts, in seconds after the parent's birth (each cycle of each burst). */
function birthBursts(sub: Emitter3D): { at: number; count: number }[] {
  const out: { at: number; count: number }[] = [];
  for (const b of sub.bursts) {
    if (b.count <= 0) continue;
    for (let c = 0; c < Math.max(1, b.cycles ?? 1); c++) out.push({ at: b.time + c * (b.interval ?? 0), count: b.count });
  }
  return out.sort((a, b) => a.at - b.at);
}

/** Trigger events of the parent layer that can still affect time t. */
export function parentEvents(effect: Effect3D, parent: Emitter3D, kind: 'birth' | 'death' | 'collision', from: number, t: number, sub: Emitter3D): ParentEvent[] {
  const sch = scheduleFor(parent, layerDuration(effect, parent));
  const pseed = hash32(effect.seed, hashString(parent.id));
  const pose = worldPose(effect, parent);
  const pc = makeCtx(effect, parent, pseed, pose.pos, pose.M);
  const maxLife = parent.startLifetime.max;
  const events: ParentEvent[] = [];
  const rate = sub.rate;
  const earliestBirth = from - maxLife;
  for (const off of cycleOffsets(effect, parent, earliestBirth, t)) {
    const lo = upperBound(sch.times, earliestBirth - off);
    const hi = upperBound(sch.times, t - off);
    for (let ei = lo; ei < hi; ei++) {
      const birth = off + sch.times[ei];
      const rng = new Rng(hash32(pseed, ei, 31));
      const life = parent.startLifetime.min + (parent.startLifetime.max - parent.startLifetime.min) * rng.next();
      const end = Math.min(birth + life, t);
      // particles can only die early when collisions take lifetime or kill slow particles
      const canDieEarly = parent.floor && (parent.lifetimeLoss > 0 || parent.minKillSpeed > 0);
      if (kind === 'death' && !canDieEarly && (birth + life < from || birth + life > t)) continue;
      const p = spawn(pc, rng, pose.pos.x, pose.pos.y, pose.pos.z, life);
      // seed by schedule slot only (not by cycle), so the loop repeats exactly
      const key = hash32(ei, 1000, 77);
      const snap = (time: number, n: number): ParentEvent => {
        const f = (time - birth) / life;
        const [r, g, b, a] = look(pc, p, Math.min(1, f));
        return {
          time,
          x: p.x,
          y: p.y,
          z: p.z,
          vx: p.vx + p.ax,
          vy: p.vy + p.ay,
          vz: p.vz + p.az,
          r: r / 255,
          g: g / 255,
          b: b / 255,
          a,
          size: sizeAt(parent, p, f),
          key: hash32(key, n, 5),
        };
      };
      // integrate the parent, emitting events on the way
      // work in time since the parent's birth, so every loop cycle rounds the same way
      const total = end - birth;
      const steps = Math.floor(total / DT + 1e-7);
      const rem0 = total - steps * DT;
      const rem = rem0 > 1e-6 ? rem0 : 0; // float noise must not add a step (and a collision event)
      const EPS = 1e-7;
      // Unity emits the first birth sub-particle one interval after the parent is born
      let n = 0;
      let lost = 0;
      let killedAt = -1;
      let hits = 0;
      // Rate over Distance: a birth sub-emitter moves with its parent particle
      const perMetre = kind === 'birth' ? sub.rateOverDistance : 0;
      let dist = 0;
      let m = 0;
      // a birth sub-emitter also plays its bursts, timed from the parent's birth
      const bursts = kind === 'birth' ? birthBursts(sub) : [];
      let bi = 0;
      for (let s = 0; s <= steps; s++) {
        const dt = s < steps ? DT : rem;
        if (dt <= 0) break;
        const tt = birth + s * DT;
        if (lost > 0 && tt - birth + lost >= life) {
          killedAt = tt; // lifetime used up by earlier collisions
          break;
        }
        while (bi < bursts.length && bursts[bi].at <= Math.min(s * DT + dt, total) + EPS) {
          const at = birth + bursts[bi].at;
          if (at >= from - EPS) events.push({ ...snap(at, 2000000 + bi), count: bursts[bi].count });
          bi++;
        }
        if (kind === 'birth' && rate > 0) {
          const relStop = Math.min(s * DT + dt, total);
          while ((n + 1) / rate <= relStop + EPS) {
            const at = birth + (n + 1) / rate;
            if (at >= from - EPS) events.push(snap(at, n));
            n++;
          }
        }
        const px = p.x, py = p.y, pz = p.z;
        const hit = step(pc, p, tt, dt, parent.floor ? sizeAt(parent, p, (tt - birth + lost) / life) : 0, (tt - birth + lost) / life);
        if (perMetre > 0) {
          dist += Math.hypot(p.x - px, p.y - py, p.z - pz);
          while ((m + 1) / perMetre <= dist + EPS) {
            if (tt + dt >= from - EPS) events.push(snap(tt + dt, 1000000 + m));
            m++;
          }
        }
        if (hit >= 0) {
          // Unity fires a Collision sub-emitter on every collision, resting contact included
          if (kind === 'collision' && tt + dt >= from) events.push(snap(tt + dt, hits));
          hits++;
          if (dieOnCollision(parent, p, hit, (lost += parent.lifetimeLoss * life), tt + dt - birth)) {
            killedAt = tt + dt;
            break;
          }
        }
      }
      if (kind === 'death') {
        const at = killedAt >= 0 ? killedAt : birth + life;
        if (at >= from && at <= t) events.push(snap(at, 0));
      }
    }
  }
  return events;
}

export function runSubEmitter(effect: Effect3D, sub: Emitter3D, parent: Emitter3D, t: number, o: Out) {
  const subSeed = hash32(effect.seed, hashString(sub.id));
  const c = makeCtx(effect, sub, subSeed, worldPose(effect, parent).pos);
  const linger = 1 + lingerShare(sub);
  const maxLife = sub.startLifetime.max * linger;
  const maxBurst = sub.bursts.reduce((m, b) => Math.max(m, b.time), 0);
  const kind = sub.subEvent;
  const events = parentEvents(effect, parent, kind, t - maxLife - (kind === 'birth' ? 0 : maxBurst), t, sub);
  const first = o.count;
  for (const ev of events) {
    const mult = {
      r: sub.inheritColor ? ev.r : 1,
      a: sub.inheritColor ? ev.a : 1,
      g: sub.inheritColor ? ev.g : 1,
      b: sub.inheritColor ? ev.b : 1,
      size: sub.inheritSize ? ev.size : 1,
    };
    const emitOne = (birth: number, k: number, index = 0, count = 1) => {
      if (birth > t || o.count >= o.cap) return;
      const rng = new Rng(hash32(subSeed, ev.key, k));
      const life = sub.startLifetime.min + (sub.startLifetime.max - sub.startLifetime.min) * rng.next();
      if (t - birth >= life * linger) return;
      const p = spawn(c, rng, ev.x, ev.y, ev.z, life, { time: birth - ev.time, index, count });
      p.vx += ev.vx * sub.inheritVelocity;
      p.vy += ev.vy * sub.inheritVelocity;
      p.vz += ev.vz * sub.inheritVelocity;
      runParticle(c, p, birth, t, o, mult);
    };
    if (kind === 'birth') {
      const n = ev.count ?? 1;
      for (let i = 0; i < n; i++) emitOne(ev.time, i, i, n);
    }
    else {
      let k = 0;
      for (const b of sub.bursts) for (let i = 0; i < b.count; i++) emitOne(ev.time + b.time, k++, i, b.count);
    }
  }
  if (sub.trails && sub.trailMode === 'ribbon') pushRibbons(sub, o, first);
}

export function subParent(effect: Effect3D, em: Emitter3D): Emitter3D | null {
  if (!em.subEmitterOf) return null;
  const p = effect.layers.find((l) => l.id === em.subEmitterOf);
  // one level only, never itself, never an empty node
  if (!p || p === em || p.subEmitterOf || p.empty || !visibleInTree(effect, p)) return null;
  return p;
}
