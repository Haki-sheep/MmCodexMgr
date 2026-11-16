// Motifs for combat skills: sweeping arcs for slashes (a tile mapped on the
// ring mesh, U around the ring, scrolled to swing), heal crosses, ground
// cracks and swirls.

import { clamp01, fbm, prng } from '../noise';
import { canvasOf, paintAlpha } from '../raster';
import { glowStroke } from './strokes';
import { SIZE, seedParam, type GeneratorDef } from './types';

const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a || 1e-6));
  return t * t * (3 - 2 * t);
};

/**
 * U runs around the ring mesh (0..1), V from its inner (0) to outer (1) edge.
 * Each arc is brightest at its head, thins and fades toward its tail, with a
 * hot line along the outer edge, like a blade's swing.
 */
export const arc: GeneratorDef = {
  id: 'arc',
  label: '刀光弧（环形网格）',
  kind: 'tile',
  hint: 'Sword-swing arcs for the ring mesh (meshAlign local): U goes around the ring, the head is bright and the tail thins out; scroll material.scrollX to swing it (negative = head leads counter-clockwise). arcs = how many arcs around the ring.',
  params: [
    { key: 'arcs', label: '弧数', min: 1, max: 6, step: 1, default: 1 },
    { key: 'length', label: '弧长', min: 0.1, max: 1, step: 0.05, default: 0.45, hint: '每段弧占一圈的比例' },
    { key: 'edge', label: '刃口亮线', min: 0, max: 1, step: 0.05, default: 0.8 },
    { key: 'thickness', label: '厚度', min: 0.2, max: 1, step: 0.05, default: 0.75 },
    { key: 'streaks', label: '条纹', min: 0, max: 1, step: 0.05, default: 0.35 },
    seedParam(),
  ],
  draw(p) {
    const W = 512, H = 64;
    const c = canvasOf(W, H);
    const n = Math.round(p.arcs);
    paintAlpha(c, 0, 0, W, H, (u, vCanvas) => {
      const v = 1 - vCanvas; // canvas top row = outer edge of the ring
      const seg = (u * n) % 1;
      if (seg > p.length) return 0;
      const f = seg / p.length; // 0 tail .. 1 head
      const head = 1 - smooth(0.9, 1, f); // short soft cut at the leading tip
      const inner = 1 - p.thickness * (0.35 + 0.65 * f); // the band is widest at the head
      const across = smooth(inner, inner + 0.25, v) * (1 - smooth(0.93, 1, v));
      const along = Math.pow(f, 1.6) * head;
      const line = Math.exp(-Math.pow((v - 0.88) / 0.045, 2)) * Math.pow(f, 0.8) * head * p.edge;
      const tex = 1 - p.streaks + p.streaks * fbm(u, v, 3, 3, Math.round(p.seed), 12) * 1.5;
      return clamp01(across * along * 0.85 * tex + line);
    });
    return c;
  },
};

export const cross: GeneratorDef = {
  id: 'cross',
  label: '十字（治疗）',
  kind: 'sprite',
  hint: 'A rounded plus sign with a soft glow: healing, revive, holy marks.',
  params: [
    { key: 'arm', label: '臂长', min: 0.3, max: 0.9, step: 0.05, default: 0.7 },
    { key: 'width', label: '臂宽', min: 0.08, max: 0.4, step: 0.01, default: 0.2 },
    { key: 'glow', label: '光晕', min: 0, max: 1, step: 0.05, default: 0.6 },
  ],
  draw(p) {
    const c = canvasOf(SIZE, SIZE);
    const box = (x: number, y: number, hx: number, hy: number) => {
      const dx = Math.abs(x) - hx, dy = Math.abs(y) - hy;
      return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
    };
    const r = p.width * 0.35;
    paintAlpha(c, 0, 0, SIZE, SIZE, (u, v) => {
      const x = u * 2 - 1, y = v * 2 - 1;
      const d = Math.min(box(x, y, p.arm - r, p.width - r), box(x, y, p.width - r, p.arm - r)) - r;
      const body = 1 - smooth(-0.02, 0.02, d);
      const glow = p.glow * Math.exp(-Math.max(d, 0) / 0.12) * 0.7;
      return clamp01(body + glow);
    });
    return c;
  },
};

