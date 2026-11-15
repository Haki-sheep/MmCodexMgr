// 3D effect document. Fields mirror Unity's ParticleSystem modules so the
// Unity importer can map them one to one. Units are Unity units (metres),
// angles are degrees, Y is up, and coordinates use Unity's left-handed axes
// (+Z is forward, away from the default camera).

import type { ColorStop, Burst, Range, SizeEase, LoopMode, SpriteKind } from './types';
import { newId, color as safeColor } from './types';
import { defaultMaterial3D, sanitizeMaterial3D, type Material3D } from './render3d/material';
import { defaultSheet3D, sanitizeSheet3D, type TextureSheet3D } from './render3d/sheet';
import { sanitizeMeshAlign, sanitizeMeshKind, type MeshAlign, type MeshKind, type MeshRef } from './render3d/meshKinds';
import { defaultBloom3D, sanitizeBloom3D, type Bloom3D } from './render3d/bloom';
import { repairLinks } from './hierarchy3d';
import { sanitizeCurve, type Curve } from './curve';

export type { Material3D, TextureSheet3D, MeshKind, MeshRef, MeshAlign, Bloom3D };

export type Shape3D = 'sphere' | 'hemisphere' | 'cone' | 'coneVolume' | 'box' | 'circle' | 'donut' | 'rectangle' | 'edge';
export const SHAPES_3D: readonly Shape3D[] = ['sphere', 'hemisphere', 'cone', 'coneVolume', 'box', 'circle', 'donut', 'rectangle', 'edge'];
export type RenderMode3D = 'billboard' | 'stretched' | 'horizontal' | 'vertical' | 'mesh' | 'none';
/**
 * add: additive; normal: alpha blended; premultiply: Unity's "Alpha Blended Premultiply"
 * (the texture's colour counts as already multiplied by its alpha: glowing edges);
 * softAdd: Unity's "Additive (Soft)" (One, OneMinusSrcColor: adds light without burning out).
 */
export type Blend3D = 'add' | 'normal' | 'premultiply' | 'softAdd';
/** Unity point light: colour (sRGB), intensity (Unity units: colour x intensity, then to linear), range (m). */
export interface LayerLight {
  enabled: boolean;
  color: string;
  intensity: number;
  range: number;
}
export type SortMode = 'none' | 'distance' | 'oldestInFront' | 'youngestInFront';
export const SORT_MODES: readonly SortMode[] = ['none', 'distance', 'oldestInFront', 'youngestInFront'];
export type ArcMode = 'random' | 'loop' | 'pingpong' | 'burstSpread';
export const ARC_MODES: readonly ArcMode[] = ['random', 'loop', 'pingpong', 'burstSpread'];

