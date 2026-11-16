// Draws a simulated frame into a transparent canvas.
// HD mode: smooth sprites + optional bloom.
// Pixel mode: render at art resolution, lock colours to a palette, hard alpha,
// optional ordered dither and 1px outline, then upscale with nearest neighbour.

import { simulateFrame, STRIDE, type LayerFrame } from './simulate';
import { tintedSprite, tintedImage, makeCanvas, ctx2d, TEX, type Canvas, type Ctx } from './sprites';
import { assetImage, assetSprite64 } from './assetImages';
import { paletteLut, getPalette } from './palettes';
import type { Effect } from './types';
import { hexToRgb } from './simulate';

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export interface RenderResult {
  canvas: Canvas;
  width: number;
  height: number;
  particles: number;
}

function ensure(c: Canvas | null, w: number, h: number): Canvas {
  if (!c) return makeCanvas(w, h);
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  return c;
}

export class Renderer {
  private work: Canvas | null = null;
  private out: Canvas | null = null;
  private low: Canvas | null = null;

  /** Pixel size of the rendered image for an effect at a given scale. */
  static outputSize(effect: Effect, scale = 1): { w: number; h: number } {
    if (effect.pixel.enabled) {
      const px = effect.pixel.size;
      return { w: Math.ceil(effect.width / px) * px * scale, h: Math.ceil(effect.height / px) * px * scale };
    }
    return { w: Math.round(effect.width * scale), h: Math.round(effect.height * scale) };
  }

  render(effect: Effect, t: number, scale = 1): RenderResult {
    const frames = simulateFrame(effect, t, this);
    const particles = frames.reduce((s, f) => s + f.count, 0);
    if (effect.pixel.enabled) return { ...this.renderPixel(effect, frames, scale), particles };
    return { ...this.renderHd(effect, frames, scale), particles };
  }

  private drawParticles(g: Ctx, frames: LayerFrame[], k: number) {
    for (const fr of frames) {
      if (!fr.count) continue;
      const em = fr.emitter;
      g.globalCompositeOperation = em.blend === 'add' ? 'lighter' : 'source-over';
      const d = fr.data;
      // a library texture replaces the built-in sprite while it is loaded
      const asset = em.texture ? assetSprite64(em.texture) : null;
      const assetKey = asset ? `${em.texture}@${assetImage(em.texture)!.version}` : '';
      for (let i = 0; i < fr.count; i++) {
        const o = i * STRIDE;
        const size = d[o + 2];
        const rot = d[o + 3];
        const sx = d[o + 4];
        const tex = asset ? tintedImage(assetKey, asset, d[o + 5] | 0, d[o + 6] | 0, d[o + 7] | 0) : tintedSprite(em.sprite, d[o + 5] | 0, d[o + 6] | 0, d[o + 7] | 0);
        const sc = (size / TEX) * k;
        const cs = Math.cos(rot) * sc;
        const sn = Math.sin(rot) * sc;
        g.globalAlpha = d[o + 8];
        g.setTransform(cs * sx, sn * sx, -sn, cs, d[o] * k, d[o + 1] * k);
        g.drawImage(tex as CanvasImageSource, -TEX / 2, -TEX / 2);
      }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }

  private renderHd(effect: Effect, frames: LayerFrame[], scale: number) {
    const { w, h } = Renderer.outputSize(effect, scale);
    this.work = ensure(this.work, w, h);
    const g = ctx2d(this.work);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, w, h);
    g.imageSmoothingEnabled = true;
    this.drawParticles(g, frames, scale);
    if (effect.bloom <= 0.001 || !('filter' in g)) return { canvas: this.work, width: w, height: h };

    this.out = ensure(this.out, w, h);
    const o = ctx2d(this.out);
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.clearRect(0, 0, w, h);
    o.drawImage(this.work as CanvasImageSource, 0, 0);
    o.globalCompositeOperation = 'lighter';
    o.globalAlpha = Math.min(1, effect.bloom * 1.2);
    o.filter = `blur(${Math.max(1, Math.round(8 * scale * (0.4 + effect.bloom)))}px)`;
    o.drawImage(this.work as CanvasImageSource, 0, 0);
    o.filter = 'none';
    o.globalAlpha = 1;
    o.globalCompositeOperation = 'source-over';
    return { canvas: this.out, width: w, height: h };
  }

  private renderPixel(effect: Effect, frames: LayerFrame[], scale: number) {
    const px = effect.pixel.size;
    const lw = Math.ceil(effect.width / px);
    const lh = Math.ceil(effect.height / px);
    this.low = ensure(this.low, lw, lh);
    const g = ctx2d(this.low);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, lw, lh);
    g.imageSmoothingEnabled = true;
    this.drawParticles(g, frames, 1 / px);

    const img = g.getImageData(0, 0, lw, lh);
    quantize(img, effect);
    g.putImageData(img, 0, 0);

    const { w, h } = Renderer.outputSize(effect, scale);
    this.out = ensure(this.out, w, h);
    const o = ctx2d(this.out);
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.clearRect(0, 0, w, h);
    o.imageSmoothingEnabled = false;
    o.drawImage(this.low as CanvasImageSource, 0, 0, w, h);
    return { canvas: this.out, width: w, height: h };
  }
}

/** Palette lock + hard alpha + outline, in place, at art resolution. */
export function quantize(img: ImageData, effect: Effect) {
  const { data, width, height } = img;
  const pal = paletteLut(effect.pixel.palette);
  const dither = effect.pixel.dither;
  const opaque = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = data[i + 3] / 255;
      const bay = (BAYER4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
      const cut = dither ? 0.12 + bay * 0.6 : 0.38;
      if (a < cut) {
        data[i + 3] = 0;
        continue;
      }
      // darken faint pixels a little so fades read as colour steps
      const shade = 0.45 + 0.55 * Math.min(1, a / 0.85);
      const off = dither ? (bay - 0.5) * 28 : 0;
      let r = data[i] * shade + off;
      let gg = data[i + 1] * shade + off;
      let b = data[i + 2] * shade + off;
      r = r < 0 ? 0 : r > 255 ? 255 : r;
      gg = gg < 0 ? 0 : gg > 255 ? 255 : gg;
      b = b < 0 ? 0 : b > 255 ? 255 : b;
      if (pal) {
        const idx = pal.lut[((r >> 3) << 10) | ((gg >> 3) << 5) | (b >> 3)];
        data[i] = pal.rgb[idx * 3];
        data[i + 1] = pal.rgb[idx * 3 + 1];
        data[i + 2] = pal.rgb[idx * 3 + 2];
      } else {
        data[i] = r;
        data[i + 1] = gg;
        data[i + 2] = b;
      }
      data[i + 3] = 255;
      opaque[y * width + x] = 1;
    }
  }
  if (!effect.pixel.outline) return;
  const [or, og, ob] = hexToRgb(effect.pixel.outlineColor);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (opaque[p]) continue;
      const n =
        (x > 0 && opaque[p - 1]) ||
        (x < width - 1 && opaque[p + 1]) ||
        (y > 0 && opaque[p - width]) ||
        (y < height - 1 && opaque[p + width]);
      if (!n) continue;
      const i = p * 4;
      data[i] = or;
      data[i + 1] = og;
      data[i + 2] = ob;
      data[i + 3] = 255;
    }
  }
}

export function paletteName(effect: Effect): string {
  return getPalette(effect.pixel.palette).name;
}
