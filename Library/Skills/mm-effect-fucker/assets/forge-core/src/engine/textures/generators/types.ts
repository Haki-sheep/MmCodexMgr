// A procedural texture generator: numeric parameters in, a canvas out.
// Output is white with alpha so the particle colour tints it.

import type { AssetKind } from '../../../assets/types';

export interface ParamSpec {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  hint?: string;
}

export interface GeneratorDef {
  id: string;
  label: string;
  kind: AssetKind;
  /** One line for the UI and the agent: what it looks like and what it is for. */
  hint: string;
  params: ParamSpec[];
  draw(p: Record<string, number>): HTMLCanvasElement;
  /** Flipbook grid for these parameters (columns, rows). */
  grid?(p: Record<string, number>): [number, number];
}

export const SIZE = 256;

export const seedParam = (d = 1): ParamSpec => ({ key: 'seed', label: '随机种子', min: 0, max: 9999, step: 1, default: d });
