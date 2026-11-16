// Ear-clipping triangulation of a simple polygon (concave allowed, no holes).

/** Signed area; positive when the points run counter-clockwise (x right, y up). */
export function signedArea(pts: [number, number][]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
    a += x0 * y1 - x1 * y0;
  }
  return a / 2;
}

const crossZ = (a: [number, number], b: [number, number], c: [number, number]) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

function inside(p: [number, number], a: [number, number], b: [number, number], c: [number, number]) {
  return crossZ(a, b, p) >= 0 && crossZ(b, c, p) >= 0 && crossZ(c, a, p) >= 0;
}

/** Triangles as index triples into `pts`, wound counter-clockwise. Self-intersecting input still yields triangles (best effort). */
export function triangulate(pts: [number, number][]): number[] {
  const idx = pts.map((_, i) => i);
  if (signedArea(pts) < 0) idx.reverse();
  const out: number[] = [];
  let guard = idx.length * idx.length;
  while (idx.length > 3 && guard-- > 0) {
    let clipped = false;
    for (let i = 0; i < idx.length; i++) {
      const ia = idx[(i + idx.length - 1) % idx.length], ib = idx[i], ic = idx[(i + 1) % idx.length];
      const a = pts[ia], b = pts[ib], c = pts[ic];
      if (crossZ(a, b, c) <= 1e-12) continue; // reflex or flat corner
      let ear = true;
      for (const j of idx) {
        if (j === ia || j === ib || j === ic) continue;
        if (inside(pts[j], a, b, c)) {
          ear = false;
          break;
        }
      }
      if (!ear) continue;
      out.push(ia, ib, ic);
      idx.splice(i, 1);
      clipped = true;
      break;
    }
    // degenerate input: clip any corner so the loop ends
    if (!clipped) out.push(idx[0], idx[1], idx[2]), idx.splice(1, 1);
  }
  if (idx.length === 3) out.push(idx[0], idx[1], idx[2]);
  return out;
}
