// Write a per-pixel function into a canvas (white with alpha, or grey levels).

export function canvasOf(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Fills a w x h region at (ox, oy) with white pixels whose alpha is `alpha(u, v)` (u, v in 0..1). */
export function paintAlpha(c: HTMLCanvasElement, ox: number, oy: number, w: number, h: number, alpha: (u: number, v: number) => number) {
  const g = c.getContext('2d')!;
  const img = g.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = alpha((x + 0.5) / w, (y + 0.5) / h);
      const k = (y * w + x) * 4;
      d[k] = d[k + 1] = d[k + 2] = 255;
      d[k + 3] = Math.round(Math.max(0, Math.min(1, a)) * 255);
    }
  }
  g.putImageData(img, ox, oy);
}

/** Fills the canvas with opaque grey levels `value(u, v)` (u, v in 0..1). */
export function paintGrey(c: HTMLCanvasElement, value: (u: number, v: number) => number) {
  const g = c.getContext('2d')!;
  const img = g.createImageData(c.width, c.height);
  const d = img.data;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const v = Math.round(Math.max(0, Math.min(1, value((x + 0.5) / c.width, (y + 0.5) / c.height))) * 255);
      const k = (y * c.width + x) * 4;
      d[k] = d[k + 1] = d[k + 2] = v;
      d[k + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
}
