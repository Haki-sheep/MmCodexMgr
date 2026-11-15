// Exporters: PNG sprite sheet + TexturePacker JSON, Aseprite JSON, Unity
// package (sheet + player script), GIF, PNG frame sequence, effect JSON.

import { zipSync, strToU8 } from 'fflate';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { Renderer } from '../engine/render';
import { frameCount } from '../engine/simulate';
import type { Effect } from '../engine/types';
import { UNITY_PLAYER_CS, unityReadme } from './unity';

export type ExportTarget = 'sheet-json' | 'aseprite' | 'unity' | 'gif' | 'png-frames' | 'effect-json';

export interface ExportOptions {
  target: ExportTarget;
  scale: number; // 1..4
  crop: boolean; // trim to the union of all frames
  padding: number; // px between sheet cells
  gifBackground: boolean; // GIF: draw on the preview background instead of 1-bit transparency
}

export interface RenderedFrames {
  frames: ImageData[];
  width: number;
  height: number;
  fps: number;
  count: number;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'effect';

function canvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export async function renderAllFrames(
  effect: Effect,
  scale: number,
  crop: boolean,
  onProgress?: (p: number) => void,
): Promise<RenderedFrames> {
  const renderer = new Renderer();
  const n = frameCount(effect);
  const { w, h } = Renderer.outputSize(effect, scale);
  const c = canvas(w, h);
  const g = c.getContext('2d', { willReadFrequently: true })!;
  const raw: ImageData[] = [];
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let i = 0; i < n; i++) {
    const t = i / effect.fps;
    const r = renderer.render(effect, t, scale);
    g.clearRect(0, 0, w, h);
    g.drawImage(r.canvas as CanvasImageSource, 0, 0);
    const img = g.getImageData(0, 0, w, h);
    raw.push(img);
    if (crop) {
      const d = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (d[(y * w + x) * 4 + 3] > 2) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
      }
    }
    if (i % 4 === 0) {
      onProgress?.((i + 1) / n);
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  onProgress?.(1);
  if (!crop || x1 < 0) return { frames: raw, width: w, height: h, fps: effect.fps, count: n };

  // pad a little, and keep pixel-art crops on the art grid
  const grid = effect.pixel.enabled ? effect.pixel.size * scale : 1;
  const pad = 2 * grid;
  x0 = Math.max(0, Math.floor((x0 - pad) / grid) * grid);
  y0 = Math.max(0, Math.floor((y0 - pad) / grid) * grid);
  x1 = Math.min(w, Math.ceil((x1 + 1 + pad) / grid) * grid);
  y1 = Math.min(h, Math.ceil((y1 + 1 + pad) / grid) * grid);
  const cw = x1 - x0;
  const ch = y1 - y0;
  const cropped = raw.map((img) => {
    const out = new ImageData(cw, ch);
    for (let y = 0; y < ch; y++) {
      const src = ((y + y0) * w + x0) * 4;
      out.data.set(img.data.subarray(src, src + cw * 4), y * cw * 4);
    }
    return out;
  });
  return { frames: cropped, width: cw, height: ch, fps: effect.fps, count: n };
}

interface Sheet {
  png: Uint8Array;
  width: number;
  height: number;
  cols: number;
  rows: number;
  cells: { x: number; y: number }[];
}

async function canvasToPng(c: HTMLCanvasElement): Promise<Uint8Array> {
  const blob: Blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('PNG encode failed'))), 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}

async function packSheet(rf: RenderedFrames, padding: number): Promise<Sheet> {
  const cols = Math.ceil(Math.sqrt(rf.count));
  const rows = Math.ceil(rf.count / cols);
  const W = cols * rf.width + (cols - 1) * padding;
  const H = rows * rf.height + (rows - 1) * padding;
  const c = canvas(W, H);
  const g = c.getContext('2d')!;
  const cells: { x: number; y: number }[] = [];
  rf.frames.forEach((img, i) => {
    const x = (i % cols) * (rf.width + padding);
    const y = Math.floor(i / cols) * (rf.height + padding);
    g.putImageData(img, x, y);
    cells.push({ x, y });
  });
  return { png: await canvasToPng(c), width: W, height: H, cols, rows, cells };
}

function texturePackerJson(name: string, rf: RenderedFrames, sheet: Sheet, image: string) {
  const ms = Math.round(1000 / rf.fps);
  const frames: Record<string, unknown> = {};
  sheet.cells.forEach((cell, i) => {
    frames[`${name}_${String(i).padStart(4, '0')}.png`] = {
      frame: { x: cell.x, y: cell.y, w: rf.width, h: rf.height },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: rf.width, h: rf.height },
      sourceSize: { w: rf.width, h: rf.height },
      duration: ms,
    };
  });
  return {
    frames,
    animations: { [name]: Object.keys(frames) },
    meta: {
      app: 'FX Forge',
      version: '0.1',
      image,
      format: 'RGBA8888',
      size: { w: sheet.width, h: sheet.height },
      scale: '1',
      fps: rf.fps,
      grid: { columns: sheet.cols, rows: sheet.rows, frameWidth: rf.width, frameHeight: rf.height, frameCount: rf.count },
    },
  };
}

function asepriteJson(name: string, rf: RenderedFrames, sheet: Sheet, image: string, effect: Effect) {
  const ms = Math.round(1000 / rf.fps);
  return {
    frames: sheet.cells.map((cell, i) => ({
      filename: `${name} ${i}.aseprite`,
      frame: { x: cell.x, y: cell.y, w: rf.width, h: rf.height },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: rf.width, h: rf.height },
      sourceSize: { w: rf.width, h: rf.height },
      duration: ms,
    })),
    meta: {
      app: 'https://www.aseprite.org/',
      version: '1.3',
      image,
      format: 'RGBA8888',
      size: { w: sheet.width, h: sheet.height },
      scale: '1',
      frameTags: [{ name, from: 0, to: rf.count - 1, direction: 'forward', color: '#000000ff', repeat: effect.loop === 'once' ? '1' : undefined }],
      layers: [{ name: 'FX', opacity: 255, blendMode: 'normal' }],
      slices: [],
    },
  };
}

