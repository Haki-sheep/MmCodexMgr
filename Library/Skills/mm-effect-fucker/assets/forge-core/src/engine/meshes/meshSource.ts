// How a custom mesh is described: a small generator recipe (lathe, extrude,
// sweep) or raw triangles. The recipe is what gets saved and embedded in
// files; the triangles are rebuilt from it (build/index.ts). Everything here
// is in Unity coordinates (left-handed, Y up, +Z forward), metres.

import { bool, num, obj, pick } from '../render3d/sanitize';

export type V3 = [number, number, number];

/** Applied after building, in this order: scale, rotate (Unity Euler Z, X, Y), offset. */
export interface MeshTransform {
  scale?: V3;
  rotate?: V3;
  offset?: V3;
  /** Flat shading: every triangle gets its own face normal (cut-gem look). */
  flat?: boolean;
}

/** Surface of revolution. Profile rows are [height, radius] or [height, radius, offsetA, offsetB] (bends the axis). */
export interface LatheSource extends MeshTransform {
  type: 'lathe';
  profile: number[][];
  /** Axis the profile runs along: "y" stands up with no layer rotation, "z" matches the built-in meshes (+Z forward). */
  axis: 'y' | 'z';
  segments: number;
  /** Degrees the surface (and its UVs) turn from the first profile row to the last: spiral texture flow. */
  twist: number;
  uRepeat: number;
  vRepeat: number;
}

/** A 2D outline in the XY plane (faces -Z like the quad), flat or with thickness along Z. */
export interface ExtrudeSource extends MeshTransform {
  type: 'extrude';
  outline: [number, number][];
  depth: number;
}

/** A ribbon (sides 0) or tube (sides >= 3) along a path. U runs along the path, V across. */
export interface SweepSource extends MeshTransform {
  type: 'sweep';
  path: V3[];
  /** Ribbon width or tube diameter: one value, or one per path point (tapers). */
  width: number[];
  sides: number;
  /** Reference direction for the ribbon's orientation. */
  up: V3;
  /** Ribbon width direction: "side" = across the path, perpendicular to up (flat slash arcs); "up" = along up (bands, walls). */
  widthAxis: 'side' | 'up';
  twist: number;
  /** Catmull-Rom smoothing between path points. */
  smooth: boolean;
  uRepeat: number;
  vRepeat: number;
}

/** Triangles written out directly (or imported from OBJ). Missing UVs: planar XY; missing normals: smooth. */
export interface RawSource extends MeshTransform {
  type: 'raw';
  positions: number[];
  indices: number[];
  uvs?: number[];
  normals?: number[];
  /** Where it came from, e.g. "obj:funnel.obj". */
  from?: string;
}

export type MeshSource = LatheSource | ExtrudeSource | SweepSource | RawSource;
export const MESH_SOURCE_TYPES = ['lathe', 'extrude', 'sweep', 'raw'] as const;

export const MAX_MESH_VERTICES = 65535;

const n = (v: unknown, d: number, lo: number, hi: number) => num(v, d, lo, hi);
const fail = (msg: string): never => {
  throw new Error(msg);
};

function vec3(v: unknown, d: V3, lo = -1000, hi = 1000): V3 {
  if (typeof v === 'number') return [n(v, d[0], lo, hi), n(v, d[1], lo, hi), n(v, d[2], lo, hi)];
  const a = Array.isArray(v) ? v : [];
  return [n(a[0], d[0], lo, hi), n(a[1], d[1], lo, hi), n(a[2], d[2], lo, hi)];
}

function points(v: unknown, dims: number, max: number, what: string, minDims = dims): number[][] {
  if (!Array.isArray(v)) return fail(`${what} must be an array of [${dims === 2 ? 'x, y' : dims === 3 ? 'x, y, z' : '...'}] points`);
  if (v.length > max) fail(`${what} has ${v.length} points (max ${max})`);
  return v.map((p, i) => {
    if (!Array.isArray(p) || p.length < minDims) fail(`${what}[${i}] must have at least ${minDims} numbers`);
    return (p as unknown[]).slice(0, dims).map((x) => {
      if (typeof x !== 'number' || !Number.isFinite(x)) fail(`${what}[${i}] has a value that is not a number`);
      return Math.max(-1000, Math.min(1000, x as number));
    });
  });
}

