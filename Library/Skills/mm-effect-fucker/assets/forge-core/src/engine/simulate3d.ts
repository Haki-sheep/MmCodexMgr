// Deterministic 3D particle simulation, following Unity's ParticleSystem
// module semantics closely enough that the preview reads like the Unity
// result. Same loop trick as the 2D engine: in "perfect" mode the spawn
// schedule repeats every `duration` and frame 0 contains the previous cycle's
// tail (Unity equivalent: looping + prewarm).
//
// Behaviour measured in Unity 2022.3 and matched here:
//  - orbital velocity is radians/s; orbitalY = 1 moves +X toward -Z
//  - limit-velocity drag is a constant deceleration of the TOTAL velocity
//    (velocity + velocity-over-lifetime/orbital/radial/noise) that stops at zero
//  - cone directions point away from a virtual apex (full angle at the rim)
//  - noise: RMS speed ~ 1.28 * strength * frequency^0.92, isotropic
//  - sub-emitters: Death/Collision fire the child's bursts once per event at
//    the parent's position; Birth runs the child's rate per living parent
//  - inherit velocity (Initial): child start velocity += parent velocity * k
//
// Coordinates are Unity's (left-handed, Y up). The preview flips Z when drawing.

import type { Effect3D, Emitter3D } from './types3d';
import { hash32, hashString } from './simulate';
import { Rng } from './sim3d/math';
import { scheduleFor, upperBound } from './sim3d/schedule';
import { cycleOffsets, layerDuration } from './sim3d/layerTiming';
import { makeCtx, spawn } from './sim3d/particle';
import { runParticle, lingerShare } from './sim3d/runParticle';
import { pushRibbons } from './sim3d/ribbons';
import { outFor } from './sim3d/output';
import { runSubEmitter, subParent } from './sim3d/subEmitters';
import { visibleInTree, worldPose } from './hierarchy3d';
import type { Mat3 } from './sim3d/math';

export { STRIDE3 } from './sim3d/constants';
export { eulerToMat3, type Mat3 } from './sim3d/math';
export { easeSize as sizeCurve3D } from './sim3d/curves';
export { subParent };

export interface LayerFrame3D {
  emitter: Emitter3D;
  count: number;
  data: Float32Array;
  /** Trails: per trail [n, size, r, g, b, a] then n points of [x, y, z, u] (u: 0 head .. 1 tail). */
  trails: Float32Array;
  trailFloats: number;
  trailCount: number;
  /** The layer's rotation relative to the effect root (mesh alignment 'local'). */
  rot: Mat3;
}

// ---------------------------------------------------------------------------

export function simulateFrame3D(effect: Effect3D, tEffect: number, owner: object = simulateFrame3D): LayerFrame3D[] {
  return effect.layers.map((em, li) => {
    const o = outFor(owner, li, em.maxParticles);
    const parent = subParent(effect, em);
    const pose = worldPose(effect, em);
    const shown = !em.empty && visibleInTree(effect, em);
    if (shown && parent) {
      runSubEmitter(effect, em, parent, tEffect * parent.simulationSpeed, o);
    } else if (shown && (!em.subEmitterOf || !effect.layers.some((x) => x.id === em.subEmitterOf))) {
      // normal layer (a link to a deleted parent falls back to this too)
      // Simulation Speed: the layer's own clock runs faster or slower
      const t = tEffect * em.simulationSpeed;
      const sch = scheduleFor(em, layerDuration(effect, em));
      const eseed = hash32(effect.seed, hashString(em.id));
      const first = o.count;
      const c = makeCtx(effect, em, eseed, pose.pos, pose.M);
      const linger = 1 + lingerShare(em);
      const maxLife = em.startLifetime.max * linger;
      const windowStart = t - maxLife;
      // the cycle starting at t = D counts too, so that frame D equals frame 0 (bursts at time 0)
      for (const off of cycleOffsets(effect, em, windowStart, t)) {
        if (o.count >= o.cap) break;
        const lo = upperBound(sch.times, windowStart - off);
        const hi = upperBound(sch.times, t - off);
        for (let ei = lo; ei < hi && o.count < o.cap; ei++) {
          const birth = off + sch.times[ei];
          const rng = new Rng(hash32(eseed, ei, 31));
          const life = em.startLifetime.min + (em.startLifetime.max - em.startLifetime.min) * rng.next();
          if (t - birth < 0 || t - birth >= life * linger) continue;
          const p = spawn(c, rng, pose.pos.x, pose.pos.y, pose.pos.z, life, { time: birth - em.startOffset, index: sch.index[ei], count: sch.count[ei] });
          runParticle(c, p, birth, t, o, null);
        }
      }
      if (em.trails && em.trailMode === 'ribbon') pushRibbons(em, o, first);
    }
    return { emitter: em, count: o.count, data: o.data, trails: o.trails, trailFloats: o.trailFloats, trailCount: o.trailCount, rot: pose.M };
  });
}

export function countParticles3D(frames: LayerFrame3D[]): number {
  return frames.reduce((s, f) => s + f.count, 0);
}