export const BLENDS_3D: readonly Blend3D[] = ['add', 'normal', 'premultiply', 'softAdd'];

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Emitter3D {
  id: string;
  name: string;
  visible: boolean;
  /** Unity's Renderer enabled: false simulates the particles (they still carry sub-emitters) without drawing them. */
  rendered: boolean;
  blend: Blend3D;
  /** Empty node: a Transform only (Unity: a GameObject without a ParticleSystem), used to group layers. */
  empty: boolean;

  // Transform (Unity: localPosition / localEulerAngles of the layer object),
  // relative to the parent layer (see engine/hierarchy3d.ts)
  parentId: string; // '' = child of the effect root
  position: Vec3;
  rotation: Vec3;

  // Main module
  startLifetime: Range;
  startSpeed: Range;
  startSize: Range;
  startRotation: Range; // degrees
  // Unity's 3D Start Size / Start Rotation: startSize is then the X size (billboard width),
  // startSizeY the height (stretched: the length factor), startSizeZ the mesh depth;
  // startRotationX / Y turn layer-aligned meshes in 3D (startRotation is Z)
  startSize3D: boolean;
  startSizeY: Range;
  startSizeZ: Range;
  startRotation3D: boolean;
  startRotationX: Range; // degrees
  startRotationY: Range;
  startColor: string;
  startColor2: string; // random between the two (same as startColor = no randomness)
  /**
   * Unity's Start Color as a gradient ([] = off: startColor / startColor2 are used). 'time':
   * each particle takes the colour at its birth time in the layer's loop (Unity's Gradient
   * mode); 'random': a random point of the gradient (Unity's Random Color).
   */
  startGradient: ColorStop[];
  startGradientAlpha: Curve;
  startGradientMode: 'time' | 'random';
  gravityModifier: number; // x Physics.gravity (-9.81 on Y)
  maxParticles: number;
  simulationSpace: 'local' | 'world';

  // Emission
  rate: number; // per second
  bursts: Burst[];
  startDelay: number;
  stopAfter: number; // 0 = whole loop
  // Unity's per-system timing (see sim3d/layerTiming.ts)
  loopDuration: number; // the layer's own cycle length (Unity Duration), 0 = the effect's duration
  startOffset: number; // Unity Start Delay: the whole layer starts this much later, once

  // Shape (Unity shape module)
  shape: Shape3D;
  radius: number;
  radiusThickness: number; // 0 = surface only, 1 = whole volume
  angle: number; // cone half angle, degrees
  arc: number; // degrees, circle and cone
  /**
   * Unity's arc Mode (circle, cone, donut): random; loop / pingpong turn (360 x arcSpeed x time)
   * degrees per second around the arc (pingpong back and forth); burstSpread spreads each burst
   * evenly (i / n of the arc, i / (n - 1) for a partial arc).
   */
  arcMode: ArcMode;
  /** Unity Align to Direction: mesh particles start turned to their emission direction. */
  alignToDirection: boolean;
  /** Unity Spherize Direction 0..1: directions bend toward pointing out from the shape's centre. */
  spherizeDirection: number;
  /** Unity Flip Rotation 0..1: share of particles whose rotation (start and spin) is mirrored. */
  flipRotation: number;
  /** Unity Velocity over Lifetime Speed Modifier over the life (x the particle's whole motion); [] = 1. */
  speedModifier: Curve;
  /** Full turns per second for loop / pingpong (may be negative). */
  arcSpeed: number;
  /** 0..1: angles snap to multiples of arcSpread x arc (0 = anywhere). */
  arcSpread: number;
  boxSize: Vec3; // Unity's shape scale: the size of a box / rectangle (x, y); stretches the other shapes
  randomDirection: number; // 0..1, Unity randomDirectionAmount
  coneLength: number; // coneVolume: particles are born anywhere along the cone's first `coneLength` metres
  donutRadius: number; // donut: thickness of the ring (Unity donutRadius); `radius` is the ring's radius

  // Velocity over lifetime
  velocity: Vec3; // world units/s added to motion
  orbital: Vec3; // radians/s around the system's local axes (Unity orbitalX/Y/Z)
  orbitalOffset: Vec3; // centre of orbital and radial motion, in the layer's local axes (Unity Offset)
  radial: number; // units/s away from the emitter centre

  // Force over lifetime (world, units/s^2)
  force: Vec3;

  // Limit velocity over lifetime: constant deceleration, units/s^2
  drag: number;
  // and Unity's speed limit: above `speedLimit` the excess speed is multiplied by
  // (1 - limitDampen) every 1/30 s (measured in 2022.3); limitDampen 0 = no limit
  speedLimit: number;
  limitDampen: number;

  // Noise
  noiseStrength: number;
  noiseFrequency: number;
  noiseScroll: number;
  /** Unity Rate over Distance: particles per metre the emitter moves (an effect that moves in game; the preview stands still). */
  rateOverDistance: number;
  /** Unity Simulation Speed: the layer plays this many times faster. */
  simulationSpeed: number;
  /** Unity Collision Radius Scale: the collision radius is size x 0.5 x this. */
  collisionRadiusScale: number;
  /** Unity Noise Separate Axes: strength per axis as a multiple of noiseStrength (1, 1, 1 = one strength). */
  noiseAxes: Vec3;
  /** Unity Noise Octaves (1-4): each further octave has frequency x noiseOctaveScale and strength x noiseOctaveMultiplier. */
  noiseOctaves: number;
  noiseOctaveMultiplier: number;
  noiseOctaveScale: number;

  // Colour, size, rotation over lifetime
  colors: ColorStop[]; // multiplies startColor (Unity colorOverLifetime), up to 8 stops
  stepped: boolean; // Gradient mode Fixed
  alpha: number;
  fadeIn: number;
  fadeOut: number;
  sizeEnd: number;
  sizeEase: SizeEase;
  spin: Range; // degrees per second
  spinX: Range; // Rotation over Lifetime on X / Y (3D start rotation only), degrees per second
  spinY: Range;

  // Unity-style curves over the particle's life (t = 0..1). An empty curve is off
  // and the simpler fields above apply; a curve replaces them.
  sizeCurve: Curve; // Size over Lifetime: multiplies startSize (replaces sizeEase / sizeEnd)
  sizeCurveY: Curve; // Size over Lifetime per axis (Unity Separate Axes); empty = follow the X factor
  sizeCurveZ: Curve;
  alphaCurve: Curve; // Color over Lifetime alpha keys, x alpha (replaces fadeIn / fadeOut)
  spinCurve: Curve; // Rotation over Lifetime, degrees per second (replaces spin)
  /** Unity Rotation by Speed: extra degrees per second over the particle's speed, 0 at spinBySpeedMin .. 1 at spinBySpeedMax m/s ([] = off). */
  spinBySpeed: Curve;
  spinBySpeedMin: number;
  spinBySpeedMax: number;
  velocityCurveX: Curve; // Velocity over Lifetime, m/s on that world axis (replaces velocity.x)
  velocityCurveY: Curve;
  velocityCurveZ: Curve;
  // over the effect's duration (t = time / duration)
  rateCurve: Curve; // Emission rate over time: multiplies rate

  // Collision (planes): a horizontal floor at world Y
  floor: boolean;
  floorY: number;
  bounce: number;
  dampen: number;
  lifetimeLoss: number; // 0..1 of the start lifetime lost per collision (1 = dies on impact)
  minKillSpeed: number; // particles slower than this after a collision die

  // Renderer
  sprite: SpriteKind;
  renderMode: RenderMode3D;
  lengthScale: number; // stretched billboard
  /** Renderer Pivot in particle sizes (stretched: Y along the streak, in streak lengths). */
  pivot: Vec3;
  /** Renderer Flip: share of particles (0..1) whose texture is mirrored along U (x) and V (y); billboards only. */
  flip: { x: number; y: number };
  /**
   * Unity Renderer "Apply Active Color Space": in a Linear project the particle colours are
   * converted to linear before the shader multiplies them (on). Older prefabs have it off: the
   * shader then gets the sRGB values as they are, which looks brighter and less saturated.
   */
  applyColorSpace: boolean;
  /**
   * Unity Renderer Max / Min Particle Size (billboards only): a billboard is drawn at most / at
   * least this share of the viewport width at its depth (measured in 2022.3). Unity's default is
   * 0.5; FX Forge's 100 means no limit.
   */
  maxParticleSize: number;
  minParticleSize: number;
  /**
   * Unity Renderer Sort Mode: the order a layer's particles are drawn in. none = emission order
   * (youngest drawn last); distance = farthest first; oldestInFront / youngestInFront by age.
   */
  sortMode: SortMode;
  /** A Unity point Light component on the layer's GameObject (empty nodes can carry one too). */
  light: LayerLight;
  velocityScale: number; // stretched billboard
  mesh: MeshRef; // render mode 'mesh': built-in kind or custom mesh id
  meshAlign: MeshAlign;
  material: Material3D;
  sheet: TextureSheet3D; // texture sheet animation (replaces the sprite while enabled)

  // Trails (Unity trails module, Per Particle mode)
  trails: boolean;
  trailRatio: number; // 0..1, share of particles that get a trail
  trailLifetime: number; // 0..1, trail length as a fraction of the particle's lifetime
  trailWidth: number; // head width, multiplier of the particle size
  trailWidthEnd: number; // tail width, multiplier of the head width
  trailColor: string; // multiplies the trail colour
  trailInheritColor: boolean; // trail takes the particle's colour
  /** Unity's trail material: a library texture ('' = FX Forge's soft trail), its blend ('' = the layer's) and intensity (x the layer's). */
  trailTexture: string;
  /** Unity Trails mode: 'particle' (a trail behind each particle) or 'ribbon' (through the particles in emission order). */
  trailMode: 'particle' | 'ribbon';
  trailRibbonCount: number;
  trailBlend: '' | Blend3D;
  trailIntensity: number;
  /** Unity Color over Trail: colour along the trail, head (0) to tail (1); [] = white. */
  trailAlongColors: ColorStop[];
  /** Alpha along the trail, head to tail; [] = fading 1 -> 0 (FX Forge's classic trail). */
  trailAlongAlpha: Curve;
  /** Unity Width over Trail as a curve (x trailWidth); [] = trailWidth to trailWidth x trailWidthEnd. */
  trailWidthCurve: Curve;
  /** Unity trail Color over Lifetime's alpha over the particle's life; [] = 1. */
  trailLifeAlpha: Curve;
  /** Unity Size affects Width: the width is x the particle size (off: trailWidth is in metres). */
  trailSizeAffectsWidth: boolean;
  /** Unity Die with Particles: off, a trail stays after its particle dies and shrinks away over its lifetime. */
  trailDieWithParticles: boolean;
  /** Unity Minimum Vertex Distance (m) between trail points. */
  trailMinVertexDistance: number;

  // Sub emitter: this layer is emitted by another layer's particles
  subEmitterOf: string; // parent layer id, '' = normal layer
  subEvent: SubEvent;
  inheritColor: boolean;
  inheritSize: boolean;
  inheritVelocity: number; // Unity inherit velocity module (Initial), multiplier
}

