// Mesh data in Unity coordinates (left-handed, Y up, +Z forward), unit size.
// The preview flips Z when uploading; the Unity importer uses it as is.

export interface MeshData {
  positions: number[]; // xyz per vertex
  normals: number[]; // xyz per vertex, pointing outward
  uvs: number[]; // uv per vertex
  indices: number[]; // triangles
}

type V3 = [number, number, number];

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/**
 * Flat-shaded polyhedron: every face gets its own vertices and a normal that
 * points away from `centre`, so facets catch the fresnel rim like cut ice.
 * UVs are a planar projection of each face onto the mesh bounds.
 */
export function faceted(verts: V3[], faces: number[][], centre: V3 = [0, 0, 0]): MeshData {
  const m: MeshData = { positions: [], normals: [], uvs: [], indices: [] };
  let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const v of verts) for (let i = 0; i < 3; i++) (lo[i] = Math.min(lo[i], v[i])), (hi[i] = Math.max(hi[i], v[i]));
  const span = hi.map((h, i) => h - lo[i] || 1);
  for (const f of faces) {
    const a = verts[f[0]], b = verts[f[1]], c = verts[f[2]];
    let n = norm(cross(sub(b, a), sub(c, a)));
    const mid = f.reduce<V3>((s, i) => [s[0] + verts[i][0] / f.length, s[1] + verts[i][1] / f.length, s[2] + verts[i][2] / f.length], [0, 0, 0]);
    const out = sub(mid, centre);
    if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0) n = [-n[0], -n[1], -n[2]];
    // project onto the two axes the face is most spread along
    const ax = Math.abs(n[0]) > Math.abs(n[2]) ? 2 : 0;
    const base = m.positions.length / 3;
    for (const i of f) {
      const v = verts[i];
      m.positions.push(...v);
      m.normals.push(...n);
      m.uvs.push((v[ax] - lo[ax]) / span[ax], (v[1] - lo[1]) / span[1]);
    }
    for (let k = 1; k + 1 < f.length; k++) m.indices.push(base, base + k, base + k + 1);
  }
  return m;
}

/** Surface of revolution around +Z: `profile` lists [z, radius] from back to front; u runs around, v along Z. */
export function lathe(profile: [number, number][], segments: number, smooth: boolean): MeshData {
  if (!smooth) {
    const verts: V3[] = [];
    for (const [z, r] of profile) for (let s = 0; s < segments; s++) {
      const a = (s / segments) * Math.PI * 2;
      verts.push([Math.cos(a) * r, Math.sin(a) * r, z]);
    }
    const faces: number[][] = [];
    for (let p = 0; p + 1 < profile.length; p++) for (let s = 0; s < segments; s++) {
      const a = p * segments + s, b = p * segments + ((s + 1) % segments);
      const c = (p + 1) * segments + ((s + 1) % segments), d = (p + 1) * segments + s;
      if (profile[p][1] === 0) faces.push([a, c, d]);
      else if (profile[p + 1][1] === 0) faces.push([a, b, d]);
      else faces.push([a, b, c, d]);
    }
    const zs = profile.map((p) => p[0]);
    return faceted(verts, faces, [0, 0, (Math.min(...zs) + Math.max(...zs)) / 2]);
  }
  const m: MeshData = { positions: [], normals: [], uvs: [], indices: [] };
  const zLo = profile[0][0], zHi = profile[profile.length - 1][0];
  for (let p = 0; p < profile.length; p++) {
    const [z, r] = profile[p];
    // normal from the profile slope
    const [z0, r0] = profile[Math.max(0, p - 1)], [z1, r1] = profile[Math.min(profile.length - 1, p + 1)];
    const dz = z1 - z0, dr = r1 - r0;
    const nl = Math.hypot(dz, dr) || 1;
    for (let s = 0; s <= segments; s++) {
      const a = (s / segments) * Math.PI * 2;
      const c = Math.cos(a), sn = Math.sin(a);
      m.positions.push(c * r, sn * r, z);
      m.normals.push((c * dz) / nl, (sn * dz) / nl, -dr / nl);
      m.uvs.push(s / segments, (z - zLo) / (zHi - zLo || 1));
    }
  }
  const row = segments + 1;
  for (let p = 0; p + 1 < profile.length; p++) for (let s = 0; s < segments; s++) {
    const a = p * row + s;
    m.indices.push(a, a + 1, a + row + 1, a, a + row + 1, a + row);
  }
  return m;
}
