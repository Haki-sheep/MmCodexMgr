// Unity shader files for custom shaders: FXForge/Particle with the author's
// fxCustom function (translated to HLSL) built in, named FXForge/Custom/<id>.

import { HLSL_PRELUDE, toHlsl } from '../shaders/dialect';
import type { ShaderRecord } from '../shaders/types';

const MARKER = '// FX_CUSTOM_CODE';

export const customShaderName = (id: string) => `FXForge/Custom/${id}`;
export const customShaderFile = (id: string) => `FXForge/Shaders/FxForgeCustom_${id}.shader`;

/** `template` is the text of FxForgeParticle.shader. */
export function unityCustomShader(template: string, s: ShaderRecord): string {
  const at = template.indexOf(MARKER);
  if (at < 0 || !template.includes('Shader "FXForge/Particle"')) throw new Error('FxForgeParticle.shader has no custom-code marker.');
  const lineEnd = template.indexOf('\n', at);
  const code = `#define FX_CUSTOM\n${HLSL_PRELUDE}\n            // ${s.name.replace(/[\r\n]/g, ' ')}: translated from FX Forge's GLSL subset\n${toHlsl(s.code)}\n`;
  const header = `// FX Forge custom shader "${s.name.replace(/[\r\n"]/g, ' ')}" (${s.id}), generated from FXForge/Particle.\n// Edit it in FX Forge (素材 › 自定义着色器) and export again; changes made here are overwritten.\n`;
  return header + template.slice(0, at).replace('Shader "FXForge/Particle"', `Shader "${customShaderName(s.id)}"`) + code + template.slice(lineEnd + 1);
}
