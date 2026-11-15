// A custom particle mesh in the library: its recipe plus a few numbers for lists.

import { MESH_ID } from '../engine/meshes/customMeshes';
import { sanitizeMeshSource, type MeshSource } from '../engine/meshes/meshSource';

export interface MeshRecord {
  id: string;
  name: string;
  /** What it is for, for the user and the agent. */
  description: string;
  source: MeshSource;
  createdAt: number;
  updatedAt: number;
}

export const newMeshId = () => `m_${Date.now().toString(36)}${Math.floor(Math.random() * 36 ** 4).toString(36).padStart(4, '0')}`;

const str = (v: unknown, d: string, max: number) => (typeof v === 'string' ? v.slice(0, max) : d);

/** A stored or imported record, or null when it cannot be used. */
export function sanitizeMesh(raw: unknown): MeshRecord | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  if (typeof r.id !== 'string' || !MESH_ID.test(r.id)) return null;
  let source: MeshSource;
  try {
    source = sanitizeMeshSource(r.source);
  } catch {
    return null;
  }
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : Date.now());
  return {
    id: r.id,
    name: str(r.name, r.id, 60).trim() || r.id,
    description: str(r.description, '', 400),
    source,
    createdAt: n(r.createdAt),
    updatedAt: n(r.updatedAt),
  };
}
