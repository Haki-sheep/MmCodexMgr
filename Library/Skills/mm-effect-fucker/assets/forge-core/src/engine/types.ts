// Effect document format. Everything here is plain JSON so effects can be
// saved, diffed, sent to the AI and loaded back.

import { sanitizeAssetRef } from '../assets/types';

export type Blend = 'add' | 'normal';
export type ShapeKind = 'point' | 'circle' | 'ring' | 'rect' | 'line';
export type DirectionMode = 'angle' | 'outward' | 'inward';
export type SpriteKind = 'soft' | 'circle' | 'square' | 'spark' | 'star' | 'ring' | 'smoke' | 'shard';
export type SizeEase = 'linear' | 'easeOut' | 'easeIn' | 'pop';
/** perfect: Looping + Prewarm (seamless); loop (3D only): Looping without Prewarm, starts empty; once: plays once. */
export type LoopMode = 'perfect' | 'loop' | 'once';

export interface Range {
  min: number;
  max: number;
}

export interface ColorStop {
  t: number; // 0..1 over the particle's life
  color: string; // #rrggbb
}

export interface Burst {
  time: number; // seconds inside the loop
  count: number;
  // 3D (Unity's burst options): repeat `cycles` times every `interval` s, each with this probability
  cycles?: number;
  interval?: number;
  probability?: number;
}

export interface Emitter {
  id: string;
  name: string;
  visible: boolean;
  blend: Blend;

  // Where particles are born (canvas pixels, 0,0 = top-left)
  x: number;
  y: number;
  shape: ShapeKind;
  shapeW: number; // circle/ring diameter, rect width, line length
  shapeH: number; // rect height
  shapeAngle: number; // degrees, rotates rect and line

  // When particles are born
  rate: number; // particles per second (0 = bursts only)
  bursts: Burst[];
  startDelay: number; // seconds before continuous emission starts
  stopAfter: number; // seconds at which continuous emission stops (0 = end of loop)
  maxParticles: number; // safety cap on live particles

  // How they move
  lifetime: Range; // seconds
  speed: Range; // px/s
  direction: number; // degrees, 0 = right, 90 = down, -90 = up
  spread: number; // degrees, full cone width
  directionMode: DirectionMode;
  gravityX: number; // px/s^2
  gravityY: number;
  drag: number; // 1/s
  turbulence: number; // px/s^2
  turbulenceScale: number; // px, size of the swirls
  vortex: number; // px/s^2 tangential pull around the emitter
  attract: number; // px/s^2 pull toward the emitter (negative pushes away)
  floor: boolean;
  floorY: number;
  bounce: number; // 0..1
  friction: number; // 0..1

  // How they look
  sprite: SpriteKind;
  /** Texture asset id from the library ('' = the built-in sprite). */
  texture: string;
  sizeStart: Range; // px diameter at birth
  sizeEnd: number; // multiplier of the birth size at death
  sizeEase: SizeEase;
  colors: ColorStop[];
  stepped: boolean; // hard colour bands instead of a smooth gradient
  hueJitter: number; // degrees of random hue offset per particle
  alpha: number; // 0..1
  fadeIn: number; // fraction of life
  fadeOut: number; // fraction of life
  flicker: number; // 0..1
  stretch: number; // stretch along velocity (0 = none)
  spin: Range; // degrees per second
  randomRotation: boolean;
}

export interface PixelSettings {
  enabled: boolean;
  size: number; // screen pixels per art pixel
  palette: string; // palette id from palettes.ts
  dither: boolean;
  outline: boolean;
  outlineColor: string;
}

export interface Effect {
  version: 1;
  name: string;
  width: number;
  height: number;
  duration: number; // seconds, loop length
  fps: number; // export frame rate
  loop: LoopMode;
  background: string; // preview background only, exports are transparent
  bloom: number; // 0..1 soft glow (HD mode)
  seed: number;
  pixel: PixelSettings;
  layers: Emitter[];
}

