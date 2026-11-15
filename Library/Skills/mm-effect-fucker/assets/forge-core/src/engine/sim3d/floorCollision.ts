// Floor collision, following Unity's Collision module in Planes mode as FX
// Forge exports it (one plane at floorY, Radius Scale = the layer's collisionRadiusScale, 0.05 by default). Measured in
// 6000.3 with 1/60 s steps:
//  - the particle collides whenever its new position is closer to the plane
//    than its radius (current size x 0.5 x radius scale), whichever way it is
//    moving: a particle still under the floor after a step (born below it,
//    say) is pushed out and loses its upward speed
//  - the normal velocity flips and is scaled by Bounce, then the whole
//    velocity by (1 - Dampen); the part of the step that went past the radius
//    is reflected the same way (radius + overshoot x bounce x (1 - dampen))
//  - every such step is a collision, resting and sliding contact included
//  - Min Kill Speed compares the speed the particle hits the floor with, not
//    the speed it leaves with
//  - Lifetime Loss takes lifetimeLoss x start lifetime per collision

import type { Emitter3D } from '../types3d';
import type { PState } from './particle';

/** Radius Scale of the exported Collision module (FxForgeModules.cs). */

/**
 * Collides the particle (after it has moved this step) with the floor.
 * `size` is its current size. Returns the speed it hit the floor with, or -1
 * when it did not touch it.
 */
export function collideFloor(em: Emitter3D, p: PState, size: number): number {
  const top = em.floorY + 0.5 * em.collisionRadiusScale * size;
  if (p.y >= top) return -1;
  const hitSpeed = Math.hypot(p.vx, p.vy, p.vz);
  const k = 1 - em.dampen;
  p.y = top + (top - p.y) * em.bounce * k;
  p.vy = -p.vy * em.bounce;
  p.vx *= k;
  p.vy *= k;
  p.vz *= k;
  return hitSpeed;
}

/** After a collision: does Unity's Min Kill Speed or Lifetime Loss remove the particle? */
export function dieOnCollision(em: Emitter3D, p: PState, hitSpeed: number, lost: number, age: number): boolean {
  if (em.minKillSpeed > 0 && hitSpeed < em.minKillSpeed) return true;
  return em.lifetimeLoss > 0 && age + lost >= p.life;
}
