// Synchronous lookup of custom meshes for the renderer and exporter, filled by
// the mesh library (engine code never depends on storage). Each change bumps
// a version so cached geometry is rebuilt.

import type { MeshData } from './meshData';

export interface CustomMeshEntry {
  data: MeshData;
  version: number;
}

/** Custom mesh ids, as stored in a layer's `mesh` field next to the built-in names. */
export const MESH_ID = /^m_[a-z0-9]{4,24}$/;
export const isCustomMesh = (ref: string) => MESH_ID.test(ref);

const meshes = new Map<string, CustomMeshEntry>();
let version = 0;

export function setCustomMesh(id: string, data: MeshData) {
  meshes.set(id, { data, version: ++version });
}

export function removeCustomMesh(id: string) {
  meshes.delete(id);
}

export function customMesh(id: string): CustomMeshEntry | null {
  return (id && meshes.get(id)) || null;
}
