// analyze_effect: numeric checks over the whole effect, written for the agent.

import { is3D, type AnyEffect } from '../core/effectKind';
import { simulateFrame, STRIDE } from '../engine/simulate';
import { simulateFrame3D, STRIDE3 } from '../engine/simulate3d';
import type { Effect, Emitter } from '../engine/types';
import type { Effect3D, Emitter3D } from '../engine/types3d';
import { renderChecks3D } from './renderChecks3d';
import { alignChecks3D } from './alignChecks3d';

interface LayerStats {
  name: string;
  peak: number;
  framesVisible: number;
  outside: number; // 2D: share of particle samples outside the canvas
}

const SAMPLES = 24;

function sampleTimes(e: AnyEffect): number[] {
  return Array.from({ length: SAMPLES }, (_, i) => Math.min((i / (SAMPLES - 1)) * e.duration, e.duration - 1e-6));
}

function stats2D(e: Effect): LayerStats[] {
  const st = e.layers.map((l) => ({ name: l.name, peak: 0, framesVisible: 0, outside: 0, total: 0 }));
  for (const t of sampleTimes(e)) {
    simulateFrame(e, t, {}).forEach((f, i) => {
      const s = st[i];
      s.peak = Math.max(s.peak, f.count);
      if (f.count) s.framesVisible++;
      for (let k = 0; k < f.count; k++) {
        const x = f.data[k * STRIDE], y = f.data[k * STRIDE + 1];
        s.total++;
        if (x < 0 || y < 0 || x > e.width || y > e.height) s.outside++;
      }
    });
  }
  return st.map((s) => ({ ...s, outside: s.total ? s.outside / s.total : 0 }));
}

function stats3D(e: Effect3D): { layers: LayerStats[]; extent: number } {
  const st = e.layers.map((l) => ({ name: l.name, peak: 0, framesVisible: 0, outside: 0 }));
  let extent = 0;
  for (const t of sampleTimes(e)) {
    simulateFrame3D(e, t, {}).forEach((f, i) => {
      st[i].peak = Math.max(st[i].peak, f.count);
      if (f.count) st[i].framesVisible++;
      for (let k = 0; k < f.count; k++) {
        const o = k * STRIDE3;
        extent = Math.max(extent, Math.abs(f.data[o]), Math.abs(f.data[o + 1]), Math.abs(f.data[o + 2]));
      }
    });
  }
  return { layers: st, extent };
}

function checks3D(e: Effect3D, warn: string[]) {
  for (const l of e.layers as Emitter3D[]) {
    if (l.empty) continue;
    const parent = l.subEmitterOf ? e.layers.find((p) => p.id === l.subEmitterOf) : null;
    if (parent) {
      if (l.subEvent === 'collision' && !parent.floor) warn.push(`${l.name}: Collision sub-emitter, but ${parent.name} has no floor collision, so it never fires.`);
      if (l.subEvent !== 'birth' && !l.bursts.some((b) => b.count > 0)) warn.push(`${l.name}: ${l.subEvent} sub-emitter without bursts emits nothing.`);
      if (l.subEvent === 'birth' && l.rate <= 0) warn.push(`${l.name}: Birth sub-emitter with rate 0 emits nothing.`);
    }
    if (l.trails && l.trailWidth > 0.6) warn.push(`${l.name}: trail starts at ${l.trailWidth}x the particle size; the flat trail start reads as a cut-off front. Use <= 0.5 and a bigger soft head.`);
    if (l.rate * l.startLifetime.max > 3000) warn.push(`${l.name}: about ${Math.round(l.rate * l.startLifetime.max)} live particles; heavy for games.`);
    if (l.startSize.max > 15) warn.push(`${l.name}: start size ${l.startSize.max} m is very large.`);
  }
}

function checks2D(e: Effect, st: LayerStats[], warn: string[]) {
  (e.layers as Emitter[]).forEach((l, i) => {
    if (st[i].outside > 0.08) warn.push(`${l.name}: ${Math.round(st[i].outside * 100)}% of particles are outside the ${e.width}x${e.height} canvas (cut off in exports).`);
    if (l.rate * l.lifetime.max > 3000) warn.push(`${l.name}: about ${Math.round(l.rate * l.lifetime.max)} live particles; slow to render.`);
  });
}

export function analyzeEffect(e: AnyEffect): string {
  const warn: string[] = [];
  const notes: string[] = [];
  let layers: LayerStats[];
  let extra = '';
  if (is3D(e)) {
    const s = stats3D(e as Effect3D);
    layers = s.layers;
    extra = `Particles reach up to ${s.extent.toFixed(1)} m from the origin.`;
    if (s.extent > 25) warn.push(`Particles travel ${s.extent.toFixed(0)} m from the origin; most of the effect will be off screen.`);
    checks3D(e as Effect3D, warn);
    renderChecks3D(e as Effect3D, warn, notes);
    alignChecks3D(e as Effect3D, warn, notes);
  } else {
    layers = stats2D(e as Effect);
    checks2D(e as Effect, layers, warn);
  }
  e.layers.forEach((l, i) => {
    if ((l as Emitter3D).empty) return; // a 3D empty node emits nothing by design
    if (l.visible && layers[i].framesVisible === 0) warn.push(`${l.name}: never shows a particle (check emission, lifetime, alpha, size).`);
    if (l.visible && layers[i].peak >= l.maxParticles) warn.push(`${l.name}: hits its Max Particles (${l.maxParticles}); raise it or emit less.`);
  });
  if (e.loop === 'once') {
    const tail = is3D(e) ? simulateFrame3D(e as Effect3D, e.duration - 1e-3, {}) : simulateFrame(e as Effect, e.duration - 1e-3, {});
    const alive = tail.reduce((s, f) => s + f.count, 0);
    if (alive > 0) warn.push(`${alive} particle(s) are still alive at the end of the ${e.duration} s one-shot; they will be cut off. Lengthen duration or shorten lifetimes.`);
  }
  const lines = layers.map((s) => `- ${s.name}: peak ${s.peak} particles, visible in ${s.framesVisible}/${SAMPLES} samples`);
  const problems = warn.length ? `Problems (${warn.length}):\n${warn.map((w) => `- ${w}`).join('\n')}` : 'No problems found.';
  const notesText = notes.length ? `Notes:\n${notes.map((n) => `- ${n}`).join('\n')}` : '';
  return [`Layers:`, ...lines, extra, problems, notesText].filter(Boolean).join('\n');
}
