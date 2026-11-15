// One particle: start values, integration step, size, rotation and colour. Running it
// from birth to the sampled time is in runParticle.ts, floor collisions in floorCollision.ts.

import type { Effect3D, Emitter3D, Vec3 } from '../types3d';
import { hexToRgb } from '../simulate';
import { Rng, eulerToMat3, apply, type Mat3 } from './math';
import { wavesFor, WAVE_RMS, type Wave } from './noise';
import { easeSize } from './curves';
import { evalCurve, integrateCurve, type Curve } from '../curve';
import { shapeSample, type ArcSlot } from './shapes';
import { GRAVITY } from './constants';
import { collideFloor } from './floorCollision';
import { layerDuration } from './layerTiming';

// Per-layer integration context

export interface Ctx {
  em: Emitter3D;
  M: Mat3;
  // centre for radial and orbital motion (the system's position)
  cx: number;
  cy: number;
  cz: number;
  waves: Wave[] | null;
  noiseK: number;
  orb: boolean;
  axes: [number, number, number][];
  fx: number;
  fy: number;
  fz: number;
  stops: { t: number; rgb: [number, number, number] }[];
  c1: [number, number, number];
  c2: [number, number, number];
  /** Start Color gradient (empty: c1 / c2), and the layer's loop length its 'time' mode runs over. */
  startStops: { t: number; rgb: [number, number, number] }[];
  loop: number;
  trailLife: number; // fraction of particle life
}

/** `M` is the layer's rotation relative to the effect root (its own rotation unless it has a parent). */
export function makeCtx(effect: Effect3D, em: Emitter3D, seed: number, centre: Vec3, M: Mat3 = eulerToMat3(em.rotation)): Ctx {
  // orbital and radial motion turn around the layer origin moved by the Offset (in the layer's axes)
  const [ox, oy, oz] = apply(M, em.orbitalOffset.x, em.orbitalOffset.y, em.orbitalOffset.z);
  return {
    em,
    M,
    cx: centre.x + ox,
    cy: centre.y + oy,
    cz: centre.z + oz,
    waves: em.noiseStrength > 0 ? wavesFor(seed, em.noiseFrequency, em.noiseScroll, effect.duration, em.noiseOctaves, em.noiseOctaveMultiplier, em.noiseOctaveScale) : null,
    noiseK: (em.noiseStrength * 1.28 * Math.pow(em.noiseFrequency, 0.92)) / WAVE_RMS,
    orb: em.orbital.x !== 0 || em.orbital.y !== 0 || em.orbital.z !== 0,
    axes: [apply(M, 1, 0, 0), apply(M, 0, 1, 0), apply(M, 0, 0, 1)],
    fx: em.force.x,
    fy: em.force.y + GRAVITY * em.gravityModifier,
    fz: em.force.z,
    stops: em.colors.map((c) => ({ t: c.t, rgb: hexToRgb(c.color) })),
    c1: hexToRgb(em.startColor),
    c2: hexToRgb(em.startColor2),
    startStops: em.startGradient.map((s) => ({ t: s.t, rgb: hexToRgb(s.color) })),
    loop: layerDuration(effect, em),
    trailLife: em.trails ? em.trailLifetime : 0,
  };
}

/** Mutable particle state. */
export interface PState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  ax: number; // last animated (non-accumulating) velocity
  ay: number;
  az: number;
  life: number;
  size0: number;
  /** -1 for particles whose rotation is flipped (Flip Rotation), else 1. */
  flip: number;
  rot0: number;
  spin: number;
  /** Degrees turned so far by Rotation by Speed. */
  rotBySpeed: number;
  // 3D start size / rotation (equal to size0 / 0 when the layer has none)
  size0y: number;
  size0z: number;
  rx0: number;
  ry0: number;
  spinX: number;
  spinY: number;
  cmix: number;
  /** Where the particle's start colour sits on the Start Color gradient (0..1). */
  cu: number;
  hasTrail: boolean;
}

function velocityAt(curve: Curve, constant: number, fraction: number): number {
  return curve.length ? evalCurve(curve, fraction) : constant;
}