export type SubEvent = 'birth' | 'death' | 'collision';

export interface Effect3D {
  version: 1;
  space: '3d';
  name: string;
  duration: number;
  fps: number;
  loop: LoopMode;
  background: string;
  seed: number;
  fixedSeed: boolean; // Unity: same random seed every play (otherwise a new one each time)
  showCharacter: boolean;
  bloom: Bloom3D;
  layers: Emitter3D[];
}

/** Layers per 3D effect, empty nodes included. */
export const MAX_LAYERS_3D = 32;

export const v3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });

export function defaultEmitter3D(over: Partial<Emitter3D> = {}): Emitter3D {
  const e = emitterDefaults(over);
  // without their own values the Y / Z sizes equal the X size (as in sanitizeEmitter3D)
  if (!over.startSizeY) e.startSizeY = { ...e.startSize };
  if (!over.startSizeZ) e.startSizeZ = { ...e.startSize };
  return e;
}

function emitterDefaults(over: Partial<Emitter3D>): Emitter3D {
  return {
    id: newId(),
    name: 'Particle System',
    visible: true,
    rendered: true,
    blend: 'add',
    empty: false,
    parentId: '',
    position: v3(0, 0, 0),
    rotation: v3(-90, 0, 0), // emits upward, like a new Unity particle system rotated to face up
    startLifetime: { min: 1, max: 1.5 },
    startSpeed: { min: 1.5, max: 2.5 },
    startSize: { min: 0.2, max: 0.35 },
    startRotation: { min: 0, max: 360 },
    startSize3D: false,
    startSizeY: { min: 0.2, max: 0.35 },
    startSizeZ: { min: 0.2, max: 0.35 },
    startRotation3D: false,
    startRotationX: { min: 0, max: 0 },
    startRotationY: { min: 0, max: 0 },
    startColor: '#ffffff',
    startColor2: '#ffffff',
    startGradient: [],
    startGradientAlpha: [],
    startGradientMode: 'time',
    gravityModifier: 0,
    maxParticles: 1000,
    simulationSpace: 'local',
    rate: 30,
    bursts: [],
    startDelay: 0,
    stopAfter: 0,
    loopDuration: 0,
    startOffset: 0,
    shape: 'cone',
    radius: 0.2,
    radiusThickness: 1,
    angle: 20,
    arc: 360,
    arcMode: 'random',
    alignToDirection: false,
    spherizeDirection: 0,
    flipRotation: 0,
    speedModifier: [],
    arcSpeed: 1,
    arcSpread: 0,
    boxSize: v3(1, 1, 1),
    randomDirection: 0,
    coneLength: 5,
    donutRadius: 0.2,
    velocity: v3(),
    orbital: v3(),
    orbitalOffset: v3(),
    radial: 0,
    force: v3(),
    drag: 0,
    speedLimit: 1,
    limitDampen: 0,
    noiseStrength: 0,
    noiseFrequency: 0.8,
    noiseScroll: 0,
    rateOverDistance: 0,
    simulationSpeed: 1,
    collisionRadiusScale: 0.05,
    noiseAxes: { x: 1, y: 1, z: 1 },
    noiseOctaves: 1,
    noiseOctaveMultiplier: 0.5,
    noiseOctaveScale: 2,
    colors: [
      { t: 0, color: '#fff4c2' },
      { t: 0.4, color: '#ff9a2e' },
      { t: 1, color: '#8a1d10' },
    ],
    stepped: false,
    alpha: 1,
    fadeIn: 0.05,
    fadeOut: 0.4,
    sizeEnd: 0.3,
    sizeEase: 'linear',
    spin: { min: 0, max: 0 },
    spinX: { min: 0, max: 0 },
    spinY: { min: 0, max: 0 },
    sizeCurve: [],
    sizeCurveY: [],
    sizeCurveZ: [],
    alphaCurve: [],
    spinCurve: [],
    spinBySpeed: [],
    spinBySpeedMin: 0,
    spinBySpeedMax: 1,
    velocityCurveX: [],
    velocityCurveY: [],
    velocityCurveZ: [],
    rateCurve: [],
    floor: false,
    floorY: 0,
    bounce: 0.4,
    dampen: 0.2,
    lifetimeLoss: 0,
    minKillSpeed: 0,
    sprite: 'soft',
    renderMode: 'billboard',
    lengthScale: 2,
    pivot: v3(),
    flip: { x: 0, y: 0 },
    applyColorSpace: true,
    maxParticleSize: 100,
    minParticleSize: 0,
    sortMode: 'none',
    light: { enabled: false, color: '#ffffff', intensity: 1, range: 10 },
    velocityScale: 0.1,
    mesh: 'shard',
    meshAlign: 'random',
    material: defaultMaterial3D(),
    sheet: defaultSheet3D(),
    trails: false,
    trailRatio: 1,
    trailLifetime: 0.3,
    trailWidth: 1,
    trailWidthEnd: 0,
    trailColor: '#ffffff',
    trailInheritColor: true,
    trailTexture: '',
    trailMode: 'particle',
    trailRibbonCount: 1,
    trailBlend: '',
    trailIntensity: 1,
    trailAlongColors: [],
    trailAlongAlpha: [],
    trailWidthCurve: [],
    trailLifeAlpha: [],
    trailSizeAffectsWidth: true,
    trailDieWithParticles: true,
    trailMinVertexDistance: 0.02,
    subEmitterOf: '',
    subEvent: 'death',
    inheritColor: false,
    inheritSize: false,
    inheritVelocity: 0,
    ...over,
  };
}

