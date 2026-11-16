// Layer hierarchy of a 3D effect, like Unity's Transform hierarchy: a layer's
// position and rotation are relative to its parent layer (`parentId`), and a
// hidden parent hides everything under it. Sub-emitters hang off their source
// layer in the tree (`subEmitterOf`), but their transform is effect-relative
// because their particles are born at the source's particles.
//
// Layer order in `effect.layers` stays the draw order; the tree is derived.

import type { Effect3D, Emitter3D, Vec3 } from './types3d';
import { apply, eulerToMat3, mat3ToEuler, mul, transpose, type Mat3 } from './sim3d/math';

export interface Pose {
  pos: Vec3;
  M: Mat3;
}

const IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

/** The node a layer sits under in the layer tree ('' = top level). */
export const treeParentId = (l: Emitter3D): string => l.subEmitterOf || l.parentId;

export function childrenOf(e: Effect3D, id: string): Emitter3D[] {
  return e.layers.filter((l) => treeParentId(l) === id);
}

/** Ids of every layer under `id` in the tree (not including `id`). */
export function descendantIds(e: Effect3D, id: string): Set<string> {
  const out = new Set<string>();
  const walk = (pid: string) => {
    for (const c of childrenOf(e, pid)) {
      if (out.has(c.id)) continue;
      out.add(c.id);
      walk(c.id);
    }
  };
  walk(id);
  return out;
}

function ancestors(e: Effect3D, l: Emitter3D): Emitter3D[] {
  const out: Emitter3D[] = [];
  let pid = treeParentId(l);
  while (pid && out.length < e.layers.length) {
    const p = e.layers.find((x) => x.id === pid);
    if (!p) break;
    out.push(p);
    pid = treeParentId(p);
  }
  return out;
}

/** Visible itself and every node above it is visible (Unity: activeInHierarchy). */
export function visibleInTree(e: Effect3D, l: Emitter3D): boolean {
  return l.visible && ancestors(e, l).every((a) => a.visible);
}

/** How deep a layer is in the tree (0 = top level). */
export const depthOf = (e: Effect3D, l: Emitter3D) => ancestors(e, l).length;

/**
 * The layer's transform relative to the effect root. Sub-emitters: the
 * position is the source layer's (the centre for radial/orbital motion) and the
 * rotation is their own, effect-relative.
 */
export function worldPose(e: Effect3D, l: Emitter3D): Pose {
  if (l.subEmitterOf) {
    const src = e.layers.find((x) => x.id === l.subEmitterOf);
    return { pos: src && src !== l ? worldPose(e, src).pos : { ...l.position }, M: eulerToMat3(l.rotation) };
  }
  let pos = { ...l.position };
  let M = eulerToMat3(l.rotation);
  let pid = l.parentId;
  for (let guard = 0; pid && guard < e.layers.length; guard++) {
    const p = e.layers.find((x) => x.id === pid);
    if (!p) break;
    const PM = eulerToMat3(p.rotation);
    const [x, y, z] = apply(PM, pos.x, pos.y, pos.z);
    pos = { x: x + p.position.x, y: y + p.position.y, z: z + p.position.z };
    M = mul(PM, M);
    pid = p.parentId;
  }
  return { pos, M };
}

/** Local position/rotation under `parentId` that give the world pose `w`. */
export function localFromWorld(e: Effect3D, parentId: string, w: Pose): { position: Vec3; rotation: Vec3 } {
  const p = parentId ? e.layers.find((x) => x.id === parentId) : undefined;
  const P = p ? worldPose(e, p) : { pos: { x: 0, y: 0, z: 0 }, M: IDENTITY };
  const inv = transpose(P.M);
  const [x, y, z] = apply(inv, w.pos.x - P.pos.x, w.pos.y - P.pos.y, w.pos.z - P.pos.z);
  const r = mat3ToEuler(mul(inv, w.M));
  const round = (n: number, k = 1e5) => Math.round(n * k) / k;
  return { position: { x: round(x), y: round(y), z: round(z) }, rotation: { x: round(r.x, 1e3), y: round(r.y, 1e3), z: round(r.z, 1e3) } };
}

/** Why `childId` cannot go under `parentId`, or null if it can ('' = top level is always fine). */
export function parentProblem(e: Effect3D, childId: string, parentId: string): string | null {
  const child = e.layers.find((l) => l.id === childId);
  if (!child) return 'no such layer';
  if (!parentId) return null;
  const p = e.layers.find((l) => l.id === parentId);
  if (!p) return 'no such parent layer';
  if (p === child) return 'a layer cannot be its own parent';
  if (child.subEmitterOf) return 'a sub-emitter stays under its source layer (change subEmitterOf instead)';
  if (p.subEmitterOf) return 'a sub-emitter cannot have children';
  if (descendantIds(e, childId).has(parentId)) return 'the parent is inside this layer';
  return null;
}

/** Repairs links after loading: sub-emitter and parent links must point at valid layers, without cycles. */
export function repairLinks(layers: Emitter3D[]) {
  const byId = new Map(layers.map((l) => [l.id, l]));
  for (const l of layers) if (l.empty) l.subEmitterOf = '';
  // sub-emitters: one level, from a particle layer, never itself
  for (const l of layers) {
    if (!l.subEmitterOf) continue;
    const p = byId.get(l.subEmitterOf);
    if (!p || p === l || p.subEmitterOf || p.empty) l.subEmitterOf = '';
  }
  for (const l of layers) {
    if (l.subEmitterOf) l.parentId = '';
    if (!l.parentId) continue;
    const p = byId.get(l.parentId);
    if (!p || p === l || p.subEmitterOf) l.parentId = '';
  }
  // break cycles: walk up from every layer
  for (const l of layers) {
    const seen = new Set<string>([l.id]);
    let cur = l;
    while (cur.parentId) {
      if (seen.has(cur.parentId)) {
        cur.parentId = '';
        break;
      }
      seen.add(cur.parentId);
      cur = byId.get(cur.parentId)!;
    }
  }
}

/**
 * A copy with every transform baked to effect space and hidden subtrees
 * hidden, so code that does not know the tree (per-layer filters) still works.
 */
export function flattenHierarchy(e: Effect3D): Effect3D {
  const copy: Effect3D = JSON.parse(JSON.stringify(e));
  const poses = e.layers.map((l) => worldPose(e, l));
  const vis = e.layers.map((l) => visibleInTree(e, l));
  copy.layers.forEach((l, i) => {
    if (!l.subEmitterOf) {
      l.position = poses[i].pos;
      l.rotation = mat3ToEuler(poses[i].M);
    }
    l.parentId = '';
    l.visible = vis[i];
  });
  return copy;
}