type Pt = [number, number];

export const cracks: GeneratorDef = {
  id: 'cracks',
  label: '地面裂痕',
  kind: 'sprite',
  hint: 'Radial ground cracks from the centre with jagged branches: ground slams, meteor impacts, earth skills. Use on a horizontal billboard; tint it like lava or glowing energy.',
  params: [
    { key: 'cracks', label: '主裂缝数', min: 3, max: 14, step: 1, default: 8 },
    { key: 'jagged', label: '曲折', min: 0, max: 1, step: 0.05, default: 0.55 },
    { key: 'branches', label: '分叉', min: 0, max: 4, step: 1, default: 2 },
    { key: 'lineWidth', label: '线宽', min: 1, max: 8, step: 0.5, default: 3.5 },
    { key: 'glow', label: '发光', min: 0, max: 1, step: 0.05, default: 0.7 },
    { key: 'core', label: '中心坑', min: 0, max: 1, step: 0.05, default: 0.5 },
    seedParam(),
  ],
  draw(p) {
    const c = canvasOf(SIZE, SIZE);
    const g = c.getContext('2d')!;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const rnd = prng(p.seed * 541 + 17);
    const C = SIZE / 2;
    const walk = (x: number, y: number, a: number, len: number, w: number, depth: number) => {
      const pts: Pt[] = [[x, y]];
      const steps = 9;
      for (let i = 0; i < steps; i++) {
        a += (rnd() - 0.5) * p.jagged * 1.4;
        x += (Math.cos(a) * len) / steps;
        y += (Math.sin(a) * len) / steps;
        pts.push([x, y]);
      }
      // thinner toward the tip: draw in three tapered pieces
      for (let k = 0; k < 3; k++) {
        const part = pts.slice(k * 3, k * 3 + 4);
        glowStroke(g, () => part.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))), Math.max(0.6, w * (1 - k * 0.3)), p.glow);
      }
      if (depth > 0) {
        for (let b = 0; b < Math.round(p.branches); b++) {
          const [bx, by] = pts[2 + Math.floor(rnd() * (pts.length - 4))];
          walk(bx, by, a + (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.6), len * (0.3 + rnd() * 0.25), w * 0.6, depth - 1);
        }
      }
    };
    const n = Math.round(p.cracks);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.5;
      const r0 = SIZE * 0.06;
      walk(C + Math.cos(a) * r0, C + Math.sin(a) * r0, a, SIZE * (0.3 + rnd() * 0.15), p.lineWidth, 1);
    }
    if (p.core > 0) {
      const gr = g.createRadialGradient(C, C, 0, C, C, SIZE * 0.14);
      gr.addColorStop(0, `rgba(255,255,255,${p.core})`);
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, SIZE, SIZE);
    }
    return c;
  },
};

export const swirl: GeneratorDef = {
  id: 'swirl',
  label: '漩涡',
  kind: 'sprite',
  hint: 'Spiral arms around the centre: portals, blink / teleport, vortex, stun swirls. Spin the particle for motion.',
  params: [
    { key: 'arms', label: '旋臂', min: 1, max: 8, step: 1, default: 3 },
    { key: 'twist', label: '扭曲', min: 0, max: 3, step: 0.1, default: 1.2 },
    { key: 'sharpness', label: '锐度', min: 0.5, max: 6, step: 0.25, default: 2.5 },
    { key: 'hole', label: '中心空洞', min: 0, max: 0.6, step: 0.05, default: 0.15 },
  ],
  draw(p) {
    const c = canvasOf(SIZE, SIZE);
    paintAlpha(c, 0, 0, SIZE, SIZE, (u, v) => {
      const x = u * 2 - 1, y = v * 2 - 1;
      const r = Math.hypot(x, y);
      if (r >= 1) return 0;
      const a = Math.atan2(y, x);
      const band = 0.5 + 0.5 * Math.cos(Math.round(p.arms) * a + p.twist * Math.PI * 2 * r);
      const radial = smooth(p.hole, p.hole + 0.2, r) * (1 - smooth(0.6, 1, r));
      return clamp01(Math.pow(band, p.sharpness) * radial * 1.2);
    });
    return c;
  },
};