export function defaultEffect3D(over: Partial<Effect3D> = {}): Effect3D {
  return {
    version: 1,
    space: '3d',
    name: 'Untitled 3D effect',
    duration: 2,
    fps: 30,
    loop: 'perfect',
    background: '#1b1a24',
    seed: 1,
    fixedSeed: false,
    showCharacter: true,
    bloom: defaultBloom3D(),
    layers: [defaultEmitter3D({ name: 'Particles' })],
    ...over,
  };
}

// ---------------------------------------------------------------------------

const num = (v: unknown, d: number, lo = -Infinity, hi = Infinity): number => {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : d;
  return Math.min(hi, Math.max(lo, n));
};
const pick = <T extends string>(v: unknown, opts: readonly T[], d: T): T =>
  typeof v === 'string' && (opts as readonly string[]).includes(v) ? (v as T) : d;
const bool = (v: unknown, d: boolean): boolean => (typeof v === 'boolean' ? v : d);
const range = (v: unknown, d: Range, lo: number, hi: number): Range => {
  const r = (v ?? {}) as Partial<Range>;
  let a = num(r.min, d.min, lo, hi);
  let b = num(r.max, d.max, lo, hi);
  if (a > b) [a, b] = [b, a];
  return { min: a, max: b };
};
const vec = (v: unknown, d: Vec3, lo: number, hi: number): Vec3 => {
  const r = (v ?? {}) as Partial<Vec3>;
  return { x: num(r.x, d.x, lo, hi), y: num(r.y, d.y, lo, hi), z: num(r.z, d.z, lo, hi) };
};

