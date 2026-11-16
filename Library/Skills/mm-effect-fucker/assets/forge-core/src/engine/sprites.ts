// Particle textures: white base shapes drawn procedurally, tinted on demand.

import type { SpriteKind } from './types';

export const TEX = 64;
const H = TEX / 2;

type Canvas = HTMLCanvasElement | OffscreenCanvas;
type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function makeCanvas(w: number, h: number): Canvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function ctx2d(c: Canvas): Ctx {
  return c.getContext('2d') as Ctx;
}

function drawBase(kind: SpriteKind): Canvas {
  const c = makeCanvas(TEX, TEX);
  paint(ctx2d(c), kind);
  return c;
}

/** The same white sprite at any resolution (used for engine exports). */
export function spriteAtSize(kind: SpriteKind, size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  g.scale(size / TEX, size / TEX);
  paint(g, kind);
  return c;
}

function paint(g: Ctx, kind: SpriteKind) {
  g.fillStyle = '#fff';
  switch (kind) {
    case 'soft': {
      const grad = g.createRadialGradient(H, H, 0, H, H, H);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.25, 'rgba(255,255,255,0.75)');
      grad.addColorStop(0.6, 'rgba(255,255,255,0.22)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, TEX, TEX);
      break;
    }
    case 'circle':
      g.beginPath();
      g.arc(H, H, H - 1, 0, Math.PI * 2);
      g.fill();
      break;
    case 'square':
      g.fillRect(4, 4, TEX - 8, TEX - 8);
      break;
    case 'ring':
      g.beginPath();
      g.arc(H, H, H - 2, 0, Math.PI * 2);
      g.arc(H, H, H - 9, 0, Math.PI * 2, true);
      g.fill();
      break;
    case 'spark': {
      // a long, thin glowing diamond along +x
      const grad = g.createLinearGradient(0, H, TEX, H);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.55, 'rgba(255,255,255,1)');
      grad.addColorStop(0.8, 'rgba(255,255,255,0.9)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(0, H);
      g.lineTo(H + 6, H - 7);
      g.lineTo(TEX, H);
      g.lineTo(H + 6, H + 7);
      g.closePath();
      g.fill();
      break;
    }
    case 'star': {
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? H - 1 : H * 0.22;
        g.lineTo(H + Math.cos(a) * r, H + Math.sin(a) * r);
      }
      g.closePath();
      g.fill();
      const grad = g.createRadialGradient(H, H, 0, H, H, H * 0.5);
      grad.addColorStop(0, 'rgba(255,255,255,0.9)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, TEX, TEX);
      break;
    }
    case 'smoke': {
      // lumpy soft blob from a few overlapping puffs (fixed layout)
      const puffs = [
        [0, 0, 0.62],
        [-0.28, -0.12, 0.42],
        [0.26, -0.18, 0.4],
        [0.18, 0.24, 0.38],
        [-0.2, 0.22, 0.36],
      ];
      for (const [dx, dy, r] of puffs) {
        const cx = H + dx * H;
        const cy = H + dy * H;
        const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r * H);
        grad.addColorStop(0, 'rgba(255,255,255,0.55)');
        grad.addColorStop(0.7, 'rgba(255,255,255,0.25)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, TEX, TEX);
      }
      break;
    }
    case 'shard':
      g.beginPath();
      g.moveTo(H - 20, H + 6);
      g.lineTo(H - 4, H - 24);
      g.lineTo(H + 22, H - 4);
      g.lineTo(H + 6, H + 22);
      g.closePath();
      g.fill();
      break;
  }
}

const bases = new Map<SpriteKind, Canvas>();
const tinted = new Map<string, Canvas>();

export function baseSprite(kind: SpriteKind): Canvas {
  let c = bases.get(kind);
  if (!c) bases.set(kind, (c = drawBase(kind)));
  return c;
}

/** A tinted copy of a sprite: the colour replaces the sprite's, keeping its alpha. Colours are quantised to 5 bits per channel. */
export function tintedSprite(kind: SpriteKind, r: number, g: number, b: number): Canvas {
  return tinted_(kind, baseSprite(kind), r, g, b, false);
}

/**
 * A library texture multiplied by the particle colour, so coloured textures
 * keep their own colours under a white particle. `key` must identify the
 * source, including its version.
 */
export function tintedImage(key: string, source: Canvas | HTMLCanvasElement, r: number, g: number, b: number): Canvas {
  return tinted_(`@${key}`, source, r, g, b, true);
}

function tinted_(key: string, source: Canvas | HTMLCanvasElement, r: number, g: number, b: number, multiply: boolean): Canvas {
  const qr = r >> 3;
  const qg = g >> 3;
  const qb = b >> 3;
  const k = `${key}${(qr << 10) | (qg << 5) | qb}`;
  let c = tinted.get(k);
  if (c) return c;
  if (tinted.size > 5000) tinted.clear();
  c = makeCanvas(TEX, TEX);
  const g2 = ctx2d(c);
  g2.drawImage(source as CanvasImageSource, 0, 0, TEX, TEX);
  g2.globalCompositeOperation = multiply ? 'multiply' : 'source-in';
  g2.fillStyle = `rgb(${qr * 8 + 4},${qg * 8 + 4},${qb * 8 + 4})`;
  g2.fillRect(0, 0, TEX, TEX);
  if (multiply) {
    // multiply also paints transparent pixels: restore the source's alpha
    g2.globalCompositeOperation = 'destination-in';
    g2.drawImage(source as CanvasImageSource, 0, 0, TEX, TEX);
  }
  tinted.set(k, c);
  return c;
}

export { makeCanvas, ctx2d };
export type { Canvas, Ctx };

/** Trail texture: soft start at the head (U = 0), full along the rest, soft falloff across the width (V). */
export function trailTexture(w = 128, h = 32): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.65)');
  grad.addColorStop(0.5, 'rgba(255,255,255,1)');
  grad.addColorStop(0.7, 'rgba(255,255,255,0.65)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  // U = 0 is the particle (head). Fade the first ~12% so the trail starts
  // softly behind the head instead of ending in a hard, flat edge.
  const head = g.createLinearGradient(0, 0, w * 0.12, 0);
  head.addColorStop(0, 'rgba(0,0,0,0)');
  head.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-in';
  g.fillStyle = head;
  g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'source-over';
  return c;
}
