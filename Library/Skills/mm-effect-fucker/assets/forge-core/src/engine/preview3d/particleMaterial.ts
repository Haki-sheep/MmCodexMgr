// Builds the preview's particle ShaderMaterial and keeps its uniforms in step
// with a layer's settings (texture, flipbook, material features, blending).

import * as THREE from 'three';
import type { Emitter3D } from '../types3d';
import { FLIPBOOK_TILES } from '../render3d/sheet';
import { assetImage } from '../assetImages';
import { PARTICLE_FRAG, customParticleFrag } from './shaders';
import { GLSL_PRELUDE } from '../../shaders/dialect';
import { assetTexture, flipbookTexture, noiseTexture, spriteTexture, tileableTexture } from './textures';

/** Scene inputs the soft-particle test needs (filled in by the renderer). */
export interface DepthInputs {
  texture: THREE.Texture | null;
  width: number;
  height: number;
  near: number;
  far: number;
}

/** Seconds of preview time, shared by every particle material (custom shaders read it as fxTime). */
export const fxTimeUniform = { value: 0 };

/** `custom` is the source of a custom shader (fxCustom) to build in, or null for the standard material. */
export function particleMaterial(vertexShader: string, custom: string | null = null): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: custom ? customParticleFrag(GLSL_PRELUDE, custom) : PARTICLE_FRAG,
    uniforms: {
      fxTime: fxTimeUniform,
      uMap: { value: null },
      uIntensity: { value: 1 },
      uBlendKind: { value: 0 },
      uScroll: { value: new THREE.Vector2() },
      uSheetGrid: { value: new THREE.Vector2() },
      uSheetMode: { value: 0 },
      uSheetCycles: { value: 1 },
      uSheetFps: { value: 24 },
      uSheetRandom: { value: 0 },
      uSheetStart: { value: 0 },
      uFrameKeys: { value: Array.from({ length: 16 }, () => new THREE.Vector2()) },
      uFrameKeyCount: { value: 0 },
      uDissolve: { value: 0 },
      uDissolveRange: { value: new THREE.Vector2(0, 1) },
      uDissolveEdge: { value: 0.08 },
      uDissolveScale: { value: 1 },
      uEdgeColor: { value: new THREE.Color() },
      uNoise: { value: null },
      uDissolveTexOn: { value: 0 },
      uDissolveSoft: { value: 0.02 },
      uDissolveKeys: { value: Array.from({ length: 16 }, () => new THREE.Vector2()) },
      uDissolveKeyCount: { value: 0 },
      uFresnel: { value: 0 },
      uFresnelPower: { value: 2 },
      uFresnelColor: { value: new THREE.Color() },
      uSoftness: { value: 0 },
      uDepth: { value: null },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uNear: { value: 0.05 },
      uFar: { value: 500 },
      // billboard
      uMode: { value: 0 },
      uLengthScale: { value: 2 },
      uVelocityScale: { value: 0 },
      // mesh
      uAlign: { value: 0 },
      uPivot: { value: new THREE.Vector3() },
      uFlip: { value: new THREE.Vector2() },
      uApplyColorSpace: { value: 1 },
      uSizeLimit: { value: new THREE.Vector2(0, 100) },
      uLocalRot: { value: new THREE.Matrix3() },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

/**
 * Colours go to the shader as raw sRGB values (it decodes them itself), so
 * they are stored without three's colour management conversion.
 */
const setHex = (c: THREE.Color, hex: string) =>
  c.setRGB(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255, THREE.LinearSRGBColorSpace);

export function blendingFor(em: Emitter3D): THREE.Blending {
  if (em.blend === 'premultiply' || em.blend === 'softAdd') return THREE.CustomBlending;
  return em.blend === 'add' ? THREE.AdditiveBlending : THREE.NormalBlending;
}

/** Shader output kind (uBlendKind / Unity _BlendKind): 0 straight alpha, 1 premultiplied, 2 soft additive. */
export const blendKind = (em: Emitter3D) => (em.blend === 'premultiply' ? 1 : em.blend === 'softAdd' ? 2 : 0);

/** Blend factors of the custom modes (the same as FxForgeMaterials.SetBlend writes for Unity). */
export function setBlend(mat: THREE.ShaderMaterial, em: Emitter3D) {
  mat.blending = blendingFor(em);
  mat.blendSrc = THREE.OneFactor;
  mat.blendDst = em.blend === 'softAdd' ? THREE.OneMinusSrcColorFactor : THREE.OneMinusSrcAlphaFactor;
  mat.blendEquation = THREE.AddEquation;
  if (mat.uniforms.uBlendKind) mat.uniforms.uBlendKind.value = blendKind(em);
}

export function applyLayer(mat: THREE.ShaderMaterial, em: Emitter3D, depth: DepthInputs) {
  const u = mat.uniforms;
  const m = em.material;
  setBlend(mat, em);
  const sheet = em.sheet.enabled;
  // library assets win over the built-in textures while they are loaded
  const sheetAsset = sheet && em.sheet.asset ? assetImage(em.sheet.asset) : null;
  const mainAsset = !sheet && m.texture ? assetImage(m.texture) : null;
  u.uMap.value = sheetAsset
    ? assetTexture(em.sheet.asset, sheetAsset)
    : sheet
      ? flipbookTexture(em.sheet.texture)
      : mainAsset
        ? assetTexture(m.texture, mainAsset)
        : m.mainTexture === 'sprite'
          ? spriteTexture(em.sprite)
          : tileableTexture(m.mainTexture);
  (u.uSheetGrid.value as THREE.Vector2).set(sheet ? (sheetAsset?.tilesX ?? FLIPBOOK_TILES) : 0, sheet ? (sheetAsset?.tilesY ?? FLIPBOOK_TILES) : 0);
  u.uSheetMode.value = em.sheet.mode === 'fps' ? 1 : 0;
  u.uSheetCycles.value = em.sheet.cycles;
  u.uSheetFps.value = em.sheet.fps;
  u.uSheetRandom.value = em.sheet.randomStart ? 1 : 0;
  u.uSheetStart.value = em.sheet.startFrame;
  const keys = em.sheet.frameCurve;
  (u.uFrameKeys.value as THREE.Vector2[]).forEach((v, i) => v.set(keys[i]?.t ?? 1, keys[i]?.v ?? 0));
  u.uFrameKeyCount.value = Math.min(16, keys.length);
  u.uIntensity.value = m.intensity;
  (u.uScroll.value as THREE.Vector2).set(m.scrollX, m.scrollY);
  u.uDissolve.value = m.dissolve ? 1 : 0;
  (u.uDissolveRange.value as THREE.Vector2).set(m.dissolveFrom, m.dissolveTo);
  u.uDissolveEdge.value = m.dissolveEdge;
  u.uDissolveScale.value = m.dissolveScale;
  setHex(u.uEdgeColor.value, m.dissolveEdgeColor);
  // a library texture's red channel replaces the noise (imported CFXR dissolve textures)
  const dissolveAsset = m.dissolveTexture ? assetImage(m.dissolveTexture) : null;
  u.uNoise.value = dissolveAsset ? assetTexture(m.dissolveTexture, dissolveAsset) : noiseTexture();
  u.uDissolveTexOn.value = dissolveAsset ? 1 : 0;
  u.uDissolveSoft.value = m.dissolveSoftness;
  (u.uDissolveKeys.value as THREE.Vector2[]).forEach((v, i) => v.set(m.dissolveCurve[i]?.t ?? 1, m.dissolveCurve[i]?.v ?? 0));
  u.uDissolveKeyCount.value = Math.min(16, m.dissolveCurve.length);
  u.uFresnel.value = em.renderMode === 'mesh' ? m.fresnel : 0;
  u.uFresnelPower.value = m.fresnelPower;
  setHex(u.uFresnelColor.value, m.fresnelColor);
  u.uSoftness.value = depth.texture ? m.softness : 0;
  u.uDepth.value = depth.texture;
  (u.uResolution.value as THREE.Vector2).set(depth.width, depth.height);
  u.uNear.value = depth.near;
  u.uFar.value = depth.far;
}
