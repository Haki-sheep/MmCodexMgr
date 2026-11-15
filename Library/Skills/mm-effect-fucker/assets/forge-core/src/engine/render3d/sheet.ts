// Texture Sheet Animation (flipbooks): Unity's Grid mode, Whole Sheet.

import { bool, num, obj, pick } from './sanitize';
import { sanitizeAssetRef } from '../../assets/types';
import { evalCurve, sanitizeCurve, type Curve } from '../curve';

/** Built-in flipbooks, drawn procedurally (see engine/textures/flipbooks). */
export type FlipbookKind = 'smoke' | 'fire' | 'electric' | 'energy';
export const FLIPBOOKS: readonly FlipbookKind[] = ['smoke', 'fire', 'electric', 'energy'];
export const FLIPBOOK_TILES = 4; // 4x4 frames

export interface TextureSheet3D {
  enabled: boolean;
  texture: FlipbookKind;
  /** Flipbook asset id from the library ('' = the built-in texture above). Its grid comes from the asset. */
  asset: string;
  /** 'lifetime': the whole sheet plays `cycles` times over the particle's life. 'fps': fixed frame rate. */
  mode: 'lifetime' | 'fps';
  cycles: number;
  fps: number;
  /** Start on a random frame. */
  randomStart: boolean;
  /**
   * Unity's Frame over Time: position in the sheet (0..1) over each cycle of the life
   * ('lifetime' mode). Empty = linear 0 to 1; a constant curve holds one frame.
   */
  frameCurve: Curve;
  /** Unity's Start Frame as a fraction of the sheet (0..1), added before the frame is picked. */
  startFrame: number;
}

export const defaultSheet3D = (): TextureSheet3D => ({
  enabled: false,
  texture: 'smoke',
  asset: '',
  mode: 'lifetime',
  cycles: 1,
  fps: 24,
  randomStart: false,
  frameCurve: [],
  startFrame: 0,
});

export function sanitizeSheet3D(raw: unknown): TextureSheet3D {
  const d = defaultSheet3D();
  const r = obj(raw);
  return {
    enabled: bool(r.enabled, false),
    texture: pick(r.texture, FLIPBOOKS, d.texture),
    asset: sanitizeAssetRef(r.asset),
    mode: pick(r.mode, ['lifetime', 'fps'] as const, d.mode),
    cycles: Math.round(num(r.cycles, 1, 1, 32)),
    fps: num(r.fps, d.fps, 1, 120),
    randomStart: bool(r.randomStart, false),
    frameCurve: sanitizeCurve(r.frameCurve, 0, 1),
    startFrame: num(r.startFrame, 0, 0, 1),
  };
}

/**
 * Frame shown at life fraction f (0..1) and age (s); `rnd` is the particle's stable random.
 * Unity (BakeMesh, 2022.3): position = frameOverTime(frac(f × cycles)) + startFrame, frame =
 * floor(frac(position) × frames); a constant Frame over Time ignores the cycles. The preview
 * shader (PARTICLE_FRAG) does the same.
 */
export function sheetFrame(s: TextureSheet3D, f: number, age: number, rnd: number, n = FLIPBOOK_TILES * FLIPBOOK_TILES): number {
  if (s.mode === 'fps') return (Math.floor(age * s.fps) + (s.randomStart ? Math.floor(rnd * n) : 0)) % n;
  const tc = (Math.min(f, 0.99999) * s.cycles) % 1;
  const pos = (s.frameCurve.length ? evalCurve(s.frameCurve, tc) : tc) + (s.randomStart ? rnd : s.startFrame);
  return Math.min(n - 1, Math.floor((pos - Math.floor(pos)) * n));
}
