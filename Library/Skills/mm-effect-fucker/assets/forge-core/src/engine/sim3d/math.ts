// Random numbers and Unity-style rotation matrices.

import type { Vec3 } from '../types3d';

export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0 || 1;
  }
  next(): number {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

// ---------------------------------------------------------------------------
// Rotation: Unity's Quaternion.Euler(x, y, z) rotates about Z, then X, then Y.

export type Mat3 = [number, number, number, number, number, number, number, number, number];

export function eulerToMat3(e: Vec3): Mat3 {
  const d = Math.PI / 180;
  const cx = Math.cos(e.x * d), sx = Math.sin(e.x * d);
  const cy = Math.cos(e.y * d), sy = Math.sin(e.y * d);
  const cz = Math.cos(e.z * d), sz = Math.sin(e.z * d);
  const rz: Mat3 = [cz, -sz, 0, sz, cz, 0, 0, 0, 1];
  const rx: Mat3 = [1, 0, 0, 0, cx, -sx, 0, sx, cx];
  const ry: Mat3 = [cy, 0, sy, 0, 1, 0, -sy, 0, cy];
  return mul(ry, mul(rx, rz));
}

export function mul(a: Mat3, b: Mat3): Mat3 {
  const r = new Array(9).fill(0) as Mat3;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  return r;
}

export const apply = (m: Mat3, x: number, y: number, z: number): [number, number, number] => [
  m[0] * x + m[1] * y + m[2] * z,
  m[3] * x + m[4] * y + m[5] * z,
  m[6] * x + m[7] * y + m[8] * z,
];

// ---------------------------------------------------------------------------

/** Inverse of eulerToMat3: Unity euler angles (degrees) of a rotation matrix. */
export function mat3ToEuler(m: Mat3): Vec3 {
  const d = 180 / Math.PI;
  const cx = Math.hypot(m[3], m[4]);
  const x = Math.atan2(-m[5], cx);
  if (cx > 1e-6) return { x: x * d, y: Math.atan2(m[2], m[8]) * d, z: Math.atan2(m[3], m[4]) * d };
  // gimbal lock: put all of the yaw into y
  return { x: x * d, y: Math.atan2(-m[6], m[0]) * d, z: 0 };
}

export const transpose = (m: Mat3): Mat3 => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
