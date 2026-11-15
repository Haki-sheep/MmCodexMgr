// Flipbooks: grids of frames, white with alpha, read left to right and top to
// bottom (Unity's Texture Sheet Animation order). Colour comes from the
// particle colour. The built-in ones are 4x4 with seed 0; the generator
// registry offers other grids and seeds.

import { FLIPBOOK_TILES, type FlipbookKind } from '../render3d/sheet';
import { clamp01, fbm, prng } from './noise';
import { canvasOf, paintAlpha } from './raster';

export const FRAME_SIZE = 64;

type FrameFn = (u: number, v: number, p: number, seed: number) => number; // p: 0..1 over the sheet

const smoke: FrameFn = (u, v, p, seed) => {
  const r = Math.hypot(u - 0.5, v - 0.5) * 2;
  const grow = 0.55 + 0.4 * p;
  const n = fbm(u + p * 0.35, v - p * 0.25, 3, 4, 21 + seed);
  const edge = clamp01((grow - r + (n - 0.5) * 0.55) / 0.35);
  return edge * (0.35 + 0.65 * n) * (1 - 0.75 * p);
};

/**
 * A soft flame inside the cell: a round base that narrows into licking
 * tongues, noise scrolling upward over the sheet. Stays clear of the cell
 * borders (no hard edges when the frame is drawn on a quad).
 */
const fire: FrameFn = (u, v, p, seed) => {
  const x = (u - 0.5) * 2; // -1..1
  const h = 1 - v; // 0 bottom .. 1 top
  const n = fbm(u * 0.8, v * 0.8 + p, 3, 4, 5 + seed); // scrolls upward and wraps over the sheet
  const n2 = fbm(u * 1.6, v * 1.6 + p * 2, 3, 3, 9 + seed);
  // centre line sways with height
  const sway = (n - 0.5) * 0.5 * h;
  // width: round at the bottom, tapering to a point near the top
  const width = 0.62 * Math.sqrt(clamp01(h / 0.18)) * Math.pow(clamp01(1 - h / 0.92), 0.9);
  const dx = Math.abs(x - sway);
  const body = clamp01((width - dx) / (0.35 * width + 0.05));
  // the top breaks up into tongues
  const cut = clamp01((n2 - (h * 0.75 - 0.15)) / 0.25);
  const base = clamp01(h / 0.12);
  const inner = 0.55 + 0.45 * clamp01(1 - dx / (width + 1e-3));
  return clamp01(body * cut * base * inner * 1.15);
};

const energy: FrameFn = (u, v, p, seed) => {
  const dx = u - 0.5, dy = v - 0.5;
  const r = Math.hypot(dx, dy) * 2;
  const a = Math.atan2(dy, dx) / (Math.PI * 2) + 0.5;
  const n = fbm(a + p, r * 0.5, 6, 3, 9 + seed, 2);
  const ring = Math.exp(-Math.pow((r - 0.62 - (n - 0.5) * 0.25) / 0.12, 2));
  const core = Math.exp(-r * r * 6) * 0.8;
  return clamp01(ring * (0.5 + n) + core);
};

/** Electric arcs are drawn as random-walk polylines, a new one per frame. */
function electricFrame(c: HTMLCanvasElement, ox: number, oy: number, frame: number, seed: number, s: number) {
  const g = c.getContext('2d')!;
  const rnd = prng(1000 + frame + seed * 7919);
  const k = s / FRAME_SIZE;
  g.save();
  g.beginPath();
  g.rect(ox, oy, s, s);
  g.clip();
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (let arc = 0; arc < 2; arc++) {
    const pts: [number, number][] = [];
    let y = s * (0.3 + rnd() * 0.4);
    for (let i = 0; i <= 10; i++) {
      pts.push([ox + (i / 10) * s, oy + y]);
      y = Math.max(s * 0.1, Math.min(s * 0.9, y + (rnd() - 0.5) * s * 0.28));
    }
    const strokes: [number, number][] = [[7, 0.18], [3.5, 0.45], [1.4, 1]];
    for (const [w, a] of strokes) {
      g.strokeStyle = `rgba(255,255,255,${arc ? a * 0.6 : a})`;
      g.lineWidth = (arc ? w * 0.6 : w) * k;
      g.beginPath();
      pts.forEach(([x, yy], i) => (i ? g.lineTo(x, yy) : g.moveTo(x, yy)));
      g.stroke();
    }
  }
  g.restore();
}

const FRAME_FNS: Record<Exclude<FlipbookKind, 'electric'>, FrameFn> = { smoke, fire, energy };

export function flipbook(kind: FlipbookKind, tiles = FLIPBOOK_TILES, seed = 0, frameSize = FRAME_SIZE): HTMLCanvasElement {
  const n = tiles;
  const c = canvasOf(frameSize * n, frameSize * n);
  for (let i = 0; i < n * n; i++) {
    const ox = (i % n) * frameSize;
    const oy = Math.floor(i / n) * frameSize;
    if (kind === 'electric') electricFrame(c, ox, oy, i, seed, frameSize);
    else {
      const fn = FRAME_FNS[kind];
      const p = i / (n * n);
      paintAlpha(c, ox, oy, frameSize, frameSize, (u, v) => fn(u, v, p, seed));
    }
  }
  return c;
}
