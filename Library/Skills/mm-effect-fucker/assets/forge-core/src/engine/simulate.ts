// Deterministic particle simulation.
//
// The state at time T is a pure function of (effect, T): every particle is
// born from a fixed spawn schedule and integrated from its birth to its age.
// In "perfect" loop mode the schedule repeats every `duration` seconds and a
// particle's random seed depends only on its slot inside the loop, while the
// turbulence field is periodic with the same period. So frame(T) and
// frame(T + duration) are bit-for-bit identical, and frame 0 already contains
// the tail of the previous cycle: loops never pop and need no crossfade.

import type { Effect, Emitter } from './types';

export const STRIDE = 9; // x, y, size, rot, stretchX, r, g, b, a

export interface LayerFrame {
  emitter: Emitter;
  count: number;
  data: Float32Array;
}

// ---------------------------------------------------------------------------
// Random numbers

export function hash32(a: number, b: number, c = 0): number {
  let h = (a ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (b + 0x7f4a7c15), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13) ^ (c * 0x27d4eb2f), 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0 || 1;
  }
  next(): number {
    // mulberry32
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

// ---------------------------------------------------------------------------
// Spawn schedule (cached)

interface Schedule {
  times: Float64Array; // sorted, inside [0, duration)
}

const scheduleCache = new Map<string, Schedule>();

function scheduleFor(em: Emitter, duration: number): Schedule {
  const key = `${em.rate}|${em.startDelay}|${em.stopAfter}|${duration}|${em.bursts.map((b) => b.time + ':' + b.count).join(',')}`;
  const hit = scheduleCache.get(key);
  if (hit) return hit;
  const list: number[] = [];
  const start = Math.min(em.startDelay, duration);
  const end = em.stopAfter > 0 ? Math.min(em.stopAfter, duration) : duration;
  if (em.rate > 0 && end > start) {
    const k = Math.max(1, Math.round((end - start) * em.rate));
    const step = (end - start) / k;
    for (let i = 0; i < k; i++) list.push(start + (i + 0.5) * step);
  }
  for (const b of em.bursts) {
    if (b.time < 0 || b.time >= duration) continue;
    for (let i = 0; i < b.count; i++) list.push(b.time);
  }
  list.sort((a, b) => a - b);
  const sch = { times: Float64Array.from(list) };
  if (scheduleCache.size > 200) scheduleCache.clear();
  scheduleCache.set(key, sch);
  return sch;
}

function lowerBound(arr: Float64Array, v: number): number {
  // first index with arr[i] > v
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// ---------------------------------------------------------------------------
// Periodic divergence-free turbulence: the curl of a sum of travelling waves.

interface Wave {
  kx: number;
  ky: number;
  w: number;
  p: number;
}

function wavesFor(seed: number, scale: number, duration: number): Wave[] {
  const rng = new Rng(seed ^ 0xa5a5a5a5);
  const waves: Wave[] = [];
  const n = 5;
  for (let i = 0; i < n; i++) {
    const th = rng.next() * Math.PI * 2;
    const k = ((Math.PI * 2) / scale) * (0.6 + rng.next() * 0.9);
    const m = [1, -1, 2, -2, 1][i]; // whole cycles per loop keeps the field periodic
    waves.push({ kx: Math.cos(th) * k, ky: Math.sin(th) * k, w: ((Math.PI * 2) / duration) * m, p: rng.next() * Math.PI * 2 });
  }
  return waves;
}

// ---------------------------------------------------------------------------
// Colour helpers

const colorCache = new Map<string, [number, number, number]>();
export function hexToRgb(hex: string): [number, number, number] {
  let c = colorCache.get(hex);
  if (!c) {
    const v = parseInt(hex.slice(1), 16);
    c = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
    colorCache.set(hex, c);
  }
  return c;
}

function easeSize(e: Emitter['sizeEase'], f: number, end: number): number {
  switch (e) {
    case 'easeOut':
      return 1 + (end - 1) * (1 - (1 - f) * (1 - f));
    case 'easeIn':
      return 1 + (end - 1) * f * f;
    case 'pop': {
      // grow fast with a little overshoot, hold, then shrink to `end`
      if (f < 0.12) return (f / 0.12) * 1.18;
      if (f < 0.25) return 1.18 - ((f - 0.12) / 0.13) * 0.18;
      if (f < 0.7) return 1;
      return 1 + (end - 1) * ((f - 0.7) / 0.3);
    }
    default:
      return 1 + (end - 1) * f;
  }
}

// ---------------------------------------------------------------------------
// Simulation

const DT = 1 / 60;
const buffers = new WeakMap<object, Float32Array[]>();

function layerBuffer(owner: object, i: number, need: number): Float32Array {
  let list = buffers.get(owner);
  if (!list) buffers.set(owner, (list = []));
  let buf = list[i];
  if (!buf || buf.length < need * STRIDE) {
    buf = new Float32Array(Math.max(need, 256) * STRIDE * 1.5);
    list[i] = buf;
  }
  return buf;
}

/**
 * Simulate every layer of `effect` at time `t` (seconds).
 * `owner` keys the reusable output buffers (pass the renderer).
 */
export function simulateFrame(effect: Effect, t: number, owner: object = simulateFrame): LayerFrame[] {
  const D = effect.duration;
  const out: LayerFrame[] = [];
  effect.layers.forEach((em, li) => {
    if (!em.visible) {
      out.push({ emitter: em, count: 0, data: new Float32Array(0) });
      return;
    }
    const sch = scheduleFor(em, D);
    const eseed = hash32(effect.seed, hashString(em.id));
    const maxLife = em.lifetime.max;
    const cap = em.maxParticles;
    const data = layerBuffer(owner, li, Math.min(cap, sch.times.length * (Math.ceil(maxLife / D) + 1)));
    const waves = em.turbulence > 0 ? wavesFor(eseed, em.turbulenceScale, D) : null;
    const ballistic = !waves && em.vortex === 0 && em.attract === 0 && !em.floor;
    const stops = em.colors.map((c) => ({ t: c.t, rgb: hexToRgb(c.color) }));

    let count = 0;
    const windowStart = t - maxLife;
    const oldestCycle = effect.loop === 'perfect' ? -Math.ceil(maxLife / D) - 1 : 0;

    // oldest first, so newer particles draw on top (matters for normal blend)
    const newestCycle = effect.loop === 'perfect' ? Math.floor(t / D) : 0;
    for (let c = oldestCycle; c <= newestCycle && count < cap; c++) {
      const off = c * D;
      if (off + D <= windowStart) continue;
      // events with off + s in (t - maxLife, t]
      const lo = lowerBound(sch.times, windowStart - off);
      const hi = lowerBound(sch.times, t - off);
      for (let ei = lo; ei < hi && count < cap; ei++) {
        const birth = off + sch.times[ei];
        const age = t - birth;
        const rng = new Rng(hash32(eseed, ei, 17));
        const life = em.lifetime.min + (em.lifetime.max - em.lifetime.min) * rng.next();
        if (age >= life || age < 0) continue;

        // --- birth state (always draw the same number of randoms) ---
        const r1 = rng.next();
        const r2 = rng.next();
        const r3 = rng.next();
        const r4 = rng.next();
        const r5 = rng.next();
        const r6 = rng.next();
        const r7 = rng.next();
        const r8 = rng.next();
        const r9 = rng.next();

        let lx = 0;
        let ly = 0;
        const R = em.shapeW / 2;
        switch (em.shape) {
          case 'circle': {
            const rr = R * Math.sqrt(r1);
            lx = Math.cos(r2 * Math.PI * 2) * rr;
            ly = Math.sin(r2 * Math.PI * 2) * rr;
            break;
          }
          case 'ring':
            lx = Math.cos(r2 * Math.PI * 2) * R;
            ly = Math.sin(r2 * Math.PI * 2) * R;
            break;
          case 'rect':
            lx = (r1 - 0.5) * em.shapeW;
            ly = (r2 - 0.5) * em.shapeH;
            break;
          case 'line':
            lx = (r1 - 0.5) * em.shapeW;
            break;
        }
        if (em.shapeAngle && (em.shape === 'rect' || em.shape === 'line')) {
          const a = (em.shapeAngle * Math.PI) / 180;
          const ca = Math.cos(a);
          const sa = Math.sin(a);
          const nx = lx * ca - ly * sa;
          ly = lx * sa + ly * ca;
          lx = nx;
        }
        let dirDeg = em.direction;
        if (em.directionMode !== 'angle') {
          const d = Math.hypot(lx, ly);
          dirDeg = d > 0.001 ? (Math.atan2(ly, lx) * 180) / Math.PI : r6 * 360;
          if (em.directionMode === 'inward') dirDeg += 180;
        }
        dirDeg += (r3 - 0.5) * em.spread;
        const dir = (dirDeg * Math.PI) / 180;
        const spd = em.speed.min + (em.speed.max - em.speed.min) * r4;
        const vx0 = Math.cos(dir) * spd;
        const vy0 = Math.sin(dir) * spd;
        const x0 = em.x + lx;
        const y0 = em.y + ly;

        // --- integrate to `age` ---
        let x: number;
        let y: number;
        let vx: number;
        let vy: number;
        const gx = em.gravityX;
        const gy = em.gravityY;
        const k = em.drag;
        if (ballistic) {
          if (k > 1e-6) {
            const e = Math.exp(-k * age);
            const one = (1 - e) / k;
            vx = vx0 * e + (gx / k) * (1 - e);
            vy = vy0 * e + (gy / k) * (1 - e);
            x = x0 + (vx0 - gx / k) * one + (gx / k) * age;
            y = y0 + (vy0 - gy / k) * one + (gy / k) * age;
          } else {
            vx = vx0 + gx * age;
            vy = vy0 + gy * age;
            x = x0 + vx0 * age + 0.5 * gx * age * age;
            y = y0 + vy0 * age + 0.5 * gy * age * age;
          }
        } else {
          x = x0;
          y = y0;
          vx = vx0;
          vy = vy0;
          const steps = Math.floor(age / DT);
          const rem = age - steps * DT;
          const dragStep = Math.exp(-k * DT);
          for (let s = 0; s <= steps; s++) {
            const dt = s < steps ? DT : rem;
            if (dt <= 0) break;
            const tt = birth + s * DT;
            let ax = gx;
            let ay = gy;
            if (waves) {
              let u = 0;
              let v = 0;
              for (let wi = 0; wi < waves.length; wi++) {
                const w = waves[wi];
                const cs = Math.cos(w.kx * x + w.ky * y + w.w * tt + w.p);
                u += w.ky * cs;
                v -= w.kx * cs;
              }
              const norm = em.turbulence * (em.turbulenceScale / (Math.PI * 2)) * 0.45;
              ax += u * norm;
              ay += v * norm;
            }
            if (em.vortex !== 0 || em.attract !== 0) {
              const dx = x - em.x;
              const dy = y - em.y;
              const rr = Math.hypot(dx, dy) + 4;
              ax += (em.vortex * -dy) / rr - (em.attract * dx) / rr;
              ay += (em.vortex * dx) / rr - (em.attract * dy) / rr;
            }
            vx += ax * dt;
            vy += ay * dt;
            const dm = dt === DT ? dragStep : Math.exp(-k * dt);
            vx *= dm;
            vy *= dm;
            x += vx * dt;
            y += vy * dt;
            if (em.floor && y > em.floorY) {
              y = em.floorY;
              if (vy > 0) vy = -vy * em.bounce;
              vx *= 1 - em.friction;
            }
          }
        }

        // --- appearance ---
        const f = age / life;
        const base = em.sizeStart.min + (em.sizeStart.max - em.sizeStart.min) * r5;
        const size = Math.max(0, base * easeSize(em.sizeEase, f, em.sizeEnd));

        let cr: number;
        let cg: number;
        let cb: number;
        if (stops.length === 1 || f <= stops[0].t) {
          [cr, cg, cb] = stops[0].rgb;
        } else if (f >= stops[stops.length - 1].t) {
          [cr, cg, cb] = stops[stops.length - 1].rgb;
        } else {
          let j = 0;
          while (j < stops.length - 2 && f > stops[j + 1].t) j++;
          const a = stops[j];
          const b = stops[j + 1];
          if (em.stepped) {
            [cr, cg, cb] = a.rgb;
          } else {
            const u = (f - a.t) / Math.max(1e-6, b.t - a.t);
            cr = a.rgb[0] + (b.rgb[0] - a.rgb[0]) * u;
            cg = a.rgb[1] + (b.rgb[1] - a.rgb[1]) * u;
            cb = a.rgb[2] + (b.rgb[2] - a.rgb[2]) * u;
          }
        }
        if (em.hueJitter > 0) {
          // rotate hue around the grey axis
          const h = ((r7 - 0.5) * 2 * em.hueJitter * Math.PI) / 180;
          const cosA = Math.cos(h);
          const sinA = Math.sin(h);
          const k1 = (1 - cosA) / 3;
          const k2 = Math.sqrt(1 / 3) * sinA;
          const m0 = cosA + k1;
          const m1 = k1 - k2;
          const m2 = k1 + k2;
          const nr = cr * m0 + cg * m1 + cb * m2;
          const ng = cr * m2 + cg * m0 + cb * m1;
          const nb = cr * m1 + cg * m2 + cb * m0;
          cr = Math.min(255, Math.max(0, nr));
          cg = Math.min(255, Math.max(0, ng));
          cb = Math.min(255, Math.max(0, nb));
        }

        let a = em.alpha;
        if (em.fadeIn > 0 && f < em.fadeIn) a *= f / em.fadeIn;
        if (em.fadeOut > 0 && f > 1 - em.fadeOut) a *= (1 - f) / em.fadeOut;
        if (em.flicker > 0) a *= 1 - em.flicker * (0.5 + 0.5 * Math.sin(r8 * 6.283 + age * 27));
        if (a <= 0.003 || size <= 0.05) continue;

        let rot: number;
        let sx = 1;
        if (em.stretch > 0) {
          const sp = Math.hypot(vx, vy);
          rot = Math.atan2(vy, vx);
          sx = 1 + (em.stretch * sp) / 200;
        } else {
          const spin = em.spin.min + (em.spin.max - em.spin.min) * r9;
          rot = ((em.randomRotation ? r6 * 360 : 0) + spin * age) * (Math.PI / 180);
        }

        const o = count * STRIDE;
        data[o] = x;
        data[o + 1] = y;
        data[o + 2] = size;
        data[o + 3] = rot;
        data[o + 4] = sx;
        data[o + 5] = cr;
        data[o + 6] = cg;
        data[o + 7] = cb;
        data[o + 8] = a;
        count++;
      }
    }
    out.push({ emitter: em, count, data });
  });
  return out;
}

export function frameCount(effect: Effect): number {
  return Math.max(1, Math.round(effect.duration * effect.fps));
}

/** Particles alive at one moment, summed over layers (for the stats line). */
export function countParticles(frames: LayerFrame[]): number {
  return frames.reduce((s, f) => s + f.count, 0);
}