function flattenOnto(rf: RenderedFrames, hex: string): RenderedFrames {
  const v = parseInt(hex.slice(1), 16);
  const br = (v >> 16) & 255;
  const bg = (v >> 8) & 255;
  const bb = v & 255;
  const frames = rf.frames.map((img) => {
    const out = new ImageData(img.width, img.height);
    const s = img.data;
    const d = out.data;
    for (let i = 0; i < s.length; i += 4) {
      const a = s[i + 3] / 255;
      d[i] = s[i] * a + br * (1 - a);
      d[i + 1] = s[i + 1] * a + bg * (1 - a);
      d[i + 2] = s[i + 2] * a + bb * (1 - a);
      d[i + 3] = 255;
    }
    return out;
  });
  return { ...rf, frames };
}

function encodeGif(rf: RenderedFrames, background: string | null): Uint8Array {
  if (background) rf = flattenOnto(rf, background);
  const gif = GIFEncoder();
  // one palette for the whole animation keeps colours stable between frames
  const sampleCount = Math.min(rf.count, 12);
  const stride = rf.width * rf.height * 4;
  const sample = new Uint8ClampedArray(stride * sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    sample.set(rf.frames[Math.floor((i * rf.count) / sampleCount)].data, i * stride);
  }
  const palette = quantize(sample, 256, { format: 'rgba4444', oneBitAlpha: true, clearAlpha: true, clearAlphaThreshold: 127 });
  const transparentIndex = palette.findIndex((c: number[]) => c[3] === 0);
  const transparent = !background && transparentIndex >= 0;
  const delay = Math.round(1000 / rf.fps);
  rf.frames.forEach((img) => {
    const index = applyPalette(img.data, palette, 'rgba4444');
    gif.writeFrame(index, rf.width, rf.height, { palette, delay, transparent, transparentIndex: Math.max(0, transparentIndex), dispose: transparent ? 2 : -1 });
  });
  gif.finish();
  return gif.bytes();
}

export function download(name: string, data: Uint8Array | string, type: string) {
  const blob = new Blob([typeof data === 'string' ? data : (data as BlobPart)], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export async function runExport(effect: Effect, opts: ExportOptions, onProgress?: (p: number) => void): Promise<string> {
  const name = slug(effect.name);
  if (opts.target === 'effect-json') {
    download(`${name}.fx.json`, JSON.stringify(effect, null, 2), 'application/json');
    return `${name}.fx.json`;
  }
  const rf = await renderAllFrames(effect, opts.scale, opts.crop, onProgress);

  if (opts.target === 'gif') {
    download(`${name}.gif`, encodeGif(rf, opts.gifBackground ? effect.background : null), 'image/gif');
    return `${name}.gif (${rf.count} frames, ${rf.width}×${rf.height})`;
  }
  if (opts.target === 'png-frames') {
    const files: Record<string, Uint8Array> = {};
    for (let i = 0; i < rf.count; i++) {
      const c = canvas(rf.width, rf.height);
      c.getContext('2d')!.putImageData(rf.frames[i], 0, 0);
      files[`${name}_${String(i).padStart(4, '0')}.png`] = await canvasToPng(c);
    }
    download(`${name}_frames.zip`, zipSync(files, { level: 0 }), 'application/zip');
    return `${name}_frames.zip (${rf.count} PNGs)`;
  }

  const padding = opts.target === 'unity' ? 0 : opts.padding;
  const sheet = await packSheet(rf, padding);
  const image = `${name}.png`;

  if (opts.target === 'sheet-json') {
    const json = JSON.stringify(texturePackerJson(name, rf, sheet, image), null, 2);
    download(`${name}_sheet.zip`, zipSync({ [image]: sheet.png, [`${name}.json`]: strToU8(json) }, { level: 0 }), 'application/zip');
    return `${name}_sheet.zip (${sheet.width}×${sheet.height}, ${sheet.cols}×${sheet.rows} grid)`;
  }
  if (opts.target === 'aseprite') {
    const json = JSON.stringify(asepriteJson(name, rf, sheet, image, effect), null, 2);
    download(`${name}_aseprite.zip`, zipSync({ [image]: sheet.png, [`${name}.json`]: strToU8(json) }, { level: 0 }), 'application/zip');
    return `${name}_aseprite.zip (${rf.count} frames, tag "${name}")`;
  }
  // unity
  const meta = {
    name,
    image,
    columns: sheet.cols,
    rows: sheet.rows,
    frameWidth: rf.width,
    frameHeight: rf.height,
    frameCount: rf.count,
    fps: rf.fps,
    loop: effect.loop === 'perfect',
    pixelArt: effect.pixel.enabled,
    additive: effect.layers.some((l) => l.blend === 'add'),
  };
  const files = {
    [`${name}/${image}`]: sheet.png,
    [`${name}/${name}.fxsheet.json`]: strToU8(JSON.stringify(meta, null, 2)),
    [`${name}/FxSheetPlayer.cs`]: strToU8(UNITY_PLAYER_CS),
    [`${name}/README.txt`]: strToU8(unityReadme(meta)),
  };
  download(`${name}_unity.zip`, zipSync(files, { level: 0 }), 'application/zip');
  return `${name}_unity.zip (${sheet.cols}×${sheet.rows} grid, ${rf.fps} fps)`;
}
