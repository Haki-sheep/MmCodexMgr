// Shapes drawn with canvas paths: magic circles, snowflake crystals, ice or
// rock shards and lightning bolts. Lines get a soft glow from layered strokes.

import { prng } from '../noise';
import { canvasOf } from '../raster';
import { SIZE, seedParam, type GeneratorDef } from './types';

type Pt = [number, number];

/** Strokes a path three times (wide faint, medium, thin bright) for a glowing line. */
export function glowStroke(g: CanvasRenderingContext2D, path: () => void, width: number, glow: number) {
  const passes: [number, number][] = [[width * (1 + 4 * glow), 0.15 * glow], [width * (1 + 1.5 * glow), 0.4], [width, 1]];
  for (const [w, a] of passes) {
    if (a <= 0) continue;
    g.strokeStyle = `rgba(255,255,255,${a})`;
    g.lineWidth = w;
    g.beginPath();
    path();
    g.stroke();
  }
}

function ctx(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = canvasOf(SIZE, SIZE);
  const g = c.getContext('2d')!;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  return [c, g];
}

export const runes: GeneratorDef = {
  id: 'runes',
  label: '魔法阵',
  kind: 'sprite',
  hint: 'A magic circle: concentric rings, a band of random glyph marks and an inner star polygon. Use on horizontal billboards or a flat mesh ring.',
  params: [
    { key: 'rings', label: '圆环数', min: 1, max: 3, step: 1, default: 2 },
    { key: 'glyphs', label: '符文数', min: 0, max: 40, step: 1, default: 16 },
    { key: 'starPoints', label: '内星角数', min: 0, max: 9, step: 1, default: 6, hint: '0 = 没有内部星形' },
    { key: 'lineWidth', label: '线宽', min: 1, max: 6, step: 0.5, default: 2 },
    { key: 'glow', label: '发光', min: 0, max: 1, step: 0.05, default: 0.6 },
    seedParam(),
  ],
  draw(p) {
    const [c, g] = ctx();
    const rnd = prng(p.seed * 131 + 7);
    const C = SIZE / 2;
    const R = SIZE * 0.46;
    const circle = (r: number) => () => g.arc(C, C, r, 0, Math.PI * 2);
    const rings = Math.round(p.rings);
    for (let i = 0; i < rings; i++) glowStroke(g, circle(R * (1 - i * 0.09)), p.lineWidth, p.glow);
    const band = R * (1 - rings * 0.09);
    const inner = band * 0.78;
    glowStroke(g, circle(inner), p.lineWidth * 0.8, p.glow);
    // glyphs: small random strokes between the band and the inner ring
    const n = Math.round(p.glyphs);
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const span = ((Math.PI * 2) / Math.max(n, 1)) * 0.6;
      const r0 = inner + (band - inner) * 0.2, r1 = band - (band - inner) * 0.2;
      const pts: Pt[] = [];
      for (let k = 0; k < 3 + Math.floor(rnd() * 3); k++) {
        const a = a0 + (rnd() - 0.5) * span;
        const r = r0 + rnd() * (r1 - r0);
        pts.push([C + Math.cos(a) * r, C + Math.sin(a) * r]);
      }
      glowStroke(g, () => pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))), p.lineWidth * 0.7, p.glow * 0.6);
    }
    const sp = Math.round(p.starPoints);
    if (sp >= 3) {
      const step = sp % 2 ? 2 : sp === 4 ? 1 : 2;
      const pts: Pt[] = [];
      for (let k = 0; k <= sp; k++) {
        const a = ((k * step) / sp) * Math.PI * 2 - Math.PI / 2;
        pts.push([C + Math.cos(a) * inner, C + Math.sin(a) * inner]);
      }
      const draw = () => pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y)));
      glowStroke(g, draw, p.lineWidth * 0.8, p.glow);
      if (sp % 2 === 0 && step === 2) {
        // even counts with step 2 only reach every other vertex: draw the rotated copy
        const rot = pts.map(([x, y]): Pt => {
          const a = Math.atan2(y - C, x - C) + Math.PI / sp * 2;
          return [C + Math.cos(a) * inner, C + Math.sin(a) * inner];
        });
        glowStroke(g, () => rot.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))), p.lineWidth * 0.8, p.glow);
      }
    }
    return c;
  },
};