/** Draw a new particle's start values. Position/direction are relative to (ox, oy, oz). */
export function spawn(c: Ctx, rng: Rng, ox: number, oy: number, oz: number, life: number, slot?: ArcSlot): PState {
  const em = c.em;
  const rr = () => rng.next();
  const [lx, ly, lz, dlx, dly, dlz] = shapeSample(em, rr, slot);
  let ddx = dlx, ddy = dly, ddz = dlz;
  const u = 2 * rr() - 1;
  const th = rr() * Math.PI * 2;
  if (em.randomDirection > 0) {
    const s = Math.sqrt(1 - u * u);
    const k = em.randomDirection;
    ddx = dlx * (1 - k) + s * Math.cos(th) * k;
    ddy = dly * (1 - k) + s * Math.sin(th) * k;
    ddz = dlz * (1 - k) + u * k;
    const n = Math.hypot(ddx, ddy, ddz) || 1;
    ddx /= n;
    ddy /= n;
    ddz /= n;
  }
  const speed = em.startSpeed.min + (em.startSpeed.max - em.startSpeed.min) * rr();
  const size0 = em.startSize.min + (em.startSize.max - em.startSize.min) * rr();
  const rot0 = em.startRotation.min + (em.startRotation.max - em.startRotation.min) * rr();
  const spin = em.spin.min + (em.spin.max - em.spin.min) * rr();
  const cmix = rr();
  const hasTrail = em.trails && rr() < em.trailRatio && em.trailMode !== 'ribbon';
  // drawn after everything else, so layers without them keep their old random sequence
  const pick = (r: { min: number; max: number }) => r.min + (r.max - r.min) * rr();
  const size0y = em.startSize3D ? pick(em.startSizeY) : size0;
  const size0z = em.startSize3D ? pick(em.startSizeZ) : size0;
  let rx0 = em.startRotation3D ? pick(em.startRotationX) : 0;
  let ry0 = em.startRotation3D ? pick(em.startRotationY) : 0;
  const spinX = em.startRotation3D ? pick(em.spinX) : 0;
  const spinY = em.startRotation3D ? pick(em.spinY) : 0;
  // Spherize Direction: toward pointing out from the shape's centre
  if (em.spherizeDirection > 0) {
    const pl = Math.hypot(lx, ly, lz);
    if (pl > 1e-6) {
      const k = em.spherizeDirection;
      ddx = ddx * (1 - k) + (lx / pl) * k;
      ddy = ddy * (1 - k) + (ly / pl) * k;
      ddz = ddz * (1 - k) + (lz / pl) * k;
      const n = Math.hypot(ddx, ddy, ddz) || 1;
      ddx /= n;
      ddy /= n;
      ddz /= n;
    }
  }
  // Align to Direction (meshes): Unity turns the mesh by LookRotation(dx, dy, -dz) (measured in 2022.3, z mirrored)
  if (em.alignToDirection) {
    rx0 = (-Math.asin(Math.max(-1, Math.min(1, ddy))) * 180) / Math.PI;
    ry0 = (Math.atan2(ddx, -ddz) * 180) / Math.PI;
  }
  // Flip Rotation: that share of particles turns the other way (start rotation and spin; drawn last)
  const flip = em.flipRotation > 0 && rr() < em.flipRotation ? -1 : 1;
  // Start Color gradient: the birth time in the layer's loop, or a random point (the colour mix)
  const birth = slot ? slot.time : 0;
  const cu = em.startGradientMode === 'random' ? cmix : c.loop > 0 ? Math.min(1, Math.max(0, birth / c.loop - Math.floor(birth / c.loop + 1e-9))) : 0;
  const [px, py, pz] = apply(c.M, lx, ly, lz);
  const [vx, vy, vz] = apply(c.M, ddx * speed, ddy * speed, ddz * speed);
  return { x: px + ox, y: py + oy, z: pz + oz, vx, vy, vz,
    ax: velocityAt(em.velocityCurveX, em.velocity.x, 0),
    ay: velocityAt(em.velocityCurveY, em.velocity.y, 0),
    az: velocityAt(em.velocityCurveZ, em.velocity.z, 0),
    life, size0, rot0, spin, rotBySpeed: 0, cmix, cu, hasTrail, size0y, size0z, rx0, ry0, spinX, spinY, flip };
}

/** Orbital tangential velocity (sum of w x r over the orbital axes) at the particle's position. */
function orbitTangent(c: Ctx, p: PState): [number, number, number] {
  const o = c.em.orbital;
  const ws = [o.x, o.y, o.z];
  const rx = p.x - c.cx, ry = p.y - c.cy, rz = p.z - c.cz;
  let tx = 0, ty = 0, tz = 0;
  for (let i = 0; i < 3; i++) {
    const w = ws[i];
    if (!w) continue;
    const axis = c.axes[i];
    tx += w * (axis[1] * rz - axis[2] * ry);
    ty += w * (axis[2] * rx - axis[0] * rz);
    tz += w * (axis[0] * ry - axis[1] * rx);
  }
  return [tx, ty, tz];
}

/**
 * Unity's Limit Velocity drag (multiply options off), measured in 6000.3: the
 * TOTAL velocity (particle velocity + animated velocity a: Velocity over
 * Lifetime, orbital, radial, noise) loses `d` m/s, stopping at zero, and the
 * change goes into the particle velocity. A particle moved only by Velocity
 * over Lifetime therefore comes to a stop.
 */