function numbers(v: unknown, max: number, what: string): number[] {
  if (!Array.isArray(v)) return fail(`${what} must be an array of numbers`);
  if (v.length > max) fail(`${what} is too long (${v.length}, max ${max})`);
  return v.map((x, i) => (typeof x === 'number' && Number.isFinite(x) ? x : fail(`${what}[${i}] is not a number`)));
}

function transform(r: Record<string, unknown>): MeshTransform {
  const t: MeshTransform = {};
  if (r.scale !== undefined) t.scale = vec3(r.scale, [1, 1, 1], -100, 100);
  if (r.rotate !== undefined) t.rotate = vec3(r.rotate, [0, 0, 0], -3600, 3600);
  if (r.offset !== undefined) t.offset = vec3(r.offset, [0, 0, 0], -100, 100);
  if (r.flat === true) t.flat = true;
  return t;
}

/** Clamps a recipe to sane values. Throws an Error with a readable message when it cannot be used. */
export function sanitizeMeshSource(raw: unknown): MeshSource {
  const r = obj(raw);
  const type = pick(r.type, MESH_SOURCE_TYPES, 'raw');
  if (r.type !== type) fail(`source.type must be one of ${MESH_SOURCE_TYPES.join(', ')}`);
  const t = transform(r);
  switch (type) {
    case 'lathe': {
      const profile = points(r.profile, 4, 256, 'profile', 2).map(([h, rad, a = 0, b = 0]) => [h, Math.max(0, rad), a, b]);
      if (profile.length < 2) fail('profile needs at least 2 rows');
      return {
        type, profile, ...t,
        axis: pick(r.axis, ['y', 'z'] as const, 'y'),
        segments: Math.round(n(r.segments, 32, 3, 128)),
        twist: n(r.twist, 0, -7200, 7200),
        uRepeat: n(r.uRepeat, 1, 0.01, 100),
        vRepeat: n(r.vRepeat, 1, 0.01, 100),
      };
    }
    case 'extrude': {
      const outline = points(r.outline, 2, 512, 'outline') as [number, number][];
      if (outline.length < 3) fail('outline needs at least 3 points');
      return { type, outline, depth: n(r.depth, 0, 0, 100), ...t };
    }
    case 'sweep': {
      const path = points(r.path, 3, 512, 'path') as V3[];
      if (path.length < 2) fail('path needs at least 2 points');
      const width = typeof r.width === 'number' ? [r.width] : r.width === undefined ? [0.2] : numbers(r.width, 512, 'width');
      if (!width.length) fail('width needs at least one value');
      return {
        type, path, ...t,
        width: width.map((w) => Math.max(0, Math.min(100, w))),
        sides: (() => {
          const s = Math.round(n(r.sides, 0, 0, 64));
          return s > 0 && s < 3 ? 3 : s;
        })(),
        up: vec3(r.up, [0, 1, 0]),
        widthAxis: pick(r.widthAxis, ['side', 'up'] as const, 'side'),
        twist: n(r.twist, 0, -7200, 7200),
        smooth: bool(r.smooth, true),
        uRepeat: n(r.uRepeat, 1, 0.01, 100),
        vRepeat: n(r.vRepeat, 1, 0.01, 100),
      };
    }
    default: {
      const positions = numbers(r.positions, MAX_MESH_VERTICES * 3, 'positions');
      if (positions.length < 9 || positions.length % 3) fail('positions must hold x, y, z per vertex (at least 3 vertices)');
      const count = positions.length / 3;
      const indices = numbers(r.indices, 600000, 'indices').map((i) => Math.round(i));
      if (indices.length < 3 || indices.length % 3) fail('indices must hold 3 vertex indices per triangle');
      if (indices.some((i) => i < 0 || i >= count)) fail(`indices must be between 0 and ${count - 1}`);
      const out: RawSource = { type, positions, indices, ...t };
      if (r.uvs !== undefined) {
        const uvs = numbers(r.uvs, MAX_MESH_VERTICES * 2, 'uvs');
        if (uvs.length !== count * 2) fail(`uvs must hold u, v per vertex (${count * 2} numbers)`);
        out.uvs = uvs;
      }
      if (r.normals !== undefined) {
        const normals = numbers(r.normals, MAX_MESH_VERTICES * 3, 'normals');
        if (normals.length !== count * 3) fail(`normals must hold x, y, z per vertex (${count * 3} numbers)`);
        out.normals = normals;
      }
      if (typeof r.from === 'string') out.from = r.from.slice(0, 120);
      return out;
    }
  }
}
