// Wireframe of the selected layer's emission shape (and its collision floor),
// or the axes of a selected empty node.

import * as THREE from 'three';
import type { Emitter3D } from '../types3d';
import type { Pose } from '../hierarchy3d';

export class ShapeGizmo {
  readonly group = new THREE.Group();
  private key = '';

  /** `pose`: the layer's transform relative to the effect root. */
  update(em: Emitter3D | null, pose: Pose | null) {
    const key = em && pose ? JSON.stringify([em.empty, em.shape, em.radius, em.angle, em.arc, em.boxSize, pose, em.floor, em.floorY]) : '';
    if (key === this.key) return;
    this.key = key;
    this.group.clear();
    if (!em || !pose) return;
    const pts = em.empty ? axes() : outline(em);
    const M = pose.M;
    const P = pose.pos;
    const out = new Float32Array(pts.length);
    for (let i = 0; i < pts.length; i += 3) {
      const x = pts[i], y = pts[i + 1], z = pts[i + 2];
      out[i] = M[0] * x + M[1] * y + M[2] * z + P.x;
      out[i + 1] = M[3] * x + M[4] * y + M[5] * z + P.y;
      out[i + 2] = -(M[6] * x + M[7] * y + M[8] * z + P.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(out, 3));
    this.group.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffcf6b, transparent: true, opacity: 0.75, depthTest: false })));
    if (em.floor && !em.empty) {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 6),
        new THREE.MeshBasicMaterial({ color: 0x78c8ff, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }),
      );
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = em.floorY;
      this.group.add(plane);
    }
  }
}

/** An empty node's pivot: three axes, +Z longest (the forward direction). */
function axes(): number[] {
  return [-0.3, 0, 0, 0.3, 0, 0, 0, -0.3, 0, 0, 0.3, 0, 0, 0, 0, 0, 0, 0.6, 0.25, 0, 0.45, 0, 0, 0.6, -0.25, 0, 0.45, 0, 0, 0.6];
}

/** Line segments of the shape in the layer's local space (Unity axes). */
function outline(em: Emitter3D): number[] {
  const pts: number[] = [];
  const seg = (a: number[], b: number[]) => pts.push(...a, ...b);
  const circle = (r: number, z: number, arcDeg = 360) => {
    const n = 48;
    const arc = (arcDeg * Math.PI) / 180;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * arc, a1 = ((i + 1) / n) * arc;
      seg([Math.cos(a0) * r, Math.sin(a0) * r, z], [Math.cos(a1) * r, Math.sin(a1) * r, z]);
    }
  };
  const R = Math.max(em.radius, 0.02);
  switch (em.shape) {
    case 'sphere':
    case 'hemisphere':
      circle(R, 0);
      for (let i = 0; i < 48; i++) {
        const a0 = (i / 48) * Math.PI * 2, a1 = ((i + 1) / 48) * Math.PI * 2;
        if (em.shape === 'hemisphere' && (Math.sin(a0) < -1e-6 || Math.sin(a1) < -1e-6)) continue;
        seg([Math.cos(a0) * R, 0, Math.sin(a0) * R], [Math.cos(a1) * R, 0, Math.sin(a1) * R]);
        seg([0, Math.cos(a0) * R, Math.sin(a0) * R], [0, Math.cos(a1) * R, Math.sin(a1) * R]);
      }
      break;
    case 'cone': {
      circle(R, 0, em.arc);
      const L = 1;
      const top = R + Math.tan((Math.min(em.angle, 85) * Math.PI) / 180) * L;
      circle(top, L, em.arc);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * ((em.arc * Math.PI) / 180);
        seg([Math.cos(a) * R, Math.sin(a) * R, 0], [Math.cos(a) * top, Math.sin(a) * top, L]);
      }
      break;
    }
    case 'circle':
      circle(R, 0, em.arc);
      break;
    case 'box': {
      const { x, y, z } = em.boxSize;
      const c = [-0.5, 0.5];
      for (const a of c) for (const b of c) {
        seg([-x / 2, a * y, b * z], [x / 2, a * y, b * z]);
        seg([a * x, -y / 2, b * z], [a * x, y / 2, b * z]);
        seg([a * x, b * y, -z / 2], [a * x, b * y, z / 2]);
      }
      break;
    }
    case 'edge':
      seg([-R, 0, 0], [R, 0, 0]);
      break;
  }
  if (em.shape !== 'box') {
    // the shape scale stretches every shape but the box (whose size it is)
    const { x, y, z } = em.boxSize;
    for (let i = 0; i < pts.length; i += 3) { pts[i] *= x; pts[i + 1] *= y; pts[i + 2] *= z; }
  }
  seg([0, 0, 0], [0, 0, 0.6]); // forward arrow (local +Z)
  return pts;
}
