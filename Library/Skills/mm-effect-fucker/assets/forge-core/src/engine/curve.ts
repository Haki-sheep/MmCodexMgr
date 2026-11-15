// Unity-style animation curves for 3D layers: a list of keys over a 0..1
// range (a particle's life, or the effect's duration), evaluated piecewise
// linearly. An empty list means "off" (the layer's simpler fields apply).
// Unity's own curves are cubic; the importer samples them densely enough that
// linear keys follow them closely, and the exporter writes linear tangents.

export interface CurveKey {
  t: number; // 0..1
  v: number;
}

export type Curve = CurveKey[];

/** Most keys a curve keeps (Unity has no limit; the importer simplifies to this). */
export const MAX_CURVE_KEYS = 16;

export function sanitizeCurve(raw: unknown, lo: number, hi: number): Curve {
  if (!Array.isArray(raw)) return [];
  const keys = raw
    .map((k: any) => ({ t: Number(k?.t), v: Number(k?.v) }))
    .filter((k) => Number.isFinite(k.t) && Number.isFinite(k.v))
    .map((k) => ({ t: Math.min(1, Math.max(0, k.t)), v: Math.min(hi, Math.max(lo, k.v)) }))
    .sort((a, b) => a.t - b.t);
  const out: Curve = [];
  for (const k of keys) {
    const last = out[out.length - 1];
    if (last && Math.abs(last.t - k.t) < 1e-6) last.v = k.v;
    else out.push(k);
  }
  return out.length > MAX_CURVE_KEYS ? simplifyCurve(out, MAX_CURVE_KEYS) : out;
}

/** Value at t (clamped to the first / last key outside them). `c` must not be empty. */
export function evalCurve(c: Curve, t: number): number {
  if (t <= c[0].t) return c[0].v;
  const n = c.length;
  if (t >= c[n - 1].t) return c[n - 1].v;
  let j = 0;
  while (j < n - 2 && t > c[j + 1].t) j++;
  const a = c[j], b = c[j + 1];
  return a.v + ((b.v - a.v) * (t - a.t)) / Math.max(1e-9, b.t - a.t);
}

/** ∫₀^t of the curve (for angular velocity → angle). `c` must not be empty. */
export function integrateCurve(c: Curve, t: number): number {
  const end = Math.max(0, Math.min(1, t));
  let sum = 0;
  let prevT = 0;
  let prevV = evalCurve(c, 0);
  const points = c.map((k) => k.t).filter((x) => x > 0 && x < end);
  points.push(end);
  for (const x of points) {
    const v = evalCurve(c, x);
    sum += ((prevV + v) / 2) * (x - prevT);
    prevT = x;
    prevV = v;
  }
  return sum + (t > 1 ? c[c.length - 1].v * (t - 1) : 0);
}

/** Largest and smallest value of the curve. */
export function curveSpan(c: Curve): { min: number; max: number } {
  let min = Infinity, max = -Infinity;
  for (const k of c) {
    min = Math.min(min, k.v);
    max = Math.max(max, k.v);
  }
  return { min, max };
}

/**
 * Drops the keys whose removal changes the curve least until `max` remain
 * (Visvalingam-style), always keeping the first and last key.
 */
export function simplifyCurve(c: Curve, max: number): Curve {
  const keys = c.slice();
  while (keys.length > max) {
    let best = 1, bestErr = Infinity;
    for (let i = 1; i < keys.length - 1; i++) {
      const a = keys[i - 1], b = keys[i], d = keys[i + 1];
      const lerp = a.v + ((d.v - a.v) * (b.t - a.t)) / Math.max(1e-9, d.t - a.t);
      const err = Math.abs(lerp - b.v) * (d.t - a.t);
      if (err < bestErr) {
        bestErr = err;
        best = i;
      }
    }
    keys.splice(best, 1);
  }
  return keys;
}

/** A curve sampled from any function on 0..1 and simplified. */
export function curveFromFn(fn: (t: number) => number, samples = 33, keys = MAX_CURVE_KEYS): Curve {
  const c: Curve = [];
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    c.push({ t, v: fn(t) });
  }
  return simplifyCurve(c, keys);
}
