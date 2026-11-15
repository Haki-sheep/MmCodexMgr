// All procedural texture generators, and running one with checked parameters.

import type { AssetKind } from '../../../assets/types';
import { glow, ring, star } from './shapes';
import { crystal, lightning, runes, shard } from './strokes';
import { noiseTile, streaks, trail, voronoi } from './tiles';
import { FLIPBOOK_GENERATORS } from './flipbookGens';
import { arc, cracks, cross, swirl } from './motifs';
import type { GeneratorDef } from './types';

export type { GeneratorDef, ParamSpec } from './types';

export const GENERATORS: GeneratorDef[] = [glow, ring, star, runes, crystal, shard, lightning, trail, cross, cracks, swirl, noiseTile, voronoi, streaks, arc, ...FLIPBOOK_GENERATORS];

export const findGenerator = (id: string) => GENERATORS.find((g) => g.id === id);

/** Fills in defaults and clamps every value to its range and step. */
export function sanitizeParams(def: GeneratorDef, raw: unknown): Record<string, number> {
  const r = (raw ?? {}) as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const s of def.params) {
    const v = typeof r[s.key] === 'number' && Number.isFinite(r[s.key]) ? (r[s.key] as number) : s.default;
    const clamped = Math.min(s.max, Math.max(s.min, v));
    out[s.key] = s.step >= 1 ? Math.round(clamped) : Number((Math.round(clamped / s.step) * s.step).toFixed(6));
  }
  return out;
}

export interface Generated {
  canvas: HTMLCanvasElement;
  kind: AssetKind;
  tilesX: number;
  tilesY: number;
  params: Record<string, number>;
}

export function runGenerator(id: string, raw: unknown): Generated {
  const def = findGenerator(id);
  if (!def) throw new Error(`Unknown generator "${id}". Available: ${GENERATORS.map((g) => g.id).join(', ')}.`);
  const params = sanitizeParams(def, raw);
  const [tilesX, tilesY] = def.grid ? def.grid(params) : [1, 1];
  return { canvas: def.draw(params), kind: def.kind, tilesX, tilesY, params };
}
