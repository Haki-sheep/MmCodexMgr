// Per-layer particle material: one general unlit particle shader in the
// preview and in Unity (FXForge/Particle), with optional features.

import { bool, hex, num, obj, pick } from './sanitize';
import { sanitizeAssetRef } from '../../assets/types';
import { sanitizeShaderRef } from '../../shaders/types';
import { sanitizeCurve, type Curve } from '../curve';

/** Main texture: the layer's sprite, or a tileable texture (for UV scrolling). */
export type MainTexture = 'sprite' | 'noise' | 'streaks';
export const MAIN_TEXTURES: readonly MainTexture[] = ['sprite', 'noise', 'streaks'];

export interface Material3D {
  /** HDR multiplier on the colour; above 1 it glows under Bloom. */
  intensity: number;
  mainTexture: MainTexture;
  /** Texture asset id from the library ('' = use mainTexture). Replaces the main texture. */
  texture: string;
  /** Custom shader id from the shader library ('' = the standard material). */
  shader: string;
  /** UV offset per second of particle age (tileable textures only). */
  scrollX: number;
  scrollY: number;
  /** Noise dissolve: the cut-off goes from dissolveFrom to dissolveTo over the particle's life. */
  dissolve: boolean;
  dissolveFrom: number;
  dissolveTo: number;
  dissolveEdge: number; // edge width, 0..0.5 of the noise range
  dissolveEdgeColor: string;
  dissolveScale: number; // noise tiling
  /** Texture asset whose red channel replaces the built-in noise ('' = noise), sampled at the particle's UV without a random offset. */
  dissolveTexture: string;
  /** Width of the soft cut (noise units). */
  dissolveSoftness: number;
  /** Cut-off over the particle's life (replaces dissolveFrom / dissolveTo when not empty). */
  dissolveCurve: Curve;
  /** Rim light on mesh particles. 0 = off. */
  fresnel: number;
  fresnelPower: number;
  fresnelColor: string;
  /** Soft particles: fade over this distance (metres) in front of opaque geometry. 0 = off. */
  softness: number;
}

export const defaultMaterial3D = (): Material3D => ({
  intensity: 1,
  mainTexture: 'sprite',
  texture: '',
  shader: '',
  scrollX: 0,
  scrollY: 0,
  dissolve: false,
  dissolveFrom: 0,
  dissolveTo: 1,
  dissolveEdge: 0.08,
  dissolveEdgeColor: '#ffffff',
  dissolveScale: 1,
  dissolveTexture: '',
  dissolveSoftness: 0.02,
  dissolveCurve: [],
  fresnel: 0,
  fresnelPower: 2,
  fresnelColor: '#ffffff',
  softness: 0,
});

export function sanitizeMaterial3D(raw: unknown): Material3D {
  const d = defaultMaterial3D();
  const r = obj(raw);
  return {
    intensity: num(r.intensity, d.intensity, 0, 32),
    mainTexture: pick(r.mainTexture, MAIN_TEXTURES, d.mainTexture),
    texture: sanitizeAssetRef(r.texture),
    shader: sanitizeShaderRef(r.shader),
    scrollX: num(r.scrollX, 0, -20, 20),
    scrollY: num(r.scrollY, 0, -20, 20),
    dissolve: bool(r.dissolve, false),
    dissolveFrom: num(r.dissolveFrom, d.dissolveFrom, 0, 1),
    dissolveTo: num(r.dissolveTo, d.dissolveTo, 0, 1),
    dissolveEdge: num(r.dissolveEdge, d.dissolveEdge, 0, 0.5),
    dissolveEdgeColor: hex(r.dissolveEdgeColor, d.dissolveEdgeColor),
    dissolveScale: num(r.dissolveScale, d.dissolveScale, 0.1, 16),
    dissolveTexture: sanitizeAssetRef(r.dissolveTexture),
    dissolveSoftness: num(r.dissolveSoftness, d.dissolveSoftness, 0.001, 1),
    dissolveCurve: sanitizeCurve(r.dissolveCurve, -2, 2),
    fresnel: num(r.fresnel, 0, 0, 8),
    fresnelPower: num(r.fresnelPower, d.fresnelPower, 0.1, 16),
    fresnelColor: hex(r.fresnelColor, d.fresnelColor),
    softness: num(r.softness, 0, 0, 10),
  };
}