let idCounter = 0;
export function newId(prefix = 'e'): string {
  idCounter = (idCounter + 1) % 1e6;
  return `${prefix}_${Date.now().toString(36).slice(-4)}${idCounter.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}

export function defaultEmitter(over: Partial<Emitter> = {}): Emitter {
  return {
    id: newId(),
    name: 'Emitter',
    visible: true,
    blend: 'add',
    x: 128,
    y: 128,
    shape: 'point',
    shapeW: 20,
    shapeH: 20,
    shapeAngle: 0,
    rate: 40,
    bursts: [],
    startDelay: 0,
    stopAfter: 0,
    maxParticles: 2000,
    lifetime: { min: 0.6, max: 1.0 },
    speed: { min: 40, max: 90 },
    direction: -90,
    spread: 40,
    directionMode: 'angle',
    gravityX: 0,
    gravityY: 0,
    drag: 0,
    turbulence: 0,
    turbulenceScale: 60,
    vortex: 0,
    attract: 0,
    floor: false,
    floorY: 220,
    bounce: 0.3,
    friction: 0.3,
    sprite: 'soft',
    texture: '',
    sizeStart: { min: 10, max: 16 },
    sizeEnd: 0.2,
    sizeEase: 'linear',
    colors: [
      { t: 0, color: '#fff4c2' },
      { t: 0.4, color: '#ff9a2e' },
      { t: 1, color: '#8a1d10' },
    ],
    stepped: false,
    hueJitter: 0,
    alpha: 1,
    fadeIn: 0.05,
    fadeOut: 0.4,
    flicker: 0,
    stretch: 0,
    spin: { min: 0, max: 0 },
    randomRotation: true,
    ...over,
  };
}

export function defaultEffect(over: Partial<Effect> = {}): Effect {
  return {
    version: 1,
    name: 'Untitled effect',
    width: 256,
    height: 256,
    duration: 2,
    fps: 30,
    loop: 'perfect',
    background: '#15131f',
    bloom: 0.3,
    seed: 1,
    pixel: { enabled: false, size: 3, palette: 'endesga32', dither: false, outline: false, outlineColor: '#181425' },
    layers: [defaultEmitter({ name: 'Fire' })],
    ...over,
  };
}

// ---------------------------------------------------------------------------
// Sanitising: anything loaded from disk, localStorage or the AI goes through
// here so the engine never sees NaN, negative lifetimes or unknown enums.

const num = (v: unknown, d: number, lo = -Infinity, hi = Infinity): number => {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : d;
  return Math.min(hi, Math.max(lo, n));
};
const pick = <T extends string>(v: unknown, opts: readonly T[], d: T): T =>
  typeof v === 'string' && (opts as readonly string[]).includes(v) ? (v as T) : d;
const bool = (v: unknown, d: boolean): boolean => (typeof v === 'boolean' ? v : d);
const HEX = /^#[0-9a-fA-F]{6}$/;
export const color = (v: unknown, d: string): string => {
  if (typeof v !== 'string') return d;
  if (HEX.test(v)) return v.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(v)) return ('#' + [...v.slice(1)].map((c) => c + c).join('')).toLowerCase();
  return d;
};
const range = (v: unknown, d: Range, lo: number, hi: number): Range => {
  const r = (v ?? {}) as Partial<Range>;
  let a = num(r.min, d.min, lo, hi);
  let b = num(r.max, d.max, lo, hi);
  if (a > b) [a, b] = [b, a];
  return { min: a, max: b };
};

export function sanitizeEmitter(raw: unknown, effectW = 256, effectH = 256): Emitter {
  const d = defaultEmitter();
  const r = (raw ?? {}) as Record<string, unknown>;
  const colorsRaw = Array.isArray(r.colors) ? r.colors : d.colors;
  let colors = colorsRaw
    .map((c: any) => ({ t: num(c?.t, 0, 0, 1), color: color(c?.color, '#ffffff') }))
    .sort((a, b) => a.t - b.t)
    .slice(0, 12);
  if (colors.length === 0) colors = d.colors;
  const bursts = (Array.isArray(r.bursts) ? r.bursts : [])
    .map((b: any) => ({ time: num(b?.time, 0, 0, 60), count: Math.round(num(b?.count, 10, 0, 5000)) }))
    .slice(0, 32);
  return {
    id: typeof r.id === 'string' && r.id ? r.id : newId(),
    name: typeof r.name === 'string' && r.name ? r.name.slice(0, 60) : d.name,
    visible: bool(r.visible, true),
    blend: pick(r.blend, ['add', 'normal'] as const, d.blend),
    x: num(r.x, effectW / 2, -effectW, effectW * 2),
    y: num(r.y, effectH / 2, -effectH, effectH * 2),
    shape: pick(r.shape, ['point', 'circle', 'ring', 'rect', 'line'] as const, d.shape),
    shapeW: num(r.shapeW, d.shapeW, 0, 4096),
    shapeH: num(r.shapeH, d.shapeH, 0, 4096),
    shapeAngle: num(r.shapeAngle, 0, -360, 360),
    rate: num(r.rate, d.rate, 0, 3000),
    bursts,
    startDelay: num(r.startDelay, 0, 0, 60),
    stopAfter: num(r.stopAfter, 0, 0, 60),
    maxParticles: Math.round(num(r.maxParticles, d.maxParticles, 1, 20000)),
    lifetime: range(r.lifetime, d.lifetime, 0.02, 30),
    speed: range(r.speed, d.speed, -5000, 5000),
    direction: num(r.direction, d.direction, -720, 720),
    spread: num(r.spread, d.spread, 0, 360),
    directionMode: pick(r.directionMode, ['angle', 'outward', 'inward'] as const, 'angle'),
    gravityX: num(r.gravityX, 0, -10000, 10000),
    gravityY: num(r.gravityY, 0, -10000, 10000),
    drag: num(r.drag, 0, 0, 50),
    turbulence: num(r.turbulence, 0, 0, 20000),
    turbulenceScale: num(r.turbulenceScale, 60, 4, 2000),
    vortex: num(r.vortex, 0, -20000, 20000),
    attract: num(r.attract, 0, -20000, 20000),
    floor: bool(r.floor, false),
    floorY: num(r.floorY, effectH * 0.85, -4096, 8192),
    bounce: num(r.bounce, 0.3, 0, 1),
    friction: num(r.friction, 0.3, 0, 1),
    sprite: pick(r.sprite, ['soft', 'circle', 'square', 'spark', 'star', 'ring', 'smoke', 'shard'] as const, d.sprite),
    texture: sanitizeAssetRef(r.texture),
    sizeStart: range(r.sizeStart, d.sizeStart, 0.5, 2048),
    sizeEnd: num(r.sizeEnd, d.sizeEnd, 0, 20),
    sizeEase: pick(r.sizeEase, ['linear', 'easeOut', 'easeIn', 'pop'] as const, 'linear'),
    colors,
    stepped: bool(r.stepped, false),
    hueJitter: num(r.hueJitter, 0, 0, 180),
    alpha: num(r.alpha, 1, 0, 1),
    fadeIn: num(r.fadeIn, 0, 0, 1),
    fadeOut: num(r.fadeOut, 0.3, 0, 1),
    flicker: num(r.flicker, 0, 0, 1),
    stretch: num(r.stretch, 0, 0, 20),
    spin: range(r.spin, d.spin, -3600, 3600),
    randomRotation: bool(r.randomRotation, true),
  };
}

export function sanitizeEffect(raw: unknown): Effect {
  const d = defaultEffect();
  const r = (raw ?? {}) as Record<string, unknown>;
  const width = Math.round(num(r.width, d.width, 16, 2048));
  const height = Math.round(num(r.height, d.height, 16, 2048));
  const p = (r.pixel ?? {}) as Record<string, unknown>;
  const layersRaw = Array.isArray(r.layers) ? r.layers.slice(0, 16) : d.layers;
  const layers = layersRaw.map((l) => sanitizeEmitter(l, width, height));
  // ids must be unique for selection to work
  const seen = new Set<string>();
  for (const l of layers) {
    if (seen.has(l.id)) l.id = newId();
    seen.add(l.id);
  }
  return {
    version: 1,
    name: typeof r.name === 'string' && r.name ? r.name.slice(0, 80) : d.name,
    width,
    height,
    duration: num(r.duration, d.duration, 0.1, 30),
    fps: Math.round(num(r.fps, d.fps, 1, 60)),
    loop: pick(r.loop, ['perfect', 'once'] as const, 'perfect'),
    background: color(r.background, d.background),
    bloom: num(r.bloom, 0, 0, 1),
    seed: Math.round(num(r.seed, 1, 0, 1e9)),
    pixel: {
      enabled: bool(p.enabled, false),
      size: Math.round(num(p.size, 3, 1, 16)),
      palette: typeof p.palette === 'string' ? p.palette : 'endesga32',
      dither: bool(p.dither, false),
      outline: bool(p.outline, false),
      outlineColor: color(p.outlineColor, '#181425'),
    },
    layers,
  };
}

export const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
