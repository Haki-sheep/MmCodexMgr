import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { approvedSource, normalizeCoordinates, jsonDigest, fileDigest, assetPath, assertAssemblyFresh, assertUpdateFresh, prepareAssemblyImports } from './lib/core.js';
import { assertLayoutContract } from './lib/layout-contract.js';
import { prepareComponentLayout, assertComponentLayout } from './lib/component-layout.js';
import { assertResourceReview } from './lib/resource-review.js';
import { mergeLayoutDraft, draftSummary } from './lib/layout-draft.js';
import { validateLayout, assertSemanticLayout } from './lib/layout.js';
import { layoutUsage } from './lib/feedback.js';
import { expandLayoutInput } from './lib/layout-input.js';
import { runProcess, parseProcess } from './lib/process.js';
import { python, runtime, operation, saveTask, AssemblyValidationError } from './store.mjs';

export async function fuc(task, args, code, requestId) {
  const response = parseProcess(await runProcess(task.runtime.fuc, [...args, '--project', task.project, '--json', ...requestId ? ['--request-id', requestId] : []], {
    input: code, timeoutMs: 95000
  }));
  if (!response.ok) throw new Error(JSON.stringify(response.error));
  return response;
}

export async function preflight(task) {
  const status = await fuc(task, ['editor', 'status']);
  const data = status.data;
  if (!data?.online || data.preservation?.blocks_writes || data.activity?.is_playing || data.activity?.is_playing_or_will_change_playmode
    || data.activity?.is_compiling || data.status?.is_compiling || data.activity?.is_updating || data.status?.is_updating) {
    throw new Error('Unity离线 忙碌或受保护 等人类保存退出PrefabStage或编辑器空闲 不轮询 不另建Prefab');
  }
  const code = await fs.readFile(path.join(runtime, 'preflight.cs.txt'), 'utf8') + '\n' + await fs.readFile(path.join(runtime, 'font-glyphs.cs.txt'), 'utf8');
  const response = await fuc(task, ['editor', 'exec', '--code-file', '-'], code);
  const catalog = response.data.result;
  if (!catalog) throw new Error('字体目录未返回最终结果 保留原请求 不重复提交');
  if (catalog.prefab_stage_open) throw new Error('请先保存并退出当前 Prefab Stage 尚未提交收费拆图');
  const fonts = (catalog.fontDetails || catalog.fonts.map(file => ({ path: file }))).map(font => ({ ...font, id: 'font-' + jsonDigest([task.project, font.path]).slice(0, 16) }));
  task.fontCatalog = { project: task.project, fonts };
  await saveTask(task);
  return { ...catalog, fontCatalog: fonts };
}