function applyDrag(p: PState, ax: number, ay: number, az: number, d: number) {
  const tx = p.vx + ax, ty = p.vy + ay, tz = p.vz + az;
  const sp = Math.hypot(tx, ty, tz);
  const k = sp > 1e-9 ? Math.max(0, sp - d) / sp : 0;
  p.vx = tx * k - ax;
  p.vy = ty * k - ay;
  p.vz = tz * k - az;
}

/**
 * Unity's speed limit (Limit Velocity with dampen, measured in 2022.3): above
 * `limit` the excess of the total speed decays by (1 - dampen) every 1/30 s;
 * like drag, the change goes into the particle velocity.
 */
function applyLimit(p: PState, ax: number, ay: number, az: number, limit: number, dampen: number, dt: number) {
  const tx = p.vx + ax, ty = p.vy + ay, tz = p.vz + az;
  const sp = Math.hypot(tx, ty, tz);
  if (sp <= limit || sp < 1e-9) return;
  const k = (limit + (sp - limit) * Math.pow(1 - dampen, dt * 30)) / sp;
  p.vx = tx * k - ax;
  p.vy = ty * k - ay;
  p.vz = tz * k - az;
}

/**
 * One integration step. `size` is the particle's current size (its floor
 * collision radius). Returns the speed it hit the floor with, or -1.
 */
export function step(c: Ctx, p: PState, tt: number, dt: number, size: number, f: number): number {
  const em = c.em;
  p.vx += c.fx * dt;
  p.vy += c.fy * dt;
  p.vz += c.fz * dt;
  // Velocity over Lifetime: a curve replaces that axis' constant
  const lf = Math.min(1, Math.max(0, f));
  let avx = velocityAt(em.velocityCurveX, em.velocity.x, lf);
  let avy = velocityAt(em.velocityCurveY, em.velocity.y, lf);
  let avz = velocityAt(em.velocityCurveZ, em.velocity.z, lf);
  if (em.radial !== 0) {
    const rx = p.x - c.cx, ry = p.y - c.cy, rz = p.z - c.cz;
    const n = Math.hypot(rx, ry, rz);
    if (n > 1e-5) {
      avx += (rx / n) * em.radial;
      avy += (ry / n) * em.radial;
      avz += (rz / n) * em.radial;
    }
  }
  if (c.waves) {
    let nx = 0, ny = 0, nz = 0;
    for (const w of c.waves) {
      const sn = Math.sin(w.k[0] * p.x + w.k[1] * p.y + w.k[2] * p.z + w.w * tt + w.p);
      nx += w.a[0] * sn;
      ny += w.a[1] * sn;
      nz += w.a[2] * sn;
    }
    avx += nx * c.noiseK * em.noiseAxes.x;
    avy += ny * c.noiseK * em.noiseAxes.y;
    avz += nz * c.noiseK * em.noiseAxes.z;
  }
  if (em.drag > 0) {
    if (c.orb) {
      const [tx, ty, tz] = orbitTangent(c, p);
      applyDrag(p, avx + tx, avy + ty, avz + tz, em.drag * dt);
    } else applyDrag(p, avx, avy, avz, em.drag * dt);
  }
  if (em.limitDampen > 0) {
    if (c.orb) {
      const [tx, ty, tz] = orbitTangent(c, p);
      applyLimit(p, avx + tx, avy + ty, avz + tz, em.speedLimit, em.limitDampen, dt);
    } else applyLimit(p, avx, avy, avz, em.speedLimit, em.limitDampen, dt);
  }
  // Speed Modifier scales the whole motion (own velocity and Velocity over Lifetime; measured in 2022.3)
  const sm = em.speedModifier.length ? evalCurve(em.speedModifier, lf) : 1;
  p.x += (p.vx + avx) * dt * sm;
  p.y += (p.vy + avy) * dt * sm;
  p.z += (p.vz + avz) * dt * sm;
  if (em.spinBySpeed.length) {
    // Rotation by Speed: the curve over the speed, remapped from [min, max] to 0..1
    const sp = Math.hypot(p.vx + avx, p.vy + avy, p.vz + avz) * sm;
    const span = em.spinBySpeedMax - em.spinBySpeedMin;
    const u = span > 1e-6 ? (sp - em.spinBySpeedMin) / span : sp >= em.spinBySpeedMax ? 1 : 0;
    p.rotBySpeed += evalCurve(em.spinBySpeed, Math.min(1, Math.max(0, u))) * dt;
  }
  if (c.orb) {
    const ws = [em.orbital.x, em.orbital.y, em.orbital.z];
    for (let i = 0; i < 3; i++) {
      const w = ws[i];
      if (!w) continue;
      const axis = c.axes[i];
      const a = w * dt;
      const rx = p.x - c.cx, ry = p.y - c.cy, rz = p.z - c.cz;
      const ca = Math.cos(a), sa = Math.sin(a);
      const d = axis[0] * rx + axis[1] * ry + axis[2] * rz;
      const kx = axis[1] * rz - axis[2] * ry;
      const ky = axis[2] * rx - axis[0] * rz;
      const kz = axis[0] * ry - axis[1] * rx;
      p.x = c.cx + rx * ca + kx * sa + axis[0] * d * (1 - ca);
      p.y = c.cy + ry * ca + ky * sa + axis[1] * d * (1 - ca);
      p.z = c.cz + rz * ca + kz * sa + axis[2] * d * (1 - ca);
    }
    // the orbit's tangential velocity (w x r) is part of the particle's velocity
    // in Unity: Stretched Billboard length and direction use it
    const [tx, ty, tz] = orbitTangent(c, p);
    avx += tx;
    avy += ty;
    avz += tz;
  }
  p.ax = avx;
  p.ay = avy;
  p.az = avz;
  return em.floor ? collideFloor(em, p, size) : -1;
}

