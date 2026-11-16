// Custom particle shaders are written once, in a small GLSL subset, as
//
//   vec4 fxCustom(vec2 uv, vec4 tint, float life, float rnd, float age) { ... }
//
// uv: texture coordinates (scrolled / flipbook frame applied), tint: the
// particle colour in linear space with its alpha, life: 0..1 over the
// particle's life, rnd: a stable 0..1 random per particle, age: seconds.
// Available: fxTex(uv) (the layer's texture), fxNoise(uv) (tileable grey
// noise, .r), fxTime (seconds: the preview's play time, Unity's _Time.y),
// and the usual GLSL maths. Return linear rgb and alpha.
//
// This module checks the source and translates it to HLSL for Unity.

export const SIGNATURE = 'vec4 fxCustom(vec2 uv, vec4 tint, float life, float rnd, float age)';

export const TEMPLATE = `// 颜色和透明度都在线性空间里。可以用 fxTex(uv)、fxNoise(uv)、life、rnd、age。
vec4 fxCustom(vec2 uv, vec4 tint, float life, float rnd, float age) {
  vec4 t = fxTex(uv);
  // 示例：贴图沿 V 方向闪烁的能量条纹
  float bands = 0.5 + 0.5 * sin(uv.y * 24.0 - age * 6.0 + rnd * 6.2831);
  return vec4(tint.rgb * t.rgb * (0.6 + 0.8 * bands), tint.a * t.a);
}
`;

/** Words the subset does not allow, with the reason shown to the author. */
const FORBIDDEN: [RegExp, string][] = [
  [/\b(uniform|varying|attribute|in|out|inout|precision|layout)\b/, 'declares inputs or qualifiers; only the fxCustom function and helper functions are allowed'],
  [/\bgl_\w+/, 'uses gl_ built-ins'],
  [/\b(texture2D|texture|textureLod|sampler2D|samplerCube)\b/, 'samples textures directly; use fxTex(uv) or fxNoise(uv)'],
  [/\bmat[234]\b/, 'uses matrices (their multiplication differs between GLSL and HLSL); write the maths with vectors'],
  [/\b(lessThan|greaterThan|lessThanEqual|greaterThanEqual|equal|notEqual|any|all|not)\s*\(/, 'uses vector comparison functions'],
  [/#\s*\w+/, 'uses preprocessor directives'],
  [/\b(discard)\b/, 'uses discard; return alpha 0 instead'],
];

export interface DialectCheck {
  errors: string[];
}

export function checkSource(src: string): DialectCheck {
  const errors: string[] = [];
  const code = stripComments(src);
  if (!/\bvec4\s+fxCustom\s*\(\s*vec2\s+\w+\s*,\s*vec4\s+\w+\s*,\s*float\s+\w+\s*,\s*float\s+\w+\s*,\s*float\s+\w+\s*\)/.test(code)) errors.push(`缺少函数 ${SIGNATURE}（参数类型和顺序要一样）。`);
  for (const [re, why] of FORBIDDEN) {
    const m = re.exec(code);
    if (m) errors.push(`不能用「${m[0].trim()}」：${why}。`);
  }
  if (src.length > 20000) errors.push('代码太长（最多 20000 个字符）。');
  return { errors };
}

export function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, '');
}

const RENAME: [RegExp, string][] = [
  [/\bvec([234])\b/g, 'float$1'],
  [/\bivec([234])\b/g, 'int$1'],
  [/\bbvec([234])\b/g, 'bool$1'],
  [/\bmix\s*\(/g, 'lerp('],
  [/\bfract\s*\(/g, 'frac('],
  [/\bmod\s*\(/g, 'fxMod('],
  [/\batan\s*\(/g, 'fxAtan('],
  [/\binversesqrt\s*\(/g, 'rsqrt('],
  [/\bdFdx\s*\(/g, 'ddx('],
  [/\bdFdy\s*\(/g, 'ddy('],
];

/**
 * GLSL subset -> HLSL. Besides renames, single-argument vector constructors
 * (vec3(0.5), vec3(v4)) become casts, which HLSL needs.
 */
export function toHlsl(src: string): string {
  let s = stripComments(src);
  for (const [re, to] of RENAME) s = s.replace(re, to);
  return castSingleArgConstructors(s);
}

function castSingleArgConstructors(s: string): string {
  const re = /\b((?:float|int|bool)[234])\s*\(/g;
  let out = '';
  let last = 0;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    const open = m.index + m[0].length - 1;
    const close = matching(s, open);
    if (close < 0) continue;
    const inner = s.slice(open + 1, close);
    if (topLevelCommas(inner) > 0) continue;
    out += `${s.slice(last, m.index)}((${m[1]})(${castSingleArgConstructors(inner)}))`;
    last = close + 1;
    re.lastIndex = close + 1;
  }
  return out + s.slice(last);
}

function matching(s: string, open: number): number {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')' && --depth === 0) return i;
  }
  return -1;
}

function topLevelCommas(s: string): number {
  let depth = 0;
  let n = 0;
  for (const ch of s) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) n++;
  }
  return n;
}

/** Helpers both sides get before the author's code. */
export const GLSL_PRELUDE = `
uniform float fxTime;
vec4 fxTex(vec2 uv) { return texture2D(uMap, uv); }
vec4 fxNoise(vec2 uv) { return texture2D(uNoise, uv); }
`;

export const HLSL_PRELUDE = `
#define fxTime (_Time.y)
float4 fxTex(float2 uv) { return tex2D(_MainTex, uv); }
float4 fxNoise(float2 uv) { return tex2D(_NoiseTex, uv); }
float fxMod(float x, float y) { return x - y * floor(x / y); }
float2 fxMod(float2 x, float y) { return x - y * floor(x / y); }
float3 fxMod(float3 x, float y) { return x - y * floor(x / y); }
float4 fxMod(float4 x, float y) { return x - y * floor(x / y); }
float2 fxMod(float2 x, float2 y) { return x - y * floor(x / y); }
float3 fxMod(float3 x, float3 y) { return x - y * floor(x / y); }
float4 fxMod(float4 x, float4 y) { return x - y * floor(x / y); }
float fxAtan(float y, float x) { return atan2(y, x); }
float fxAtan(float x) { return atan(x); }
`;
