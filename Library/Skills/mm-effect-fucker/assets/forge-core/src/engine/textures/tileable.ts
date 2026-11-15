// Tileable textures: the noise used by dissolve, and main textures for UV
// scrolling (energy flowing along a ring or a beam).

import type { MainTexture } from '../render3d/material';
import { clamp01, fbm } from './noise';
import { canvasOf, paintAlpha, paintGrey } from './raster';

export const TILE_SIZE = 128;

/** Grey fBm noise (opaque). Dissolve compares its value with the cut-off. */
export function dissolveNoise(size = TILE_SIZE): HTMLCanvasElement {
  const c = canvasOf(size, size);
  paintGrey(c, (u, v) => clamp01((fbm(u, v, 4, 4, 7) - 0.5) * 1.6 + 0.5)); // spread over the whole range
  return c;
}

/** Main textures for UV scrolling (white with alpha). */
export function tileableMain(kind: Exclude<MainTexture, 'sprite'>, size = TILE_SIZE): HTMLCanvasElement {
  const c = canvasOf(size, size);
  if (kind === 'noise') {
    paintAlpha(c, 0, 0, size, size, (u, v) => Math.pow(clamp01((fbm(u, v, 3, 4, 3) - 0.3) / 0.5), 1.6));
  } else {
    // streaks run along U: long in U, thin in V
    paintAlpha(c, 0, 0, size, size, (u, v) => Math.pow(clamp01((fbm(u, v, 2, 3, 11, 12) - 0.42) / 0.35), 2.2));
  }
  return c;
}