/** Current size at life fraction f (before sub-emitter inheritance). */
export function sizeAt(em: Emitter3D, p: PState, f: number): number {
  const lf = Math.min(1, f);
  return Math.max(0, p.size0 * (em.sizeCurve.length ? evalCurve(em.sizeCurve, lf) : easeSize(em.sizeEase, lf, em.sizeEnd)));
}

/** Y and Z size factors relative to X at life fraction f (3D start size and per-axis Size over Lifetime). */
export function sizeAxes(em: Emitter3D, p: PState, f: number): [number, number] {
  const lf = Math.min(1, f);
  const fx = em.sizeCurve.length ? evalCurve(em.sizeCurve, lf) : easeSize(em.sizeEase, lf, em.sizeEnd);
  const ky = em.sizeCurveY.length ? evalCurve(em.sizeCurveY, lf) : fx;
  const kz = em.sizeCurveZ.length ? evalCurve(em.sizeCurveZ, lf) : fx;
  return [(p.size0y * ky) / Math.max(1e-6, p.size0 * fx), (p.size0z * kz) / Math.max(1e-6, p.size0 * fx)];
}

/** Rotation in degrees at `age` (Rotation over Lifetime: constant spin, or the curve integrated over the life). */
export function rotationAt(em: Emitter3D, p: PState, age: number): number {
  return p.flip * (p.rot0 + p.rotBySpeed + (em.spinCurve.length ? p.life * integrateCurve(em.spinCurve, age / p.life) : p.spin * age));
}

/** A gradient's colour at f (0..255 rgb); `stepped`: Unity's Fixed mode shows the next key's colour. */
function stopsAt(stops: { t: number; rgb: [number, number, number] }[], f: number, stepped: boolean): [number, number, number] {
  if (stops.length === 1 || f <= stops[0].t) return stops[0].rgb;
  if (f >= stops[stops.length - 1].t) return stops[stops.length - 1].rgb;
  let j = 0;
  while (j < stops.length - 2 && f > stops[j + 1].t) j++;
  const a = stops[j], b = stops[j + 1];
  if (stepped) return b.rgb;
  const u = (f - a.t) / Math.max(1e-6, b.t - a.t);
  return [a.rgb[0] + (b.rgb[0] - a.rgb[0]) * u, a.rgb[1] + (b.rgb[1] - a.rgb[1]) * u, a.rgb[2] + (b.rgb[2] - a.rgb[2]) * u];
}

/** Colour and alpha of a particle at life fraction f (0..255 rgb). */
export function look(c: Ctx, p: PState, f: number): [number, number, number, number] {
  const em = c.em;
  const [cr, cg, cb] = stopsAt(c.stops, f, em.stepped);
  let sr: number, sg: number, sb: number;
  let a = em.alpha;
  if (c.startStops.length) {
    [sr, sg, sb] = stopsAt(c.startStops, p.cu, false);
    if (em.startGradientAlpha.length) a *= evalCurve(em.startGradientAlpha, p.cu);
  } else {
    sr = c.c1[0] + (c.c2[0] - c.c1[0]) * p.cmix;
    sg = c.c1[1] + (c.c2[1] - c.c1[1]) * p.cmix;
    sb = c.c1[2] + (c.c2[2] - c.c1[2]) * p.cmix;
  }
  if (em.alphaCurve.length) a *= evalCurve(em.alphaCurve, Math.min(1, Math.max(0, f)));
  else {
    if (em.fadeIn > 0 && f < em.fadeIn) a *= f / em.fadeIn;
    if (em.fadeOut > 0 && f > 1 - em.fadeOut) a *= (1 - f) / em.fadeOut;
  }
  return [(cr * sr) / 255, (cg * sg) / 255, (cb * sb) / 255, a];
}
