import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeId, now, approvedSource, fileDigest, jsonDigest } from './lib/core.js';
import { runProcess, parseProcess } from './lib/process.js';
import { assertRejectedPreflight } from './lib/preflight-rejection.js';

export const runtime = fileURLToPath(new URL('./lib/runtime/', import.meta.url));
export const defaultFuc = fileURLToPath(new URL('../../mm-fake-unity-fucker/runtime/windows-x64/fuc.exe', import.meta.url));
export const readJson = async file => JSON.parse((await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, ''));

export async function writeJson(file, value) {
  const pending = file + '.pending';
  await fs.writeFile(pending, JSON.stringify(value, null, 2), 'utf8');
  await fs.rename(pending, file);
}

export function exact(value, allowed, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label}须为对象`);
  const unknown = Object.keys(value).filter(key => !allowed.includes(key));
  if (unknown.length) throw new Error(`${label}不支持字段 ${unknown.join(' ')}`);
}

export async function python(task, script, input, args = [], timeoutMs = 30000) {
  return parseProcess(await runProcess(task.runtime.python, ['-B', '-X', 'utf8', path.join(runtime, script), ...args], {
    input: input === undefined ? undefined : JSON.stringify(input), timeoutMs
  }));
}

export async function imageMetadata(task, file) {
  const code = 'import sys,json;from PIL import Image;im=Image.open(sys.argv[1]).convert("RGBA");a=im.getchannel("A");print(json.dumps({"size":list(im.size),"fullyOpaque":a.getextrema()[0]==255,"hasVisiblePixels":a.getbbox() is not None}))';
  return parseProcess(await runProcess(task.runtime.python, ['-B', '-X', 'utf8', '-c', code, file], { timeoutMs: 15000 }));
}

export async function saveTask(task) {
  task.updatedAt = now();
  await writeJson(path.join(task.directory, 'task.json'), task);
}

export function adapter(task) {
  return {
    options: { pythonPath: task.runtime.python },
    sourceDimensions: async () => approvedSource(task).size,
    patchTask: async (id, change) => {
      if (id !== task.id) throw new Error('任务ID不一致');
      Object.assign(task, typeof change === 'function' ? change(task) : change);
      await saveTask(task);
      return task;
    }
  };
}

export async function withTask(directory, callback) {
  if (!path.isAbsolute(directory || '')) throw new Error('task须为绝对任务目录 不猜目录');
  const lockFile = path.join(directory, '.execution-lock');
  let lock;
  try { lock = await fs.open(lockFile, 'wx'); }
  catch (error) { throw new Error(`任务已锁定或目录无效 ${directory} ${error.code} 不删除运行中锁 不重复提交`); }
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, startedAt: now() }));
    const task = await readJson(path.join(directory, 'task.json'));
    if (path.resolve(task.directory) !== path.resolve(directory)) throw new Error('任务被移动 请核对原目录 不复用旧路径');
    approvedSource(task);
    return await callback(task);
  } finally {
    await lock.close();
    await fs.unlink(lockFile);
  }
}

export class AssemblyValidationError extends Error {
  constructor(message, result) {
    super(message);
    this.result = result;
  }
}

export async function operation(task, key, kind, execute) {
  const previous = task.operations?.[key];
  if (previous && previous.state !== 'rejected_before_write') throw new Error(`操作已执行或结果未知 ${previous.id} ${previous.state} 使用原目录 ${previous.directory} 不重放`);
  if (previous) task.operations[key + ':rejected:' + previous.id] = previous;
  const id = makeId(kind);
  const directory = path.join(task.directory, id);
  await fs.mkdir(directory);
  const op = { id, kind, directory, state: 'running', startedAt: now() };
  task.operations = { ...task.operations, [key]: op };
  await saveTask(task);
  try {
    const result = await execute(op);
    op.state = 'completed';
    op.endedAt = now();
    op.wallSeconds = (Date.parse(op.endedAt) - Date.parse(op.startedAt)) / 1000;
    await saveTask(task);
    return result;
  } catch (error) {
    const appliedFile = path.join(directory, 'applied.json');
    const resultFile = path.join(directory, 'result.json');
    let failedValidation = false;
    if (kind === 'unity' && error instanceof AssemblyValidationError && existsSync(appliedFile) && existsSync(resultFile)) {
      try {
        const applied = await readJson(appliedFile);
        const result = await readJson(resultFile);
        const state = result.asset_state;
        failedValidation = result.passed === false && result.prefab_created === true
          && result.receiptDirectory === directory && state?.path === task.prefabPath
          && typeof state.guid === 'string' && /^[a-f0-9]{32}$/i.test(state.guid)
          && typeof state.sha256 === 'string' && /^[a-f0-9]{64}$/i.test(state.sha256)
          && Array.isArray(state.nodeBindings) && Array.isArray(state.dependencies)
          && Boolean(applied?.assetState && task.appliedAssembly?.assetState)
          && jsonDigest(result) === jsonDigest(error.result)
          && jsonDigest(state) === jsonDigest(applied.assetState)
          && jsonDigest(state) === jsonDigest(task.appliedAssembly.assetState);
      } catch (proofError) {
        op.classificationError = proofError.message;
      }
    }
    if (!failedValidation && existsSync(appliedFile)) task.appliedAssembly = await readJson(appliedFile);
    const remoteSubmitted = async dir => {
      for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        if (entry.name === 'submission-started.json' || entry.name === 'task-id.txt' || entry.name === 'layer-task-id.txt') return true;
        if (entry.isDirectory() && await remoteSubmitted(path.join(dir, entry.name))) return true;
      }
      return false;
    };
    op.state = failedValidation ? 'failed_validation' : kind === 'unity' || kind === 'font' || await remoteSubmitted(directory) ? 'unknown' : 'failed_before_submission';
    if (kind === 'unity' && !existsSync(appliedFile) && !existsSync(path.join(directory, 'result.json')) && existsSync(path.join(directory, 'receipts.json'))) {
      try {
        const requestId = assertRejectedPreflight(op, await readJson(path.join(directory, 'receipts.json')));
        op.state = 'rejected_before_write';
        op.resolution = { requestId, at: now(), source: 'terminal_preflight_receipt' };
      } catch (proofError) {
        op.classificationError = proofError.message;
      }
    }
    op.error = error.message;
    op.endedAt = now();
    op.wallSeconds = (Date.parse(op.endedAt) - Date.parse(op.startedAt)) / 1000;
    await saveTask(task);
    throw new Error(`${error.message}\n操作${op.id} 状态${op.state} 证据${directory} 成功产物保留 不自动重提`);
  }
}

export async function credentials(task) {
  const code = 'import sys,json;sys.path.insert(0,sys.argv[1]);from dxx_image import Client;c=Client();print(json.dumps({"configured":bool(c.key),"apiBase":c.base}))';
  return parseProcess(await runProcess(task.runtime.python, ['-B', '-X', 'utf8', '-c', code, path.join(runtime, 'scripts')], { timeoutMs: 15000 }));
}

export function snapshot(task) {
  return { taskId: task.id, directory: task.directory, project: task.project, prefabPath: task.prefabPath,
    source: approvedSource(task), structure: task.structure, models: task.models,
    resourceCatalog: task.resourceCatalog, resourceReview: task.resourceReview,
    decomposition: task.decomposition, materials: task.materials, fontCatalog: task.fontCatalog,
    layoutDraft: task.layoutDraft, applied: Boolean(task.appliedAssembly), preview: task.preview,
    operations: task.operations, supplementPlans: task.supplementPlans, delivery: task.delivery };
}

export function checkedPreview(task) {
  if (!task.unityResult?.passed || !task.preview || !existsSync(task.preview)) throw new Error('没有通过结构检查的真实Unity截图 不得报告完成');
  return fileDigest(task.preview);
}
