// Builds the triangles of a custom mesh from its recipe.

import type { MeshData } from '../meshData';
import { MAX_MESH_VERTICES, type MeshSource } from '../meshSource';
import { applyTransform, flatShade, planarUVs, smoothNormals } from './common';
import { buildExtrude } from './extrude';
import { buildLathe } from './lathe';
import { buildSweep } from './sweep';

function buildRaw(s: Extract<MeshSource, { type: 'raw' }>): MeshData {
  const m: MeshData = { positions: s.positions.slice(), normals: [], uvs: s.uvs?.slice() ?? [], indices: s.indices.slice() };
  if (!s.uvs) planarUVs(m);
  if (s.normals) m.normals = s.normals.slice();
  else smoothNormals(m);
  return m;
}

/** The mesh a recipe describes, in Unity coordinates. Throws when it would be too big for Unity's 16-bit index buffer. */
export function buildMesh(s: MeshSource): MeshData {
  let m = s.type === 'lathe' ? buildLathe(s) : s.type === 'extrude' ? buildExtrude(s) : s.type === 'sweep' ? buildSweep(s) : buildRaw(s);
  if (s.scale || s.rotate || s.offset) applyTransform(m, s);
  if (s.flat) m = flatShade(m);
  const count = m.positions.length / 3;
  if (count > MAX_MESH_VERTICES) throw new Error(`The mesh has ${count} vertices (max ${MAX_MESH_VERTICES}); use fewer segments or points${s.flat ? ', or drop flat' : ''}`);
  if (!m.indices.length) throw new Error('The mesh has no triangles');
  // short numbers keep exported JSON and saved files small
  const r = (v: number) => Math.round(v * 1e5) / 1e5;
  return { positions: m.positions.map(r), normals: m.normals.map(r), uvs: m.uvs.map(r), indices: m.indices };
}
