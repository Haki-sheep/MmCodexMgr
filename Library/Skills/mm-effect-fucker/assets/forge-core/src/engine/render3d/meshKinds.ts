// Mesh particles: which mesh (built-in or custom) and how it is oriented.

import { pick } from './sanitize';
import { MESH_ID } from '../meshes/customMeshes';

export type MeshKind = 'spike' | 'shard' | 'crystal' | 'ring' | 'cylinder' | 'sphere' | 'cube' | 'quad';
export const MESH_KINDS: readonly MeshKind[] = ['spike', 'shard', 'crystal', 'ring', 'cylinder', 'sphere', 'cube', 'quad'];
/** A layer's mesh: a built-in kind, or the id ("m_...") of a custom mesh from the mesh library. */
export type MeshRef = MeshKind | `m_${string}`;

/**
 * velocity: the mesh's +Z points along the particle's motion (Unity alignment Velocity).
 * random:   random 3D orientation, tumbling with the layer's spin (Unity startRotation3D + separate axes).
 * local:    the layer's own rotation, plus spin around the mesh's Z (Unity alignment Local).
 */
/** view: the mesh's axes follow the camera's (Unity Render Alignment View / Facing), like a billboard. */
export type MeshAlign = 'velocity' | 'random' | 'local' | 'view';
export const MESH_ALIGNS: readonly MeshAlign[] = ['velocity', 'random', 'local', 'view'];

export const sanitizeMeshKind = (v: unknown): MeshRef => (typeof v === 'string' && MESH_ID.test(v) ? (v as MeshRef) : pick(v, MESH_KINDS, 'shard'));
export const sanitizeMeshAlign = (v: unknown): MeshAlign => pick(v, MESH_ALIGNS, 'random');