export async function compile(task, input, patch = false) {
  if (!task.decomposition) throw new Error('先完成拆图');
  if (!patch && task.layoutDraft) throw new Error('已有草案 使用layout_patch仅修改字段 不重发整树');
  if (patch && !task.layoutDraft) throw new Error('尚无草案 首次用layout完整提交');
  const raw = patch ? mergeLayoutDraft(task.layoutDraft.input, input, task) : structuredClone(input);
  raw.prefabPath ||= task.prefabPath;
  if (raw.prefabPath !== task.prefabPath) {
    assetPath(raw.prefabPath, '.prefab');
    const pending = Object.values(task.operations || {}).find(op => ['unity', 'font'].includes(op.kind) && ['unknown', 'running'].includes(op.state));
    if (pending) throw new Error(`Unity原请求${pending.id}结果未知 不更换输出路径`);
    if (task.appliedAssembly) throw new Error('继续原Prefab 不改路径另建版本');
    for (const target of [task.prefabPath, raw.prefabPath]) {
      const file = path.join(task.project, target);
      if (existsSync(file) || existsSync(`${file}.meta`)) throw new Error(`Prefab目标已存在 不更换路径或覆盖 ${target}`);
    }
  }
  const sourceSize = approvedSource(task).size;
  if (raw.canvasSize && Math.abs(raw.canvasSize[0] / raw.canvasSize[1] / (sourceSize[0] / sourceSize[1]) - 1) > .01) throw new Error('画布宽高比与原图不一致');
  task.layoutDraft = { input: raw, state: 'pending' };
  task.delivery = null;
  await saveTask(task);
  try {
    const expanded = expandLayoutInput(task, raw);
    assertLayoutContract(expanded);
    assertResourceReview(task, expanded);
    const normalized = normalizeCoordinates(task, expanded);
    const prepared = prepareComponentLayout(task, normalized);
    const plan = validateLayout(task, prepared);
    assertComponentLayout(plan);
    const semantic = assertSemanticLayout(prepared);
    task.prefabPath = raw.prefabPath;
    task.layoutDraft = { input: normalizeCoordinates(task, raw), state: 'ready' };
    task.assembly = { input: prepared, plan, hash: jsonDigest(plan), project: task.project };
    await saveTask(task);
    return { state: 'ready', ...draftSummary({ ...task.layoutDraft, input: normalized }), layoutUsage: layoutUsage(plan), warnings: semantic.warnings, next: 'apply' };
  } catch (error) {
    task.layoutDraft.state = 'invalid';
    task.layoutDraft.error = error.message;
    await saveTask(task);
    throw new Error(`草案已保存 未写入Unity ${error.message} 仅layout_patch出错字段`);
  }
}

export async function apply(task) {
  if (task.layoutDraft?.state !== 'ready' || !task.assembly) throw new Error('布局草案未通过编译');
  const pending = Object.values(task.operations || {}).find(op => ['unity', 'font'].includes(op.kind) && ['unknown', 'running'].includes(op.state));
  if (pending) throw new Error(`Unity原请求${pending.id}结果未知 读取原receipt 不重放`);
  const plan = task.assembly.plan;
  assertResourceReview(task, task.assembly.input);
  validateLayout(task, task.assembly.input);
  assertSemanticLayout(task.assembly.input);
  const updating = Boolean(task.appliedAssembly);
  const changes = updating ? assertUpdateFresh(task, plan, task.project) : undefined;
  if (!updating) assertAssemblyFresh(task, plan, task.project);
  if (updating && !changes.length) return { state: 'unchanged', prefabPath: plan.prefabPath, next: '无需写入 保留用户手动调整' };
  const auditDirectory = path.join(task.directory, 'material-' + task.assembly.hash.slice(0, 12));
  const audit = await python(task, 'material_audit_cli.py', { plan, source: approvedSource(task).file, project: task.project, output: auditDirectory });
  if (!audit.backgroundComplete) throw new Error(`背景不完整 ${audit.uncoveredPixels}像素 ${audit.preview} 先接入干净背景 不写入Unity`);
  return operation(task, 'unity:' + task.assembly.hash, 'unity', async op => {
    const payload = { action: updating ? 'update' : 'assemble', plan: prepareAssemblyImports(plan, task.project, task.appliedAssembly?.plan),
      source: approvedSource(task).file, project: task.project, output: op.directory,
      ...updating ? { changes, baseline: task.appliedAssembly.assetState } : {} };
    const result = await python(task, 'assembly.py', payload, ['--cli', task.runtime.fuc, '--request-id', op.id], 360000);
    if (result.asset_state) task.appliedAssembly = { plan, assetState: result.asset_state };
    task.unityResult = result;
    task.preview = result.preview;
    task.previewHash = existsSync(result.preview || '') ? fileDigest(result.preview) : null;
    await saveTask(task);
    if (!result.passed) throw new AssemblyValidationError(`结构检查未通过 ${op.directory}/result.json`, result);
    return { prefabPath: plan.prefabPath, preview: result.preview, structurePassed: true, visualReviewRequired: true, layoutUsage: layoutUsage(plan) };
  });
}
