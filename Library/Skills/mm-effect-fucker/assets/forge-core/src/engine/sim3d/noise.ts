// Noise field: a sum of travelling waves, periodic over the loop.

import { Rng } from './math';

// Noise field: sum of travelling waves, periodic over the loop.

export interface Wave {
  k: [number, number, number];
  a: [number, number, number];
  w: number;
  p: number;
}
/**
 * Waves of the noise field. Octaves (Unity's): each further set of six waves has frequency
 * x `scale` and amplitude x `mult` of the one before; the first octave is drawn first, so a
 * one-octave field is unchanged.
 */
export function wavesFor(seed: number, freq: number, scroll: number, duration: number, octaves = 1, mult = 0.5, scale = 2): Wave[] {
  const rng = new Rng(seed ^ 0x5bd1e995);
  const waves: Wave[] = [];
  for (let o = 0; o < octaves; o++) waves.push(...octave(rng, freq * Math.pow(scale, o), Math.pow(mult, o), scroll, duration));
  return waves;
}

function octave(rng: Rng, freq: number, amp: number, scroll: number, duration: number): Wave[] {
  const waves: Wave[] = [];
  for (let i = 0; i < 6; i++) {
    const th = rng.next() * Math.PI * 2;
    const ph = Math.acos(2 * rng.next() - 1);
    const kk = Math.PI * 2 * freq * (0.6 + rng.next() * 0.8);
    const k: [number, number, number] = [Math.sin(ph) * Math.cos(th) * kk, Math.cos(ph) * kk, Math.sin(ph) * Math.sin(th) * kk];
    let ax = rng.next() - 0.5, ay = rng.next() - 0.5, az = rng.next() - 0.5;
    const kn = Math.hypot(...k) || 1;
    const dot = (ax * k[0] + ay * k[1] + az * k[2]) / (kn * kn);
    ax -= dot * k[0];
    ay -= dot * k[1];
    az -= dot * k[2];
    const an = Math.hypot(ax, ay, az) || 1;
    const sign = i % 2 ? 1 : -1;
    const cycles = scroll > 0 ? Math.max(1, Math.round(scroll * duration)) : 1;
    waves.push({ k, a: [(ax / an) * amp, (ay / an) * amp, (az / an) * amp], w: ((Math.PI * 2) / duration) * cycles * sign, p: rng.next() * Math.PI * 2 });
  }
  return waves;
}
// RMS of six unit-amplitude sine waves with unit direction vectors
export const WAVE_RMS = Math.sqrt(6 * 0.5);
