// Synchronous lookup of custom shader sources for the renderer, filled by
// the shader library (engine code never depends on storage). Each change
// bumps a version so cached materials are rebuilt.

export interface CustomShaderSource {
  code: string;
  version: number;
}

const sources = new Map<string, CustomShaderSource>();
let version = 0;

export function setCustomShader(id: string, code: string) {
  sources.set(id, { code, version: ++version });
}

export function removeCustomShader(id: string) {
  sources.delete(id);
}

export function customShader(id: string): CustomShaderSource | null {
  return (id && sources.get(id)) || null;
}
