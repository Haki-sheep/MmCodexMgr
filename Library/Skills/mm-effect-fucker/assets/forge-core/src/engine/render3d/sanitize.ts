// Small sanitising helpers shared by the 3D render settings.

import { color as safeColor } from '../types';

export const num = (v: unknown, d: number, lo = -Infinity, hi = Infinity): number => {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : d;
  return Math.min(hi, Math.max(lo, n));
};
export const pick = <T extends string>(v: unknown, opts: readonly T[], d: T): T =>
  typeof v === 'string' && (opts as readonly string[]).includes(v) ? (v as T) : d;
export const bool = (v: unknown, d: boolean): boolean => (typeof v === 'boolean' ? v : d);
export const hex = (v: unknown, d: string): string => safeColor(v, d);
export const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});