export function sanitizeEmitter3D(raw: unknown): Emitter3D {
  const d = defaultEmitter3D();
  const r = (raw ?? {}) as Record<string, unknown>;
  let colors = (Array.isArray(r.colors) ? r.colors : d.colors)
    .map((c: any) => ({ t: num(c?.t, 0, 0, 1), color: safeColor(c?.color, '#ffffff') }))
    .sort((a, b) => a.t - b.t)
    .slice(0, 8); // Unity gradients hold at most 8 colour keys
  if (!colors.length) colors = d.colors;
  const bursts = (Array.isArray(r.bursts) ? r.bursts : [])
    .map((b: any) => ({
      time: num(b?.time, 0, 0, 60),
      count: Math.round(num(b?.count, 10, 0, 10000)),
      cycles: Math.round(num(b?.cycles, 1, 1, 100)),
      interval: num(b?.interval, 0.1, 0.01, 60),
      probability: num(b?.probability, 1, 0, 1),
    }))
    .slice(0, 8);
  return {
    id: typeof r.id === 'string' && r.id ? r.id : newId(),
    name: typeof r.name === 'string' && r.name ? r.name.slice(0, 60) : d.name,
    visible: bool(r.visible, true),
    rendered: bool(r.rendered, true),
    blend: pick(r.blend, BLENDS_3D, 'add'),
    empty: bool(r.empty, false),
    parentId: typeof r.parentId === 'string' ? r.parentId : '',
    position: vec(r.position, d.position, -1000, 1000),
    rotation: vec(r.rotation, d.rotation, -720, 720),
    startLifetime: range(r.startLifetime, d.startLifetime, 0.02, 60),
    startSpeed: range(r.startSpeed, d.startSpeed, -500, 500),
    startSize: range(r.startSize, d.startSize, 0.001, 200),
    startRotation: range(r.startRotation, d.startRotation, -720, 720),
    startSize3D: bool(r.startSize3D, false),
    // without their own values the Y / Z sizes equal the X size (what Unity shows when 3D size is turned on)
    startSizeY: range(r.startSizeY, range(r.startSize, d.startSize, 0.001, 200), 0, 200),
    startSizeZ: range(r.startSizeZ, range(r.startSize, d.startSize, 0.001, 200), 0, 200),
    startRotation3D: bool(r.startRotation3D, false),
    startRotationX: range(r.startRotationX, d.startRotationX, -720, 720),
    startRotationY: range(r.startRotationY, d.startRotationY, -720, 720),
    startColor: safeColor(r.startColor, '#ffffff'),
    startColor2: safeColor(r.startColor2, safeColor(r.startColor, '#ffffff')),
    startGradient: (Array.isArray(r.startGradient) ? r.startGradient : [])
      .map((c: any) => ({ t: num(c?.t, 0, 0, 1), color: safeColor(c?.color, '#ffffff') }))
      .sort((a: ColorStop, b: ColorStop) => a.t - b.t)
      .slice(0, 8),
    startGradientAlpha: sanitizeCurve(r.startGradientAlpha, 0, 1),
    startGradientMode: r.startGradientMode === 'random' ? 'random' : 'time',
    gravityModifier: num(r.gravityModifier, 0, -20, 20),
    maxParticles: Math.round(num(r.maxParticles, 1000, 1, 50000)),
    simulationSpace: pick(r.simulationSpace, ['local', 'world'] as const, 'local'),
    rate: num(r.rate, d.rate, 0, 5000),
    bursts,
    startDelay: num(r.startDelay, 0, 0, 60),
    stopAfter: num(r.stopAfter, 0, 0, 60),
    loopDuration: num(r.loopDuration, 0, 0, 60),
    startOffset: num(r.startOffset, 0, 0, 60),
    shape: pick(r.shape, SHAPES_3D, d.shape),
    radius: num(r.radius, d.radius, 0, 500),
    radiusThickness: num(r.radiusThickness, 1, 0, 1),
    angle: num(r.angle, d.angle, 0, 90),
    arc: num(r.arc, 360, 0, 360),
    arcMode: pick(r.arcMode, ARC_MODES, 'random'),
    alignToDirection: bool(r.alignToDirection, false),
    spherizeDirection: num(r.spherizeDirection, 0, 0, 1),
    flipRotation: num(r.flipRotation, 0, 0, 1),
    speedModifier: sanitizeCurve(r.speedModifier, -10, 10),
    arcSpeed: num(r.arcSpeed, 1, -100, 100),
    arcSpread: num(r.arcSpread, 0, 0, 1),
    boxSize: vec(r.boxSize, d.boxSize, 0, 1000),
    randomDirection: num(r.randomDirection, 0, 0, 1),
    coneLength: num(r.coneLength, d.coneLength, 0, 500),
    donutRadius: num(r.donutRadius, d.donutRadius, 0, 500),
    velocity: vec(r.velocity, d.velocity, -500, 500),
    orbital: vec(r.orbital, d.orbital, -100, 100),
    orbitalOffset: vec(r.orbitalOffset, d.orbitalOffset, -1000, 1000),
    radial: num(r.radial, 0, -500, 500),
    force: vec(r.force, d.force, -1000, 1000),
    drag: num(r.drag, 0, 0, 50),
    speedLimit: num(r.speedLimit, d.speedLimit, 0, 1000),
    limitDampen: num(r.limitDampen, 0, 0, 1),
    noiseStrength: num(r.noiseStrength, 0, 0, 100),
    noiseFrequency: num(r.noiseFrequency, 0.8, 0.01, 20),
    noiseScroll: num(r.noiseScroll, 0, 0, 20),
    rateOverDistance: num(r.rateOverDistance, 0, 0, 10000),
    simulationSpeed: num(r.simulationSpeed, 1, 0.01, 100),
    collisionRadiusScale: num(r.collisionRadiusScale, 0.05, 0, 10),
    noiseAxes: vec(r.noiseAxes, { x: 1, y: 1, z: 1 }, 0, 100),
    noiseOctaves: Math.round(num(r.noiseOctaves, 1, 1, 4)),
    noiseOctaveMultiplier: num(r.noiseOctaveMultiplier, 0.5, 0, 1),
    noiseOctaveScale: num(r.noiseOctaveScale, 2, 1, 4),
    colors,
    stepped: bool(r.stepped, false),
    alpha: num(r.alpha, 1, 0, 1),
    fadeIn: num(r.fadeIn, 0, 0, 1),
    fadeOut: num(r.fadeOut, 0.3, 0, 1),
    sizeEnd: num(r.sizeEnd, d.sizeEnd, 0, 20),
    sizeEase: pick(r.sizeEase, ['linear', 'easeOut', 'easeIn', 'pop'] as const, 'linear'),
    spin: range(r.spin, d.spin, -3600, 3600),
    spinX: range(r.spinX, d.spinX, -3600, 3600),
    spinY: range(r.spinY, d.spinY, -3600, 3600),
    sizeCurve: sanitizeCurve(r.sizeCurve, 0, 100),
    sizeCurveY: sanitizeCurve(r.sizeCurveY, 0, 100),
    sizeCurveZ: sanitizeCurve(r.sizeCurveZ, 0, 100),
    alphaCurve: sanitizeCurve(r.alphaCurve, 0, 1),
    spinCurve: sanitizeCurve(r.spinCurve, -3600, 3600),
    spinBySpeed: sanitizeCurve(r.spinBySpeed, -3600, 3600),
    spinBySpeedMin: num(r.spinBySpeedMin, 0, 0, 1000),
    spinBySpeedMax: num(r.spinBySpeedMax, 1, 0, 1000),
    velocityCurveX: sanitizeCurve(r.velocityCurveX, -500, 500),
    velocityCurveY: sanitizeCurve(r.velocityCurveY, -500, 500),
    velocityCurveZ: sanitizeCurve(r.velocityCurveZ, -500, 500),
    rateCurve: sanitizeCurve(r.rateCurve, 0, 100),
    floor: bool(r.floor, false),
    floorY: num(r.floorY, 0, -1000, 1000),
    bounce: num(r.bounce, 0.4, 0, 2),
    dampen: num(r.dampen, 0.2, 0, 1),
    lifetimeLoss: num(r.lifetimeLoss, 0, 0, 1),
    minKillSpeed: num(r.minKillSpeed, 0, 0, 1000),
    sprite: pick(r.sprite, ['soft', 'circle', 'square', 'spark', 'star', 'ring', 'smoke', 'shard'] as const, 'soft'),
    renderMode: pick(r.renderMode, ['billboard', 'stretched', 'horizontal', 'vertical', 'mesh', 'none'] as const, 'billboard'),
    lengthScale: num(r.lengthScale, 2, 0, 500),
    pivot: vec(r.pivot, d.pivot, -100, 100),
    flip: { x: num((r.flip as any)?.x, 0, 0, 1), y: num((r.flip as any)?.y, 0, 0, 1) },
    applyColorSpace: bool(r.applyColorSpace, true),
    maxParticleSize: num(r.maxParticleSize, 100, 0, 100),
    minParticleSize: num(r.minParticleSize, 0, 0, 100),
    sortMode: pick(r.sortMode, SORT_MODES, 'none'),
    light: {
      enabled: bool((r.light as any)?.enabled, false),
      color: safeColor((r.light as any)?.color, '#ffffff'),
      intensity: num((r.light as any)?.intensity, 1, 0, 100),
      range: num((r.light as any)?.range, 10, 0, 1000),
    },
    velocityScale: num(r.velocityScale, 0.1, 0, 10),
    mesh: sanitizeMeshKind(r.mesh),
    meshAlign: sanitizeMeshAlign(r.meshAlign),
    material: sanitizeMaterial3D(r.material),
    sheet: sanitizeSheet3D(r.sheet),
    trails: bool(r.trails, false),
    trailRatio: num(r.trailRatio, 1, 0, 1),
    trailLifetime: num(r.trailLifetime, 0.3, 0.01, 1),
    trailWidth: num(r.trailWidth, 1, 0, 20),
    trailWidthEnd: num(r.trailWidthEnd, 0, 0, 5),
    trailColor: safeColor(r.trailColor, '#ffffff'),
    trailInheritColor: bool(r.trailInheritColor, true),
    trailMode: r.trailMode === 'ribbon' ? 'ribbon' : 'particle',
    trailRibbonCount: Math.round(num(r.trailRibbonCount, 1, 1, 64)),
    trailTexture: typeof r.trailTexture === 'string' ? r.trailTexture.slice(0, 64) : '',
    trailBlend: (['add', 'normal', 'premultiply', 'softAdd'] as const).find((b) => b === r.trailBlend) ?? '',
    trailIntensity: num(r.trailIntensity, 1, 0, 64),
    trailAlongColors: (Array.isArray(r.trailAlongColors) ? r.trailAlongColors : [])
      .map((c: any) => ({ t: num(c?.t, 0, 0, 1), color: safeColor(c?.color, '#ffffff') }))
      .sort((a: ColorStop, b: ColorStop) => a.t - b.t)
      .slice(0, 8),
    trailAlongAlpha: sanitizeCurve(r.trailAlongAlpha, 0, 1),
    trailWidthCurve: sanitizeCurve(r.trailWidthCurve, 0, 20),
    trailLifeAlpha: sanitizeCurve(r.trailLifeAlpha, 0, 1),
    trailSizeAffectsWidth: bool(r.trailSizeAffectsWidth, true),
    trailDieWithParticles: bool(r.trailDieWithParticles, true),
    trailMinVertexDistance: num(r.trailMinVertexDistance, 0.02, 0, 10),
    subEmitterOf: typeof r.subEmitterOf === 'string' ? r.subEmitterOf : '',
    subEvent: pick(r.subEvent, ['birth', 'death', 'collision'] as const, 'death'),
    inheritColor: bool(r.inheritColor, false),
    inheritSize: bool(r.inheritSize, false),
    inheritVelocity: num(r.inheritVelocity, 0, -5, 5),
  };
}

export function sanitizeEffect3D(raw: unknown): Effect3D {
  const d = defaultEffect3D();
  const r = (raw ?? {}) as Record<string, unknown>;
  const layers = (Array.isArray(r.layers) ? r.layers.slice(0, MAX_LAYERS_3D) : d.layers).map(sanitizeEmitter3D);
  const seen = new Set<string>();
  for (const l of layers) {
    if (seen.has(l.id)) l.id = newId();
    seen.add(l.id);
  }
  // sub-emitter and parent links must point at valid layers, without cycles
  repairLinks(layers);
  return {
    version: 1,
    space: '3d',
    name: typeof r.name === 'string' && r.name ? r.name.slice(0, 80) : d.name,
    duration: num(r.duration, d.duration, 0.1, 60),
    fps: Math.round(num(r.fps, 30, 1, 60)),
    loop: pick(r.loop, ['perfect', 'loop', 'once'] as const, 'perfect'),
    background: safeColor(r.background, d.background),
    seed: Math.round(num(r.seed, 1, 0, 1e9)),
    fixedSeed: bool(r.fixedSeed, false),
    showCharacter: bool(r.showCharacter, true),
    bloom: sanitizeBloom3D(r.bloom),
    layers,
  };
}
