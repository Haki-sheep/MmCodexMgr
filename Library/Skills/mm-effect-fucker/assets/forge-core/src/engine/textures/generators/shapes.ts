// Radial shapes computed per pixel: soft glows, rings (solid or dashed) and
// multi-point star glints.

import { clamp01 } from '../noise';
import { canvasOf, paintAlpha } from '../raster';
import { SIZE, type GeneratorDef } from './types';

const polar = (u: number, v: number) => {
  const x = u * 2 - 1, y = v * 2 - 1;
  return { r: Math.hypot(x, y), a: Math.atan2(y, x) };
};

export const glow: GeneratorDef = {
  id: 'glow',
  label: '柔光',
  kind: 'sprite',
  hint: 'Round soft glow; hardness 0 = very soft falloff, 1 = nearly a disc; core adds a small hot centre.',
  params: [
    { key: 'hardness', label: '硬度', min: 0, max: 1, step: 0.05, default: 0.3 },
    { key: 'core', label: '核心亮度', min: 0, max: 1, step: 0.05, default: 0.4 },
  ],
  draw(p) {
    const e = 3.5 - 3 * p.hardness;
    const c = canvasOf(SIZE, SIZE);
    paintAlpha(c, 0, 0, SIZE, SIZE, (u, v) => {
      const { r } = polar(u, v);
      const body = Math.pow(clamp01(1 - r), e);
      return clamp01(body * (1 - p.core * 0.5) + p.core * Math.exp(-Math.pow(r / 0.16, 2)));
    });
    return c;
  },
};

export const ring: GeneratorDef = {
  id: 'ring',
  label: '圆环',
  kind: 'sprite',
  hint: 'A ring of given radius and width; dashes > 0 splits it into segments (tech or rune rings, shockwave arcs).',
  params: [
    { key: 'radius', label: '半径', min: 0.2, max: 0.95, step: 0.01, default: 0.75 },
    { key: 'width', label: '宽度', min: 0.01, max: 0.5, step: 0.01, default: 0.08 },
    { key: 'softness', label: '柔和', min: 0, max: 1, step: 0.05, default: 0.5 },
    { key: 'dashes', label: '分段数', min: 0, max: 48, step: 1, default: 0 },
    { key: 'gap', label: '段间空隙', min: 0.05, max: 0.9, step: 0.05, default: 0.35 },
    { key: 'inner', label: '内侧光晕', min: 0, max: 1, step: 0.05, default: 0.2 },
  ],
  draw(p) {
    const c = canvasOf(SIZE, SIZE);
    const e = 1 + p.softness * 3;
    paintAlpha(c, 0, 0, SIZE, SIZE, (u, v) => {
      const { r, a } = polar(u, v);
      let band = Math.pow(clamp01(1 - Math.abs(r - p.radius) / p.width), e);
      if (p.dashes > 0) {
        const f = ((a / (Math.PI * 2)) * p.dashes + 10) % 1; // 0..1 inside a segment
        const edge = 0.04;
        band *= clamp01((f - p.gap / 2) / edge) * clamp01((1 - p.gap / 2 - f) / edge);
      }
      const halo = r < p.radius ? p.inner * Math.pow(r / p.radius, 6) * 0.6 : 0;
      return clamp01(band + halo);
    });
    return c;
  },
};

export const star: GeneratorDef = {
  id: 'star',
  label: '星芒',
  kind: 'sprite',
  hint: 'A glint with N thin rays and a soft centre (sparkles, hit flashes, lens glints).',
  params: [
    { key: 'points', label: '光芒数', min: 2, max: 16, step: 1, default: 4 },
    { key: 'length', label: '长度', min: 0.3, max: 1, step: 0.05, default: 1 },
    { key: 'thinness', label: '粗细', min: 0.01, max: 0.3, step: 0.01, default: 0.06 },
    { key: 'glow', label: '中心光晕', min: 0, max: 1, step: 0.05, default: 0.5 },
    { key: 'rotation', label: '旋转°', min: 0, max: 180, step: 1, default: 0 },
  ],
  draw(p) {
    const c = canvasOf(SIZE, SIZE);
    const n = Math.round(p.points);
    const rot = (p.rotation * Math.PI) / 180;
    paintAlpha(c, 0, 0, SIZE, SIZE, (u, v) => {
      const { r, a } = polar(u, v);
      let best = 0;
      for (let k = 0; k < n; k++) {
        const d = a - rot - (k * Math.PI * 2) / n;
        if (Math.cos(d) <= 0) continue;
        const along = r / p.length;
        if (along >= 1) continue;
        const perp = r * Math.abs(Math.sin(d));
        const w = p.thinness * (1 - along) + 0.004;
        best = Math.max(best, Math.exp(-Math.pow(perp / w, 2)) * Math.pow(1 - along, 1.5));
      }
      return clamp01(best + p.glow * Math.exp(-Math.pow(r / 0.22, 2)));
    });
    return c;
  },
};
