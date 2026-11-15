// 3D export: a folder for Unity's Assets/ that turns into native
// ParticleSystem prefabs on import.

import { zipSync, strToU8 } from 'fflate';
import type { Effect3D } from '../engine/types3d';
import { visibleInTree } from '../engine/hierarchy3d';
import type { SpriteKind } from '../engine/types';
import { spriteAtSize, trailTexture } from '../engine/sprites';
import { flipbook } from '../engine/textures/flipbooks';
import { dissolveNoise, tileableMain } from '../engine/textures/tileable';
import { FLIPBOOKS } from '../engine/render3d/sheet';
import { MESH_KINDS } from '../engine/render3d/meshKinds';
import { meshData } from '../engine/meshes/kinds';
import { assetLibrary } from '../assets/AssetLibrary';
import type { AssetRecord } from '../assets/types';
import { shaderLibrary } from '../shaders/ShaderLibrary';
import { customShaderFile, customShaderName, unityCustomShader } from './customShaderExport';
import { customMeshFiles, exportedMesh } from './customMeshExport';
import { download } from './export';

// Every Unity source file in ./unity3d is shipped. Runtime scripts (the ones
// without UnityEditor) go to Runtime/, editor scripts to Editor/.
const UNITY_SOURCES = import.meta.glob('./unity3d/*.{cs,shader}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

function unitySourceFiles(): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  for (const [path, text] of Object.entries(UNITY_SOURCES)) {
    const file = path.split('/').pop()!;
    const folder = file.endsWith('.shader') ? 'Shaders' : /\bUNITY_EDITOR\b|using UnityEditor;/.test(text) ? 'Editor' : 'Runtime';
    out[`FXForge/${folder}/${file}`] = strToU8(text);
  }
  return out;
}

const SPRITES: SpriteKind[] = ['soft', 'circle', 'square', 'spark', 'star', 'ring', 'smoke', 'shard'];
const TEX_SIZE = 128;

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'effect';

async function png(c: HTMLCanvasElement): Promise<Uint8Array> {
  const blob: Blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('PNG encode failed'))), 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * The shared textures and meshes every export ships. They depend on nothing
 * in the effect, so they are generated and encoded once per session.
 */
let sharedAssets: Promise<Record<string, Uint8Array>> | null = null;

async function buildSharedAssets(): Promise<Record<string, Uint8Array>> {
  const files: Record<string, Uint8Array> = {};
  for (const s of SPRITES) {
    const c = spriteAtSize(s, TEX_SIZE);
    files[`FXForge/Textures/fx_${s}.png`] = await png(c);
  }
  files['FXForge/Textures/fx_trail.png'] = await png(trailTexture());
  // the same procedural textures and meshes the preview draws
  for (const k of FLIPBOOKS) files[`FXForge/Textures/fx_sheet_${k}.png`] = await png(flipbook(k));
  for (const k of ['noise', 'streaks'] as const) files[`FXForge/Textures/fx_tile_${k}.png`] = await png(tileableMain(k));
  files['FXForge/Textures/fx_tile_dissolve.png'] = await png(dissolveNoise());
  for (const k of MESH_KINDS) files[`FXForge/Meshes/fx_mesh_${k}.json`] = strToU8(JSON.stringify(meshData(k)));
  return files;
}

export async function unityPackageFiles(effect: Effect3D): Promise<Record<string, Uint8Array>> {
  const name = slug(effect.name);
  sharedAssets ??= buildSharedAssets().catch((err) => {
    sharedAssets = null;
    throw err;
  });
  const { json, textures } = withLibraryTextures(effect);
  return {
    ...unitySourceFiles(),
    ...(await sharedAssets),
    ...textures,
    ...customMeshFiles(effect),
    [`FXForge/Effects/${name}.fxforge.json`]: strToU8(JSON.stringify(json, null, 2)),
    'FXForge/README.txt': strToU8(readme(effect, name)),
  };
}

/** Unity texture name of a library asset; tiles keep the fx_tile_ prefix so the importer sets Repeat wrapping. */
const assetFile = (a: AssetRecord) => (a.kind === 'tile' ? `fx_tile_asset_${a.id}` : `fx_asset_${a.id}`);

