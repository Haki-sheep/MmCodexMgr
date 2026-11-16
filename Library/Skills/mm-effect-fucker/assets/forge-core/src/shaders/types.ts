// A custom particle shader in the library (see dialect.ts for the language).

export interface ShaderRecord {
  id: string;
  name: string;
  /** What it does, for the user and the agent. */
  description: string;
  /** Source in FX Forge's GLSL subset. */
  code: string;
  createdAt: number;
  updatedAt: number;
}

export const SHADER_ID = /^s_[a-z0-9]{4,24}$/;
export const newShaderId = () => `s_${Date.now().toString(36)}${Math.floor(Math.random() * 36 ** 4).toString(36).padStart(4, '0')}`;

/** For effect fields that hold a shader reference. */
export const sanitizeShaderRef = (v: unknown): string => (typeof v === 'string' && SHADER_ID.test(v) ? v : '');

const str = (v: unknown, d: string, max: number) => (typeof v === 'string' ? v.slice(0, max) : d);

export function sanitizeShader(raw: unknown): ShaderRecord | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  if (typeof r.id !== 'string' || !SHADER_ID.test(r.id) || typeof r.code !== 'string' || !r.code.trim()) return null;
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : Date.now());
  return {
    id: r.id,
    name: str(r.name, r.id, 60).trim() || r.id,
    description: str(r.description, '', 400),
    code: str(r.code, '', 20000),
    createdAt: n(r.createdAt),
    updatedAt: n(r.updatedAt),
  };
}
