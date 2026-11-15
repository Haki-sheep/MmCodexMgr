// Bloom settings of a 3D effect. The preview applies them; in Unity they are
// a recommendation for the scene's post-processing (see the export README).

import { bool, num, obj } from './sanitize';

export interface Bloom3D {
  enabled: boolean;
  intensity: number;
  /** Only colours brighter than this glow (1 = only HDR colours, like Unity's default). */
  threshold: number;
  radius: number; // 0..1
}

export const defaultBloom3D = (): Bloom3D => ({ enabled: false, intensity: 1, threshold: 1, radius: 0.5 });

export function sanitizeBloom3D(raw: unknown): Bloom3D {
  const d = defaultBloom3D();
  const r = obj(raw);
  return {
    enabled: bool(r.enabled, false),
    intensity: num(r.intensity, d.intensity, 0, 10),
    threshold: num(r.threshold, d.threshold, 0, 10),
    radius: num(r.radius, d.radius, 0, 1),
  };
}
