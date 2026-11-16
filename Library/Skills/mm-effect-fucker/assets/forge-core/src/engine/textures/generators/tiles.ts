// Tileable textures for UV scrolling, dissolve-like patterns and energy
// surfaces: fractal noise, Voronoi cells / cracks, and soft streaks.

import { clamp01, fbm, valueNoise } from '../noise';
import { canvasOf, paintAlpha } from '../raster';
import { SIZE, seedParam, type GeneratorDef } from './types';

function hash2(x: number, y: number, seed: number): [number, number] {
  let h = (Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(seed + 1, 83492791)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
  const a = (h & 0xffff) / 65536;
  h = Math.imul(h ^ (h >>> 15), 0x27d4eb2d) >>> 0;
  return [a, (h & 0xffff) / 65536];
}

export const noiseTile: GeneratorDef = {
  id: 'noise',
  label: '分形噪声（可平铺）',
  kind: 'tile',
  hint: 'Tileable fractal noise; scale = blob count across, contrast sharpens it into wisps. Scrolling energy, smoke surfaces.',
  params: [
    { key: 'scale', label: '尺度', min: 1, max: 16, step: 1, default: 4 },
    { key: 'octaves', label: '细节层数', min: 1, max: 6, step: 1, default: 4 },
    { key: 'contrast', label: '对比度', min: 0.5, max: 4, step: 0.1, default: 1.5 },
    { key: 'stretch', label: '横向拉伸', min: 1, max: 8, step: 1, default: 1, hint: '大于 1 时变成沿 U 方向的条纹' },
    seedParam(),
  ],
  draw(p) {
    const c = canvasOf(SIZE, SIZE);
    const cx = Math.max(1, Math.round(p.scale / p.stretch)), cy = Math.round(p.scale);
    paintAlpha(c, 0, 0, SIZE, SIZE, (u, v) => {
      const n = fbm(u, v, cx, Math.round(p.octaves), Math.round(p.seed), cy);
      return clamp01((n - 0.5) * p.contrast + 0.5) ** 1.4;
    });
    return c;
  },
};

export const voronoi: GeneratorDef = {
  id: 'voronoi',
  label: '细胞 / 裂纹（可平铺）',
  kind: 'tile',
  hint: 'Tileable Voronoi: mode 0 = soft cells (scales, bubbles), mode 1 = thin glowing edges (cracks, energy webs, ice fractures).',
  params: [
    { key: 'cells', label: '细胞数', min: 2, max: 16, step: 1, default: 6 },
    { key: 'mode', label: '模式', min: 0, max: 1, step: 1, default: 1, hint: '0 = 细胞，1 = 裂纹' },
    { key: 'edge', label: '边缘宽度', min: 0.01, max: 0.3, step: 0.01, default: 0.06 },
    { key: 'warp', label: '扭曲', min: 0, max: 1, step: 0.05, default: 0.2 },
    seedParam(),
  ],
  draw(p) {
    const c = canvasOf(SIZE, SIZE);
    const N = Math.round(p.cells), seed = Math.round(p.seed);
    paintAlpha(c, 0, 0, SIZE, SIZE, (u, v) => {
      // a little periodic warp makes the cells less regular
      const wu = u + (valueNoise(u * 4, v * 4, 4, 4, seed + 3) - 0.5) * p.warp / N;
      const wv = v + (valueNoise(u * 4 + 9, v * 4, 4, 4, seed + 4) - 0.5) * p.warp / N;
      const x = wu * N, y = wv * N;
      const ix = Math.floor(x), iy = Math.floor(y);
      let f1 = 9, f2 = 9;
      for (let j = -1; j <= 1; j++) {
        for (let i = -1; i <= 1; i++) {
          const cx = ix + i, cy = iy + j;
          const [ox, oy] = hash2(((cx % N) + N) % N, ((cy % N) + N) % N, seed);
          const d = Math.hypot(cx + ox - x, cy + oy - y);
          if (d < f1) (f2 = f1), (f1 = d);
          else if (d < f2) f2 = d;
        }
      }
      if (p.mode < 0.5) return clamp01(1 - f1 * 1.2) ** 1.5;
      return clamp01(1 - (f2 - f1) / (p.edge * 4));
    });
    return c;
  },
};

export const streaks: GeneratorDef = {
  id: 'streaks',
  label: '流光条纹（可平铺）',
  kind: 'tile',
  hint: 'Long soft streaks running along U. Scroll along X on rings, beams and trails for flowing energy.',
  params: [
    { key: 'lines', label: '条纹数', min: 2, max: 24, step: 1, default: 8 },
    { key: 'length', label: '长度', min: 1, max: 6, step: 1, default: 2, hint: '每条在 U 方向上的重复次数，越小越长' },
    { key: 'softness', label: '柔和', min: 0, max: 1, step: 0.05, default: 0.5 },
    { key: 'fadeV', label: '上下渐隐', min: 0, max: 0.5, step: 0.05, default: 0, hint: '在 V 方向两端淡出：用在圆筒网格（龙卷风、光柱）上时没有硬边' },
    seedParam(),
  ],
  draw(p) {
    const c = canvasOf(SIZE, SIZE);
    const seed = Math.round(p.seed);
    paintAlpha(c, 0, 0, SIZE, SIZE, (u, v) => {
      const n = fbm(u, v, Math.round(p.length), 3, seed, Math.round(p.lines));
      const lo = 0.55 - p.softness * 0.2;
      const edge = p.fadeV > 0 ? clamp01(Math.min(v, 1 - v) / p.fadeV) : 1;
      return clamp01((n - lo) / (0.25 + p.softness * 0.25)) ** 2 * edge * edge * (3 - 2 * edge);
    });
    return c;
  },
};

/** Not tileable along U: a trail texture whose head fades in (U = 0) and tail fades out. */
export const trail: GeneratorDef = {
  id: 'trail',
  label: '拖尾',
  kind: 'sprite',
  hint: 'Trail / beam texture along U: head fade at U=0, soft edges across V, optional noisy strands.',
  params: [
    { key: 'head', label: '头部渐显', min: 0, max: 0.5, step: 0.01, default: 0.12 },
    { key: 'tail', label: '尾部衰减', min: 0, max: 3, step: 0.1, default: 1 },
    { key: 'width', label: '宽度', min: 0.1, max: 1, step: 0.05, default: 0.6 },
    { key: 'strands', label: '丝状细节', min: 0, max: 1, step: 0.05, default: 0.4 },
    seedParam(),
  ],
  draw(p) {
    const c = canvasOf(SIZE, SIZE / 2);
    const seed = Math.round(p.seed);
    paintAlpha(c, 0, 0, SIZE, SIZE / 2, (u, v) => {
      const across = Math.exp(-Math.pow((v - 0.5) / (p.width * 0.4), 2));
      const head = p.head > 0 ? clamp01(u / p.head) : 1;
      const tail = Math.pow(1 - u, p.tail);
      const strands = 1 - p.strands + p.strands * fbm(u, v, 2, 3, seed, 10) * 1.6;
      return clamp01(across * head * tail * strands);
    });
    return c;
  },
};
