// Flipbook generators: the built-in smoke, fire, electric and energy
// flipbooks with a choice of grid size and random seed.

import { flipbook } from '../flipbooks';
import type { FlipbookKind } from '../../render3d/sheet';
import { seedParam, type GeneratorDef } from './types';

const HINTS: Record<FlipbookKind, string> = {
  smoke: 'Billowing smoke puff that grows and thins out over the sheet.',
  fire: 'Flame tongue flickering upward, loops over the sheet.',
  electric: 'Crackling electric arcs, a new arc every frame (lightning, shock, sparks).',
  energy: 'Pulsing energy ring with a bright core (orbs, portals, charge-ups).',
};
const LABELS: Record<FlipbookKind, string> = { smoke: '烟（序列帧）', fire: '火（序列帧）', electric: '电弧（序列帧）', energy: '能量环（序列帧）' };

function flipGen(kind: FlipbookKind): GeneratorDef {
  return {
    id: `flipbook_${kind}`,
    label: LABELS[kind],
    kind: 'flipbook',
    hint: `${HINTS[kind]} Use with sheet.enabled and sheet.asset.`,
    params: [
      { key: 'tiles', label: '网格（N×N）', min: 2, max: 8, step: 1, default: 4, hint: '帧数 = N×N，帧越多动作越顺' },
      { key: 'frameSize', label: '每帧像素', min: 32, max: 128, step: 32, default: 64 },
      seedParam(0),
    ],
    draw: (p) => flipbook(kind, Math.round(p.tiles), Math.round(p.seed), Math.round(p.frameSize)),
    grid: (p) => [Math.round(p.tiles), Math.round(p.tiles)],
  };
}

export const FLIPBOOK_GENERATORS = (['smoke', 'fire', 'electric', 'energy'] as const).map(flipGen);
