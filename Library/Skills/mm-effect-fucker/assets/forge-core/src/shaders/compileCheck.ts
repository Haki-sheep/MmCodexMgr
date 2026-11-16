// Checks a custom shader: the subset rules, then a real WebGL compile of the
// preview's particle material with it built in. Errors point at lines of the
// author's code. The HLSL side is checked by Unity (verify in Unity).

import * as THREE from 'three';
import { offscreen3D } from '../render/OffscreenRenderer3D';
import { particleMaterial } from '../engine/preview3d/particleMaterial';
import { BILLBOARD_VERT } from '../engine/preview3d/shaders';
import { checkSource } from './dialect';

export interface CompileResult {
  ok: boolean;
  errors: string[];
}

/** WebGL logs look like "ERROR: 0:7: 'foo' : undeclared identifier"; keep the useful part. */
function tidy(log: string): string[] {
  return log
    .split(/\r?\n/)
    .map((l) => l.replace(/^ERROR:\s*\d+:(\d+):\s*/, '第 $1 行：').trim())
    // drop warnings, blank lines and the closing "compilation errors" summary
    .filter((l) => l && !l.startsWith('WARNING') && !/compilation errors|^第 \d+ 行：\s*$/.test(l))
    .slice(0, 12);
}

export function compileCheck(code: string): CompileResult {
  const pre = checkSource(code).errors;
  if (pre.length) return { ok: false, errors: pre };
  const renderer = offscreen3D.webgl();
  const mat = particleMaterial(BILLBOARD_VERT, code);
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat));
  const cam = new THREE.PerspectiveCamera();
  const errors: string[] = [];
  const prev = renderer.debug.onShaderError;
  renderer.debug.onShaderError = (gl, _program, _vs, fs) => {
    errors.push(...tidy(gl.getShaderInfoLog(fs) ?? 'Compile failed.'));
  };
  try {
    renderer.compile(scene, cam);
    // compile() only queues the program on some drivers: drawing once makes sure it is linked
    renderer.render(scene, cam);
  } finally {
    renderer.debug.onShaderError = prev;
    mat.dispose();
  }
  return { ok: errors.length === 0, errors };
}
