// Pixel-art palettes for palette lock. Colour counts match the published sets.

export interface Palette {
  id: string;
  name: string;
  colors: string[];
}

const p = (id: string, name: string, hex: string): Palette => ({
  id,
  name,
  colors: hex.trim().split(/\s+/).map((h) => '#' + h.toLowerCase()),
});

export const PALETTES: Palette[] = [
  p('none', 'No palette (pixelate only)', ''),
  p(
    'endesga32',
    'Endesga 32',
    `be4a2f d77643 ead4aa e4a672 b86f50 733e39 3e2731 a22633 e43b44 f77622 feae34 fee761 63c74d 3e8948 265c42 193c3e
     124e89 0099db 2ce8f5 ffffff c0cbdc 8b9bb4 5a6988 3a4466 262b44 181425 ff0044 68386c b55088 f6757a e8b796 c28569`,
  ),
  p(
    'pico8',
    'PICO-8',
    `000000 1d2b53 7e2553 008751 ab5236 5f574f c2c3c7 fff1e8 ff004d ffa300 ffec27 00e436 29adff 83769c ff77a8 ffccaa`,
  ),
  p(
    'sweetie16',
    'Sweetie 16',
    `1a1c2c 5d275d b13e53 ef7d57 ffcd75 a7f070 38b764 257179 29366f 3b5dc9 41a6f6 73eff7 f4f4f4 94b0c2 566c86 333c57`,
  ),
  p(
    'db16',
    'DawnBringer 16',
    `140c1c 442434 30346d 4e4a4e 854c30 346524 d04648 757161 597dce d27d2c 8595a1 6daa2c d2aa99 6dc2ca dad45e deeed6`,
  ),
  p(
    'db32',
    'DawnBringer 32',
    `000000 222034 45283c 663931 8f563b df7126 d9a066 eec39a fbf236 99e550 6abe30 37946e 4b692f 524b24 323c39 3f3f74
     306082 5b6ee1 639bff 5fcde4 cbdbfc ffffff 9badb7 847e87 696a6a 595652 76428a ac3232 d95763 d77bba 8f974a 8a6f30`,
  ),
  p('gameboy', 'Game Boy', `0f380f 306230 8bac0f 9bbc0f`),
];

export function getPalette(id: string): Palette {
  return PALETTES.find((x) => x.id === id) ?? PALETTES[1];
}

// ---------------------------------------------------------------------------
// Nearest-colour lookup in OKLab, precomputed for 15-bit RGB.

function srgbToLinear(c: number): number {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function toOklab(r: number, g: number, b: number): [number, number, number] {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

const lutCache = new Map<string, { lut: Uint8Array; rgb: Uint8Array }>();

export function paletteLut(id: string): { lut: Uint8Array; rgb: Uint8Array } | null {
  const pal = getPalette(id);
  if (pal.colors.length === 0) return null;
  const hit = lutCache.get(pal.id);
  if (hit) return hit;
  const rgb = new Uint8Array(pal.colors.length * 3);
  const labs = pal.colors.map((h, i) => {
    const v = parseInt(h.slice(1), 16);
    rgb[i * 3] = (v >> 16) & 255;
    rgb[i * 3 + 1] = (v >> 8) & 255;
    rgb[i * 3 + 2] = v & 255;
    return toOklab(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]);
  });
  const lut = new Uint8Array(32768);
  for (let i = 0; i < 32768; i++) {
    const r = ((i >> 10) & 31) * 8.226;
    const g = ((i >> 5) & 31) * 8.226;
    const b = (i & 31) * 8.226;
    const [L, A, B] = toOklab(r, g, b);
    let best = 0;
    let bd = Infinity;
    for (let j = 0; j < labs.length; j++) {
      const dl = L - labs[j][0];
      const da = A - labs[j][1];
      const db = B - labs[j][2];
      const d = dl * dl + da * da + db * db;
      if (d < bd) {
        bd = d;
        best = j;
      }
    }
    lut[i] = best;
  }
  const res = { lut, rgb };
  lutCache.set(pal.id, res);
  return res;
}
