// Size-over-lifetime easing.

import type { Emitter3D } from '../types3d';

export function easeSize(e: Emitter3D['sizeEase'], f: number, end: number): number {
  switch (e) {
    case 'easeOut':
      return 1 + (end - 1) * (1 - (1 - f) * (1 - f));
    case 'easeIn':
      return 1 + (end - 1) * f * f;
    case 'pop':
      if (f < 0.12) return (f / 0.12) * 1.18;
      if (f < 0.25) return 1.18 - ((f - 0.12) / 0.13) * 0.18;
      if (f < 0.7) return 1;
      return 1 + (end - 1) * ((f - 0.7) / 0.3);
    default:
      return 1 + (end - 1) * f;
  }
}
