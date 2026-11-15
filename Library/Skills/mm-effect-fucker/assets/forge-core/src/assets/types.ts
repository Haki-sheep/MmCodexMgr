// Texture assets: images in the shared library that layers reference by id.
// A sprite is one image, a tile repeats (UV scrolling, dissolve), a flipbook
// is a grid of frames read left to right, top to bottom.

export type AssetKind = 'sprite' | 'tile' | 'flipbook';
export const ASSET_KINDS: readonly AssetKind[] = ['sprite', 'tile', 'flipbook'];

export type AssetSource =
  | { type: 'procedural'; generator: string; params: Record<string, number> }
  | { type: 'ai'; prompt: string }
  | { type: 'drawn'; shapes: string }
  | { type: 'import'; file: string };

export interface AssetRecord {
  id: string;
  name: string;
  kind: AssetKind;
  /** Flipbook grid; 1 x 1 for sprites and tiles. */
  tilesX: number;
  tilesY: number;
  width: number;
  height: number;
  /** PNG as a data: URL (white or coloured, with alpha). */
  dataUrl: string;
  source: AssetSource;
  createdAt: number;
}

/** Asset ids look like a_k3j9x2q1. Layers store '' for "no asset". */
export const ASSET_ID = /^a_[a-z0-9]{4,24}$/;

export const newAssetId = () => `a_${Date.now().toString(36)}${Math.floor(Math.random() * 36 ** 4).toString(36).padStart(4, '0')}`;

const MAX_DATA_URL = 8 * 1024 * 1024;

const int = (v: unknown, d: number, lo: number, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : d);
const str = (v: unknown, d: string, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : d);

function sanitizeSource(raw: any): AssetSource {
  if (raw?.type === 'procedural' && typeof raw.generator === 'string') {
    const params: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw.params ?? {})) if (typeof v === 'number' && Number.isFinite(v)) params[k.slice(0, 32)] = v;
    return { type: 'procedural', generator: raw.generator.slice(0, 40), params };
  }
  if (raw?.type === 'ai') return { type: 'ai', prompt: str(raw.prompt, '', 4000) };
  if (raw?.type === 'drawn') return { type: 'drawn', shapes: str(raw.shapes, '', 20000) };
  return { type: 'import', file: str(raw?.file, '', 200) };
}

/** Validates a stored or imported asset; null when it is unusable. */
export function sanitizeAsset(raw: unknown): AssetRecord | null {
  const r = (raw ?? {}) as Record<string, any>;
  if (typeof r.id !== 'string' || !ASSET_ID.test(r.id)) return null;
  if (typeof r.dataUrl !== 'string' || !r.dataUrl.startsWith('data:image/') || r.dataUrl.length > MAX_DATA_URL) return null;
  const kind = (ASSET_KINDS as readonly string[]).includes(r.kind) ? (r.kind as AssetKind) : 'sprite';
  const flip = kind === 'flipbook';
  return {
    id: r.id,
    name: str(r.name, r.id, 60),
    kind,
    tilesX: flip ? int(r.tilesX, 4, 1, 16) : 1,
    tilesY: flip ? int(r.tilesY, 4, 1, 16) : 1,
    width: int(r.width, 0, 0, 8192),
    height: int(r.height, 0, 0, 8192),
    dataUrl: r.dataUrl,
    source: sanitizeSource(r.source),
    createdAt: int(r.createdAt, Date.now(), 0, 1e14),
  };
}

/** For effect fields that hold an asset reference. */
export const sanitizeAssetRef = (v: unknown): string => (typeof v === 'string' && ASSET_ID.test(v) ? v : '');
