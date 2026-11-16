// Custom meshes in the Unity package: each one a layer uses is written as
// Meshes/fx_mesh_<id>.json, the same format as the built-in meshes, so the
// importer (FxForgeMeshes.cs) turns it into fx_mesh_<id>.asset unchanged.

import { strToU8 } from 'fflate';
import type { Effect3D } from '../engine/types3d';
import { customMesh, isCustomMesh } from '../engine/meshes/customMeshes';

/** The mesh a layer exports with: a custom mesh missing from the library falls back to the shard (as the preview draws it). */
export const exportedMesh = (mesh: string) => (isCustomMesh(mesh) && !customMesh(mesh) ? 'shard' : mesh);

/** Mesh JSON files for the custom meshes the effect's mesh layers use. */
export function customMeshFiles(effect: Effect3D): Record<string, Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  for (const l of effect.layers) {
    if (l.renderMode !== 'mesh' || !isCustomMesh(l.mesh)) continue;
    const e = customMesh(l.mesh);
    if (e) files[`FXForge/Meshes/fx_mesh_${l.mesh}.json`] ??= strToU8(JSON.stringify(e.data));
  }
  return files;
}
