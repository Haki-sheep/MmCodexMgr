// Helpers shared by everything that handles both 2D and 3D effects.

import { sanitizeEffect, type Effect, type Emitter } from '../engine/types';
import { sanitizeEffect3D, type Effect3D, type Emitter3D } from '../engine/types3d';

export type AnyEffect = Effect | Effect3D;
export type AnyEmitter = Emitter | Emitter3D;
export type EffectKind = '2d' | '3d';

export const is3D = (e: AnyEffect): e is Effect3D => (e as Effect3D).space === '3d';
export const kindOf = (e: AnyEffect): EffectKind => (is3D(e) ? '3d' : '2d');

/** Every effect from outside (disk, storage, AI, import) goes through here. */
export const sanitizeAny = (raw: any): AnyEffect => (raw && raw.space === '3d' ? sanitizeEffect3D(raw) : sanitizeEffect(raw));

export const framesOf = (e: AnyEffect) => Math.max(1, Math.round(e.duration * e.fps));

export const fileSafeName = (name: string) => name.replace(/[^\w一-龥-]+/g, '_') || 'effect';
