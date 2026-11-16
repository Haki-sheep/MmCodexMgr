// Synchronous lookup of decoded texture assets for the renderers. The app's
// asset library fills it; the engine only reads it, so engine code never
// depends on storage or UI. A missing id means "draw the built-in texture".

export interface AssetImage {
  canvas: HTMLCanvasElement;
  kind: 'sprite' | 'tile' | 'flipbook';
  tilesX: number;
  tilesY: number;
  /** Bumped whenever the image of this id changes, so GPU caches can tell. */
  version: number;
}

const images = new Map<string, AssetImage>();
let version = 0;

export function setAssetImage(id: string, img: Omit<AssetImage, 'version'>) {
  images.set(id, { ...img, version: ++version });
}

export function removeAssetImage(id: string) {
  images.delete(id);
}

export function assetImage(id: string): AssetImage | null {
  return (id && images.get(id)) || null;
}

/** 64 x 64 copies for the 2D renderer (its sprites are 64 px), cached per version. */
const small = new Map<string, { version: number; canvas: HTMLCanvasElement }>();

export function assetSprite64(id: string): HTMLCanvasElement | null {
  const img = assetImage(id);
  if (!img) return null;
  const hit = small.get(id);
  if (hit && hit.version === img.version) return hit.canvas;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  // flipbooks show their first frame in 2D
  const sw = img.canvas.width / img.tilesX, sh = img.canvas.height / img.tilesY;
  g.drawImage(img.canvas, 0, 0, sw, sh, 0, 0, 64, 64);
  small.set(id, { version: img.version, canvas: c });
  return c;
}
