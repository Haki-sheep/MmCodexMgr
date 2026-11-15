// Birth position and direction for Unity's emission shapes.

import type { Emitter3D } from '../types3d';

/** Where a particle sits in its emission: time since the layer started emitting, index in its burst, burst size. */
export interface ArcSlot {
  time: number;
  index: number;
  count: number;
}

/**
 * Angle around the arc (radians) for Unity's arc modes, measured in 2022.3: loop =
 * (360 x speed x time) mod arc; pingpong goes back and forth over the same phase;
 * burstSpread = arc x i / n (n - 1 for a partial arc); spread snaps down to multiples of
 * spread x arc. One random number is always drawn, so switching modes keeps the others.
 */
export function arcAngle(em: Emitter3D, r: () => number, slot?: ArcSlot): number {
  const arc = em.arc;
  const rnd = r();
  let a = rnd * arc;
  if (slot && arc > 0) {
    const turn = 360 * em.arcSpeed * slot.time;
    if (em.arcMode === 'loop') a = ((turn % arc) + arc) % arc;
    else if (em.arcMode === 'pingpong') {
      const p = (((turn / arc) % 2) + 2) % 2;
      a = arc * (p <= 1 ? p : 2 - p);
    } else if (em.arcMode === 'burstSpread') {
      const n = arc >= 360 ? slot.count : slot.count - 1;
      a = n > 0 ? (arc * slot.index) / n : 0;
    }
  }
  if (em.arcSpread > 0 && arc > 0) {
    const step = em.arcSpread * arc;
    a = Math.floor(a / step + 1e-6) * step;
  }
  return (a * Math.PI) / 180;
}

type Sample = [number, number, number, number, number, number];

/**
 * Birth position (local) and direction (local, unit) for Unity's shapes. The shape scale
 * (`boxSize`; the size of a box or rectangle) stretches the other shapes as measured in
 * 2022.3: position x scale, direction = normalize(direction x scale), +Z when that is zero.
 */
export function shapeSample(em: Emitter3D, r: () => number, slot?: ArcSlot): Sample {
  const s = unscaled(em, r, slot);
  if (em.shape === 'box' || em.shape === 'rectangle') return s;
  const { x, y, z } = em.boxSize;
  if (x === 1 && y === 1 && z === 1) return s;
  const dx = s[3] * x, dy = s[4] * y, dz = s[5] * z;
  const n = Math.hypot(dx, dy, dz);
  return n > 1e-9 ? [s[0] * x, s[1] * y, s[2] * z, dx / n, dy / n, dz / n] : [s[0] * x, s[1] * y, s[2] * z, 0, 0, 1];
}

function unscaled(em: Emitter3D, r: () => number, slot?: ArcSlot): Sample {
  const R = em.radius;
  const thick = em.radiusThickness;
  const shell = (dim: number) => R * Math.pow(1 - thick * r(), 1 / dim);
  switch (em.shape) {
    case 'sphere':
    case 'hemisphere': {
      const u = 2 * r() - 1;
      const th = r() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const dx = s * Math.cos(th), dy = s * Math.sin(th);
      let dz = u;
      if (em.shape === 'hemisphere') dz = Math.abs(dz);
      const rr = shell(3);
      return [dx * rr, dy * rr, dz * rr, dx, dy, dz];
    }
    case 'circle': {
      const th = arcAngle(em, r, slot);
      const rr = shell(2);
      const dx = Math.cos(th), dy = Math.sin(th);
      return [dx * rr, dy * rr, 0, dx, dy, 0];
    }
    case 'cone':
    case 'coneVolume': {
      const th = arcAngle(em, r, slot);
      const rr = shell(2);
      const tanA = Math.tan((Math.min(em.angle, 89.9) * Math.PI) / 180);
      const dx = Math.cos(th), dy = Math.sin(th);
      const k = R > 0 ? (rr / R) * tanA : tanA * Math.sqrt(r());
      const n = Math.hypot(k, 1);
      const ux = (dx * k) / n, uy = (dy * k) / n, uz = 1 / n;
      if (em.shape === 'cone') return [dx * rr, dy * rr, 0, ux, uy, uz];
      // Unity's cone volume: born somewhere along the direction from the base, up to the cone's length
      const along = (r() * em.coneLength) / Math.max(1e-6, uz);
      return [dx * rr + ux * along, dy * rr + uy * along, uz * along, ux, uy, uz];
    }
    case 'box': {
      const b = em.boxSize;
      return [(r() - 0.5) * b.x, (r() - 0.5) * b.y, (r() - 0.5) * b.z, 0, 0, 1];
    }
    case 'rectangle': {
      // Unity's rectangle: the XY plane, scaled by the shape scale, emitting along +Z
      const b = em.boxSize;
      return [(r() - 0.5) * b.x, (r() - 0.5) * b.y, 0, 0, 0, 1];
    }
    case 'donut': {
      // a ring of `radius` in the XY plane, with a round tube of `donutRadius`; directions point away from the tube's centre line
      const th = arcAngle(em, r, slot);
      const cx = Math.cos(th) * R, cy = Math.sin(th) * R;
      const ph = r() * Math.PI * 2;
      const tube = em.donutRadius * Math.sqrt(1 - thick * r());
      const ox = Math.cos(th) * Math.cos(ph), oy = Math.sin(th) * Math.cos(ph), oz = Math.sin(ph);
      return [cx + ox * tube, cy + oy * tube, oz * tube, ox, oy, oz];
    }
    case 'edge':
      return [(r() - 0.5) * 2 * R, 0, 0, 0, 1, 0];
  }
}

// ---------------------------------------------------------------------------
