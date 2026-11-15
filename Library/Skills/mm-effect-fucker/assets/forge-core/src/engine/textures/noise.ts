// Deterministic, tileable value noise for procedural textures.

function hash2(x: number, y: number, seed: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2246822519)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Value noise in [0, 1], periodic with period `px` x `py` lattice cells. */
export function valueNoise(x: number, y: number, px: number, py: number, seed = 0): number {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = smooth(x - x0), fy = smooth(y - y0);
  const w = (i: number, j: number) => hash2((((x0 + i) % px) + px) % px, (((y0 + j) % py) + py) % py, seed);
  const a = w(0, 0), b = w(1, 0), c = w(0, 1), d = w(1, 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** Fractal (fBm) value noise in [0, 1], tileable over the unit square when u, v run 0..1. */
export function fbm(u: number, v: number, cells: number, octaves = 4, seed = 0, cellsY = cells): number {
  let sum = 0, amp = 0.5, norm = 0, fx = cells, fy = cellsY;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(u * fx, v * fy, fx, fy, seed + o * 17);
    norm += amp;
    amp *= 0.5;
    fx *= 2;
    fy *= 2;
  }
  return sum / norm;
}

/** Small deterministic PRNG for drawing (mulberry32). */
export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
