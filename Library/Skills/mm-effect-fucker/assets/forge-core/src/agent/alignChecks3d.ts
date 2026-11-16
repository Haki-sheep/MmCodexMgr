// analyze_effect, 3D placement checks: is the effect anchored where Unity
// will put it (the prefab root = the origin), does it face +Z, and do layers
// that belong to one spot really share it (near misses read as crooked).

import { simulateFrame3D, STRIDE3 } from '../engine/simulate3d';
import { worldPose } from '../engine/hierarchy3d';
import type { Effect3D, Emitter3D } from '../engine/types3d';

const SAMPLES = 48;
/** Centres closer than this are the same spot; farther than NEAR_MAX they are meant to be apart. */
const SAME = 0.08;
const NEAR_MAX = 0.6;

const fmt = (x: number, z: number) => `(${x.toFixed(2)}, ${z.toFixed(2)})`;
const dist = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);

/** Particles this close to the ground mark where an effect lands or stands. */
const GROUND_Y = 0.5;

/**
 * Horizontal centroid over the effect, weighted by particle count. When a fair
 * share of the particles is on the ground, only those count: a meteor's trail
 * in the air should not pull the anchor of where it lands.
 */
function centroid(frames: ReturnType<typeof simulateFrame3D>[]) {
  const all = { x: 0, z: 0, n: 0 };
  const low = { x: 0, z: 0, n: 0 };
  for (const fr of frames)
    for (const f of fr)
      for (let k = 0; k < f.count; k++) {
        const o = k * STRIDE3;
        for (const s of f.data[o + 1] < GROUND_Y ? [all, low] : [all]) {
          s.x += f.data[o];
          s.z += f.data[o + 2];
          s.n++;
        }
      }
  const use = low.n >= 0.2 * all.n ? low : all;
  return use.n ? { x: use.x / use.n, z: use.z / use.n, ground: use === low } : null;
}

/** Where a death sub-emitter first shows: the centroid of its particles on the first frame it has any. */
function deathSpots(e: Effect3D, frames: ReturnType<typeof simulateFrame3D>[]) {
  const spots: { layer: string; parent: string; x: number; z: number }[] = [];
  e.layers.forEach((l, i) => {
    if (!l.subEmitterOf || l.subEvent !== 'death') return;
    const parent = e.layers.find((p) => p.id === l.subEmitterOf);
    const fr = frames.find((f) => f[i]?.count);
    if (!parent || !fr) return;
    // only a single projectile has one landing spot (a ring of spikes or many bubbles does not)
    const parentCount = parent.bursts.reduce((n, b) => n + b.count, 0) + parent.rate * Math.min(e.duration, parent.stopAfter || e.duration);
    if (parentCount > 2) return;
    const f = fr[i];
    let x = 0, z = 0;
    for (let k = 0; k < f.count; k++) (x += f.data[k * STRIDE3]), (z += f.data[k * STRIDE3 + 2]);
    spots.push({ layer: l.name, parent: parent.name, x: x / f.count, z: z / f.count });
  });
  return spots;
}

export function alignChecks3D(e: Effect3D, warn: string[], notes: string[]) {
  const times = Array.from({ length: SAMPLES }, (_, i) => Math.min((i / (SAMPLES - 1)) * e.duration, e.duration - 1e-6));
  const frames = times.map((t) => simulateFrame3D(e, t, {}));

  const c = centroid(frames);
  if (c) {
    const d = Math.hypot(c.x, c.z);
    const dir = Math.round((Math.atan2(c.x, c.z) * 180) / Math.PI); // 0 = +Z, 90 = +X
    notes.push(`Placement: the ${c.ground ? 'ground-level ' : ''}particles are centred at x,z ${fmt(c.x, c.z)}, ${d.toFixed(2)} m from the origin${d > 0.3 ? ` toward ${dir}° (0° = +Z forward, 90° = +X)` : ''}. Unity plays the effect around the prefab root (the origin).`);
    // an effect cast from the character naturally reaches forward (+Z)
    const forward = Math.abs(dir) <= 25;
    if (d > 0.8 && forward) notes.push('The effect reaches forward along +Z: right for an effect cast from the character at the origin. If it is meant to land on a target instead, centre the impact on the origin.');
    else if (d > 0.8) warn.push(`The effect is centred ${d.toFixed(1)} m from the origin ${fmt(c.x, c.z)}. In Unity it plays around the prefab root: put the hit / area centre on the origin, or, for an effect cast from the character, start at the origin and travel along +Z (0°), not ${dir}°.`);
  }

  // a layer just off a spot that several other layers share (only top-level
  // emitters: sub-emitters follow their parent). Lone positions are left alone:
  // segments along a path are spaced on purpose.
  const placed = (e.layers as Emitter3D[])
    .filter((l) => !l.empty && !l.subEmitterOf)
    .map((l) => ({ l, p: worldPose(e, l).pos }));
  const spotsShared = placed
    .map((a) => placed.filter((b) => dist(a.p, b.p) <= SAME))
    .filter((group) => group.length >= 3)
    .map((group) => ({ p: group[0].p, names: group.map((g) => g.l.name) }));
  const flagged = new Set<string>();
  for (const { l, p } of placed) {
    if (flagged.has(l.name) || flagged.size >= 3) continue;
    const spot = spotsShared.find((s) => dist(s.p, p) > SAME && dist(s.p, p) < NEAR_MAX);
    if (!spot) continue;
    flagged.add(l.name);
    warn.push(`${l.name} ${fmt(p.x, p.z)} is ${dist(spot.p, p).toFixed(2)} m off the spot ${fmt(spot.p.x, spot.p.z)} that ${spot.names.slice(0, 3).join(', ')} share. If it belongs there, give it the same x,z (a near miss reads as crooked from other angles); if the offset is deliberate (layers spaced along a path, a part in front of the body), ignore this.`);
  }

  // flat ground layers right at y = 0 fight with the game's floor (in Unity they vanish into it)
  for (const { l, p } of placed)
    if (l.renderMode === 'horizontal' && p.y < 0.015 && p.y > -0.5) warn.push(`${l.name} lies flat at y ${p.y.toFixed(2)}: on a real floor (and in Unity's verify scene) it disappears into the ground. Lift ground decals to y 0.02-0.05.`);

  // a projectile's landing (death sub-emitters) against the ground decals placed for it
  const decals = (e.layers as Emitter3D[]).filter((l) => !l.empty && !l.subEmitterOf && l.renderMode === 'horizontal').map((l) => ({ l, p: worldPose(e, l).pos }));
  const spots = deathSpots(e, frames);
  const byParent = new Map<string, (typeof spots)[number]>();
  for (const s of spots) if (!byParent.has(s.parent)) byParent.set(s.parent, s);
  for (const s of byParent.values()) {
    const near = decals.map((d) => ({ ...d, d: dist(d.p, s) })).sort((a, b) => a.d - b.d)[0];
    if (near && near.d > 0.25 && near.d < 4) warn.push(`${s.parent} ends (its death sub-emitters start) around ${fmt(s.x, s.z)}, ${near.d.toFixed(2)} m from the ground decal ${near.l.name} ${fmt(near.p.x, near.p.z)}. Move the decal (or aim the parent) so the impact lands on it.`);
  }
}
