// three.js textures for the preview, built once from the same canvases the
// Unity export writes as PNGs.

import * as THREE from 'three';
import type { SpriteKind } from '../types';
import type { MainTexture } from '../render3d/material';
import type { FlipbookKind } from '../render3d/sheet';
import { baseSprite, trailTexture } from '../sprites';
import { flipbook } from '../textures/flipbooks';
import { dissolveNoise, tileableMain } from '../textures/tileable';
import type { AssetImage } from '../assetImages';

const cache = new Map<string, THREE.Texture>();

function cached(key: string, make: () => HTMLCanvasElement, opts: { srgb: boolean; repeat: boolean }): THREE.Texture {
  let t = cache.get(key);
  if (t) return t;
  t = new THREE.CanvasTexture(make());
  t.colorSpace = opts.srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  if (opts.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  cache.set(key, t);
  return t;
}

export function spriteTexture(kind: SpriteKind): THREE.Texture {
  return cached(`sprite:${kind}`, () => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    c.getContext('2d')!.drawImage(baseSprite(kind) as CanvasImageSource, 0, 0);
    return c;
  }, { srgb: true, repeat: false });
}

export const trailTex = () => cached('trail', () => trailTexture(), { srgb: true, repeat: false });
export const flipbookTexture = (kind: FlipbookKind) => cached(`sheet:${kind}`, () => flipbook(kind), { srgb: true, repeat: false });
export const tileableTexture = (kind: Exclude<MainTexture, 'sprite'>) => cached(`tile:${kind}`, () => tileableMain(kind), { srgb: true, repeat: true });
/** Data texture: read as plain values, not colours. */
export const noiseTexture = () => cached('noise', () => dissolveNoise(), { srgb: false, repeat: true });

/** A library asset; rebuilt when its image changes. Tiles repeat, everything else clamps. */
const assets = new Map<string, { version: number; texture: THREE.Texture }>();
export function assetTexture(id: string, img: AssetImage): THREE.Texture {
  const hit = assets.get(id);
  if (hit && hit.version === img.version) return hit.texture;
  hit?.texture.dispose();
  const t = new THREE.CanvasTexture(img.canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  if (img.kind === 'tile') t.wrapS = t.wrapT = THREE.RepeatWrapping;
  assets.set(id, { version: img.version, texture: t });
  return t;
}
