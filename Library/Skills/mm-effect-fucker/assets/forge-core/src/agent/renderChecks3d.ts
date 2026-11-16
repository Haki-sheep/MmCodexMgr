// Checks on a 3D effect's rendering settings: combinations that do nothing,
// or that need something in the Unity project (depth texture, HDR + Bloom).

import type { Effect3D } from '../engine/types3d';
import { defaultMaterial3D } from '../engine/render3d/material';
import { assetLibrary } from '../assets/AssetLibrary';
import { shaderLibrary } from '../shaders/ShaderLibrary';

/** Short describers for the outline: only what differs from the defaults. */
export function renderSummary(l: Effect3D['layers'][number]): string {
  const m = l.material, d = defaultMaterial3D();
  const bits: string[] = [];
  if (l.renderMode === 'mesh') bits.push(`mesh ${l.mesh} (${l.meshAlign})`);
  if (m.intensity !== d.intensity) bits.push(`intensity ${m.intensity}`);
  if (m.mainTexture !== 'sprite') bits.push(`texture ${m.mainTexture}${m.scrollX || m.scrollY ? ` scroll (${m.scrollX},${m.scrollY})` : ''}`);
  if (m.dissolve) bits.push(`dissolve ${m.dissolveFrom}->${m.dissolveTo} edge ${m.dissolveEdgeColor}`);
  if (m.fresnel > 0) bits.push(`fresnel ${m.fresnel} ${m.fresnelColor}`);
  if (m.softness > 0) bits.push(`soft ${m.softness} m`);
  if (m.shader) bits.push(`custom shader ${m.shader} "${shaderLibrary.get(m.shader)?.name ?? 'missing'}"`);
  if (m.texture) bits.push(`texture asset ${m.texture} "${assetLibrary.get(m.texture)?.name ?? 'missing'}"`);
  if (l.sheet.enabled) bits.push(`flipbook ${l.sheet.asset ? `asset ${l.sheet.asset} "${assetLibrary.get(l.sheet.asset)?.name ?? 'missing'}"` : l.sheet.texture} (${l.sheet.mode === 'fps' ? `${l.sheet.fps} fps` : `x${l.sheet.cycles} per life`})`);
  return bits.join(', ');
}

export function renderChecks3D(e: Effect3D, warn: string[], notes: string[]) {
  for (const l of e.layers) {
    if (!l.visible || l.empty) continue;
    const m = l.material;
    if (m.shader && !shaderLibrary.get(m.shader)) warn.push(`${l.name}: material.shader "${m.shader}" is not in the library; the standard material is used.`);
    const main = m.texture ? assetLibrary.get(m.texture) : null;
    if (m.texture && !main) warn.push(`${l.name}: material.texture "${m.texture}" is not in the library (deleted?); the built-in texture is used.`);
    if (main?.kind === 'flipbook') warn.push(`${l.name}: "${main.name}" is a flipbook; put it in sheet.asset with sheet.enabled true, not in material.texture.`);
    const sheetAsset = l.sheet.asset ? assetLibrary.get(l.sheet.asset) : null;
    if (l.sheet.asset && !sheetAsset) warn.push(`${l.name}: sheet.asset "${l.sheet.asset}" is not in the library; the built-in flipbook is used.`);
    if (sheetAsset && sheetAsset.kind !== 'flipbook') warn.push(`${l.name}: "${sheetAsset.name}" is not a flipbook; use it as material.texture.`);
    if (l.sheet.asset && !l.sheet.enabled) warn.push(`${l.name}: sheet.asset is set but sheet.enabled is false, so the flipbook is not shown.`);
    if (m.fresnel > 0 && l.renderMode !== 'mesh') warn.push(`${l.name}: fresnel only works on mesh particles (renderMode "mesh").`);
    const tiled = main ? main.kind === 'tile' : m.mainTexture !== 'sprite';
    if ((m.scrollX || m.scrollY) && !tiled && !l.sheet.enabled) warn.push(`${l.name}: UV scroll on a non-tiling texture slides it off its quad. Use mainTexture "noise" / "streaks" or a tile asset.`);
    if (l.sheet.enabled && (m.scrollX || m.scrollY)) warn.push(`${l.name}: UV scroll is ignored while the flipbook is on.`);
    if (m.dissolve && m.dissolveTo <= m.dissolveFrom) warn.push(`${l.name}: dissolve does not progress (dissolveTo <= dissolveFrom).`);
    if (l.renderMode === 'mesh' && l.sprite === 'soft' && !l.sheet.enabled && !main && m.mainTexture === 'sprite') notes.push(`${l.name}: mesh with the "soft" sprite fades toward its UV edges; use sprite "square" for a solid surface.`);
  }
  if (e.layers.some((l) => l.visible && l.material.softness > 0)) notes.push('Soft particles: in Unity URP the URP asset needs "Depth Texture" on and the renderer\'s "Depth Texture Mode" set to "After Opaques" (the export README says so).');
  const hdr = e.layers.some((l) => l.visible && l.material.intensity > 1);
  if (hdr && !e.bloom.enabled) notes.push('Some layers have intensity > 1 but bloom is off: they only look brighter, not glowing. Enable bloom if they should glow.');
  if (e.bloom.enabled && !hdr && e.bloom.threshold >= 1) warn.push('Bloom is on with threshold >= 1 but no layer has intensity > 1, so nothing glows.');
}