function pngBytes(dataUrl: string): Uint8Array {
  const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * The effect as the importer reads it (the returned `textures` also carry the
 * custom shader files): layers that use library textures get
 * the texture file name (and the flipbook grid) written in, and the PNGs go
 * to FXForge/Textures. Missing assets fall back to the built-in textures.
 */
function withLibraryTextures(effect: Effect3D): { json: unknown; textures: Record<string, Uint8Array> } {
  const textures: Record<string, Uint8Array> = {};
  const add = (a: AssetRecord) => {
    const file = assetFile(a);
    textures[`FXForge/Textures/${file}.png`] ??= pngBytes(a.dataUrl);
    return file;
  };
  const template = UNITY_SOURCES['./unity3d/FxForgeParticle.shader'];
  const layers = effect.layers.map((l) => {
    const main = l.material.texture ? assetLibrary.get(l.material.texture) : undefined;
    const sheet = l.sheet.asset ? assetLibrary.get(l.sheet.asset) : undefined;
    const custom = l.material.shader ? shaderLibrary.get(l.material.shader) : undefined;
    const dissolve = l.material.dissolveTexture ? assetLibrary.get(l.material.dissolveTexture) : undefined;
    const trail = l.trailTexture ? assetLibrary.get(l.trailTexture) : undefined;
    if (custom) textures[customShaderFile(custom.id)] ??= strToU8(unityCustomShader(template, custom));
    return {
      ...l,
      mesh: exportedMesh(l.mesh),
      material: {
        ...l.material,
        textureFile: main && main.kind !== 'flipbook' ? add(main) : '',
        dissolveTextureFile: dissolve && dissolve.kind !== 'flipbook' ? add(dissolve) : '',
        customShader: custom ? customShaderName(custom.id) : '',
      },
      trailTextureFile: trail && trail.kind !== 'flipbook' ? add(trail) : '',
      sheet: { ...l.sheet, assetFile: sheet?.kind === 'flipbook' ? add(sheet) : '', tilesX: sheet?.kind === 'flipbook' ? sheet.tilesX : 4, tilesY: sheet?.kind === 'flipbook' ? sheet.tilesY : 4 },
    };
  });
  return { json: { ...effect, layers }, textures };
}

export async function exportUnity3D(effect: Effect3D): Promise<string> {
  const name = slug(effect.name);
  const files = await unityPackageFiles(effect);
  download(`${name}_unity_particles.zip`, zipSync(files, { level: 6 }), 'application/zip');
  return `${name}_unity_particles.zip（${effect.layers.filter((l) => !l.empty && visibleInTree(effect, l)).length} 个粒子系统）`;
}

function readme(e: Effect3D, name: string): string {
  return `FX Forge - Unity ParticleSystem export: ${e.name}
==================================================

What this is
  A real-time Unity particle effect (Shuriken ParticleSystem), not a baked
  sprite sheet. Each FX Forge layer becomes a child ParticleSystem.

Install
  1. Unzip so that the "FXForge" folder lands inside your project's Assets/
     folder (Assets/FXForge/...). If you already have an FXForge folder from an
     earlier export, let it overwrite the scripts and shaders.
  2. Unity imports it and builds the prefab automatically:
       Assets/FXForge/Effects/${name}.prefab
     If it did not appear, use the menu Tools > FX Forge > Rebuild All Effects.
  3. Drag the prefab into your scene and press Play (or select it and use the
     Particle Effect panel in the Scene view to preview without playing).

Using it in code
  One-shot effects (${e.loop === 'once' ? 'this one' : 'hits, explosions'}) destroy themselves when finished:
      FXForge.FxForgeEffect.Spawn(prefab, hitPoint, Quaternion.identity);
  Looping effects (${e.loop === 'perfect' ? 'this one' : 'fires, auras'}) start mid-cycle (Prewarm) and keep playing;
  call Stop() on the FxForgeEffect component to let them die out.

Notes
  - Units are metres; the FX Forge preview character is 1.8 m tall.
  - Scaling the prefab's root scales the whole effect (Scaling Mode: Hierarchy).
  - Shader: FXForge/Particle (one material per layer in FXForge/Materials).
    It is unlit and works in the Built-in pipeline and URP. In HDRP, switch the
    materials to an HDRP particle shader.
  - Colour space: FX Forge previews in Linear colour space, Unity's default
    for URP and new projects (Project Settings > Player > Other Settings >
    Color Space). In a Gamma project colours and glows look harsher.${bloomNote(e)}${softNote(e)}
  - Editing the prefab by hand is fine, but re-importing ${name}.fxforge.json
    (or re-exporting from FX Forge) rebuilds it and overwrites those edits.
  - Noise uses Unity's own noise, so turbulent layers look similar to the
    FX Forge preview but not identical.
`;
}

function bloomNote(e: Effect3D): string {
  const hdr = e.layers.some((l) => l.material.intensity > 1);
  if (!e.bloom.enabled && !hdr) return '';
  return `
  - Glow (HDR + Bloom): ${hdr ? 'some layers are brighter than 1 (HDR intensity). ' : ''}${e.bloom.enabled ? `The preview used Bloom (intensity ${e.bloom.intensity}, threshold ${e.bloom.threshold}). ` : ''}
    URP: turn on HDR on the URP asset, Post Processing on the camera, and add a
    Global Volume with a Bloom override (threshold ${e.bloom.threshold}, intensity ~${e.bloom.intensity}).
    Built-in pipeline: install the Post Processing package (Post-process Layer
    on the camera, Post-process Volume with Bloom) and allow HDR on the camera.`;
}

function softNote(e: Effect3D): string {
  if (!e.layers.some((l) => l.visible && l.material.softness > 0)) return '';
  return `
  - Soft particles fade against the scene's depth. Built-in pipeline: the
    prefab's FxForgeDepthTexture component turns the camera depth texture on.
    URP: enable "Depth Texture" on the URP asset, and set "Depth Texture Mode"
    on the URP renderer to "After Opaques" (URP 17's default "After Transparents"
    hides soft particles). The importer warns when either is off.`;
}