export const crystal: GeneratorDef = {
  id: 'crystal',
  label: '冰晶',
  kind: 'sprite',
  hint: 'A snowflake / frost crystal: N arms with side branches. Frost, snow, ice magic.',
  params: [
    { key: 'arms', label: '臂数', min: 3, max: 12, step: 1, default: 6 },
    { key: 'branches', label: '分枝数', min: 0, max: 6, step: 1, default: 3 },
    { key: 'branchLength', label: '分枝长度', min: 0.1, max: 0.6, step: 0.05, default: 0.3 },
    { key: 'lineWidth', label: '线宽', min: 1, max: 8, step: 0.5, default: 3 },
    { key: 'glow', label: '发光', min: 0, max: 1, step: 0.05, default: 0.5 },
    seedParam(),
  ],
  draw(p) {
    const [c, g] = ctx();
    const rnd = prng(p.seed * 977 + 3);
    const C = SIZE / 2, L = SIZE * 0.45;
    const arms = Math.round(p.arms);
    // the same branch pattern on every arm, like a real snowflake
    const pattern = Array.from({ length: Math.round(p.branches) }, () => ({ t: 0.25 + rnd() * 0.6, len: p.branchLength * (0.5 + rnd() * 0.7) }));
    for (let i = 0; i < arms; i++) {
      const a = (i / arms) * Math.PI * 2 - Math.PI / 2;
      const dir: Pt = [Math.cos(a), Math.sin(a)];
      glowStroke(g, () => (g.moveTo(C, C), g.lineTo(C + dir[0] * L, C + dir[1] * L)), p.lineWidth, p.glow);
      for (const b of pattern) {
        const x = C + dir[0] * L * b.t, y = C + dir[1] * L * b.t;
        const len = L * b.len * (1 - b.t * 0.6);
        for (const side of [-1, 1]) {
          const ba = a + side * (Math.PI / 3.2);
          glowStroke(g, () => (g.moveTo(x, y), g.lineTo(x + Math.cos(ba) * len, y + Math.sin(ba) * len)), p.lineWidth * 0.7, p.glow * 0.7);
        }
      }
    }
    return c;
  },
};

export const shard: GeneratorDef = {
  id: 'shard',
  label: '碎片',
  kind: 'sprite',
  hint: 'An irregular angular chunk with lighter and darker facets (ice, glass, rock debris on billboards).',
  params: [
    { key: 'corners', label: '角数', min: 3, max: 9, step: 1, default: 6 },
    { key: 'elongation', label: '拉长', min: 1, max: 3, step: 0.1, default: 1.6 },
    { key: 'facetContrast', label: '棱面明暗', min: 0, max: 1, step: 0.05, default: 0.5 },
    seedParam(),
  ],
  draw(p) {
    const [c, g] = ctx();
    const rnd = prng(p.seed * 389 + 11);
    const C = SIZE / 2;
    const n = Math.round(p.corners);
    const pts: Pt[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * (Math.PI / n);
      const r = SIZE * 0.42 * (0.55 + rnd() * 0.45);
      pts.push([C + Math.cos(a) * r / p.elongation, C + Math.sin(a) * r]);
    }
    const centre: Pt = [C + (rnd() - 0.5) * SIZE * 0.1, C + (rnd() - 0.5) * SIZE * 0.1];
    for (let i = 0; i < n; i++) {
      const [a, b] = [pts[i], pts[(i + 1) % n]];
      g.fillStyle = `rgba(255,255,255,${(1 - p.facetContrast * 0.6 * rnd()).toFixed(3)})`;
      g.beginPath();
      g.moveTo(...centre);
      g.lineTo(...a);
      g.lineTo(...b);
      g.closePath();
      g.fill();
    }
    // bright rim
    g.strokeStyle = 'rgba(255,255,255,1)';
    g.lineWidth = 2;
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.stroke();
    return c;
  },
};

/** Midpoint displacement between two points. */
function bolt(rnd: () => number, a: Pt, b: Pt, jitter: number, depth: number): Pt[] {
  if (depth === 0) return [a, b];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const nx = -(b[1] - a[1]) / (len || 1), ny = (b[0] - a[0]) / (len || 1);
  const off = (rnd() - 0.5) * len * jitter;
  const m: Pt = [(a[0] + b[0]) / 2 + nx * off, (a[1] + b[1]) / 2 + ny * off];
  return [...bolt(rnd, a, m, jitter, depth - 1).slice(0, -1), ...bolt(rnd, m, b, jitter, depth - 1)];
}

export const lightning: GeneratorDef = {
  id: 'lightning',
  label: '闪电',
  kind: 'sprite',
  hint: 'A jagged bolt from left to right (along U) with side branches. Use with stretched billboards or as a beam texture.',
  params: [
    { key: 'jitter', label: '曲折', min: 0.1, max: 1, step: 0.05, default: 0.5 },
    { key: 'branches', label: '分支数', min: 0, max: 6, step: 1, default: 2 },
    { key: 'lineWidth', label: '线宽', min: 1, max: 8, step: 0.5, default: 2.5 },
    { key: 'glow', label: '发光', min: 0, max: 1, step: 0.05, default: 0.7 },
    seedParam(),
  ],
  draw(p) {
    const [c, g] = ctx();
    const rnd = prng(p.seed * 613 + 5);
    const main = bolt(rnd, [SIZE * 0.03, SIZE / 2], [SIZE * 0.97, SIZE / 2], p.jitter, 6);
    const line = (pts: Pt[]) => () => pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    glowStroke(g, line(main), p.lineWidth, p.glow);
    for (let i = 0; i < Math.round(p.branches); i++) {
      const start = main[Math.floor(main.length * (0.2 + rnd() * 0.6))];
      const end: Pt = [start[0] + SIZE * (0.15 + rnd() * 0.25), start[1] + (rnd() - 0.5) * SIZE * 0.5];
      glowStroke(g, line(bolt(rnd, start, end, p.jitter, 4)), p.lineWidth * 0.6, p.glow * 0.7);
    }
    return c;
  },
};
