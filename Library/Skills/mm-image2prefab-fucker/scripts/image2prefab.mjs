import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';
import { approvedSource, assetPath, fileDigest, jsonDigest, makeId, now } from './lib/core.js';
import { inspectMaterials, splitMaterials } from './lib/material-inspection.js';
import { acceptMaterial } from './lib/materials.js';
import { bindResources } from './lib/resource-review.js';
import { regionOperation } from './lib/regions.js';
import { qualityPolicy, qualityReview } from './lib/workflow-policy.js';
import { parseProcess, runProcess } from './lib/process.js';
import { readJson, writeJson, exact, defaultFuc, imageMetadata, saveTask, withTask, adapter, snapshot, checkedPreview } from './store.mjs';
import { planDecomposition, decompose, attachLayers, importMaterial, planSupplement, supplement } from './remote.mjs';
import { preflight, compile, apply } from './unity.mjs';
import { resolveRejectedPreflight } from './lib/preflight-rejection.js';

export const contracts = {
  doctor: ['python', 'fuc'],
  init: ['project', 'source', 'directory', 'prefabPath', 'python', 'fuc', 'decomposeModel', 'generateModel'],
  get: [],
  structure: ['description', 'uncertainties', 'confirmation'],
  region: ['action', 'regions', 'region_id', 'question', 'crop_box', 'scale', 'grid', 'analysis'],
  plan: ['model', 'elements', 'prompt', 'layerSize'],
  decompose: ['planId'],
  layers_import: ['directory'],
  material_import: ['image_path', 'name', 'material_kind', 'semantic_role', 'crop_box', 'clear_boxes', 'chroma_key'],
  material_inspect: ['items'], material_split: ['items'], material_accept: ['items'], material_bind: ['bindings', 'unused_layers'],
  supplement_plan: ['material_kind', 'semantic_role', 'prompt', 'model', 'authorization', 'image_size', 'images'],
  supplement: ['planId'],
  preflight: [],
  layout: ['name', 'canvasSize', 'coordinateSize', 'rootLayout', 'nodes', 'components', 'replacements', 'adaptation', 'prefabPath', 'font', 'fontId'],
  layout_patch: ['name', 'canvasSize', 'coordinateSize', 'rootLayout', 'nodes', 'components', 'replacements', 'adaptation', 'prefabPath', 'font', 'fontId', 'remove'],
  apply: [], resolve_preflight: ['operationId', 'authorization'], report: ['scores', 'deductions', 'functionalIssues']
};

async function doctor(input) {
  if (!input.python || !path.isAbsolute(input.python) || !existsSync(input.python)) throw new Error('python须为真实绝对路径 可通过load_workspace_dependencies获取 不静默换解释器');
  const code = 'import json,sys;from PIL import Image;print(json.dumps({"version":sys.version,"pillow":Image.__version__}))';
  const python = parseProcess(await runProcess(input.python, ['-B', '-X', 'utf8', '-c', code], { timeoutMs: 15000 }));
  const fuc = input.fuc || defaultFuc;
  if (!path.isAbsolute(fuc) || !existsSync(fuc)) throw new Error(`缺少FakeUnityCLI ${fuc} 安装mm-fake-unity-fucker或显式传fuc`);
  const version = await runProcess(fuc, ['--version'], { timeoutMs: 15000 });
  if (version.code !== 0) parseProcess(version);
  return { ready: true, node: process.version, python, fuc, fucVersion: version.stdout.trim(), dshRequired: false, charged: false, unityWritten: false };
}

async function initialize(input) {
  await doctor(input);
  if (!path.isAbsolute(input.project || '') || !existsSync(path.join(input.project, 'ProjectSettings/ProjectVersion.txt'))) throw new Error('project须为有效Unity工程绝对路径');
  if (!path.isAbsolute(input.source || '') || !existsSync(input.source)) throw new Error('source须为真实图片绝对路径');
  if (input.decomposeModel && !['builtin', 'image2.5'].includes(input.decomposeModel)) throw new Error('decomposeModel仅builtin或image2.5');
  if (input.generateModel && input.generateModel !== 'image2.5') throw new Error('generateModel仅支持已验证image2.5');
  const task = { schemaVersion: 1, workflowContractVersion: 2, id: makeId('ui'), project: path.resolve(input.project), createdAt: now(),
    runtime: { python: input.python, fuc: input.fuc || defaultFuc }, models: { decompose: input.decomposeModel || 'builtin', generate: input.generateModel || 'image2.5' }, operations: {}, materials: [] };
  const metadata = await imageMetadata(task, input.source);
  if (metadata.size[0] * metadata.size[1] < 262144) throw new Error(`定图${metadata.size.join('x')}低于262144像素 请人类给大图 不自行放大`);
  task.directory = input.directory || path.join(task.project, 'outputs/image2prefab', task.id);
  if (!path.isAbsolute(task.directory)) throw new Error('directory须为绝对路径');
  task.prefabPath = assetPath(input.prefabPath || `Assets/UI/Generated/${task.id}/UIRoot.prefab`, '.prefab');
  if (existsSync(path.join(task.project, task.prefabPath))) throw new Error('新任务目标Prefab已存在 请用原任务patch 不覆盖或另建版本绕过');
  await fs.mkdir(path.dirname(task.directory), { recursive: true });
  await fs.mkdir(task.directory, { recursive: false });
  const file = path.join(task.directory, 'source' + path.extname(input.source).toLowerCase());
  await fs.copyFile(input.source, file);
  const source = { id: 'source', file, sha256: fileDigest(file), ...metadata, width: metadata.size[0], height: metadata.size[1] };
  task.candidates = [source];
  task.approval = { candidateId: source.id, sha256: source.sha256, at: now(), by: 'user' };
  await saveTask(task);
  return snapshot(task);
}

export async function dispatch(request) {
  exact(request, ['command', 'task', 'input'], 'request');
  const { command, input = {} } = request;
  if (!Object.hasOwn(contracts, command)) throw new Error(`未知command ${command} 运行--help读取固定接口`);
  exact(input, contracts[command], command);
  if (command === 'doctor') return doctor(input);
  if (command === 'init') return initialize(input);
  return withTask(request.task, async task => {
    if (command === 'get') return snapshot(task);
    if (command === 'structure') {
      if (task.decompositionPlan) throw new Error('已进入拆图规划 不重新改变已确认语义');
      if (!input.description?.trim() || !Array.isArray(input.uncertainties) || input.uncertainties.some(item => typeof item !== 'string' || !item.trim())) throw new Error('structure需要description和uncertainties数组 无疑点填[]');
      task.structure = { ...input, sourceHash: task.approval.sha256, state: input.uncertainties.length && !input.confirmation?.trim() ? 'needs_clarification' : 'ready' };
      await saveTask(task);
      return task.structure;
    }
    if (command === 'region') {
      const actions = { register: ['action', 'regions'], get: ['action'], view: ['action', 'region_id', 'crop_box', 'scale', 'grid', 'question'], submit: ['action', 'analysis'], merge: ['action'] };
      if (!actions[input.action]) throw new Error('region.action仅支持register get view submit merge');
      exact(input, actions[input.action], 'region.' + input.action);
      return regionOperation(adapter(task), task, input);
    }
    if (command === 'plan') return planDecomposition(task, input);
    if (command === 'decompose') return decompose(task, input);
    if (command === 'layers_import') {
      if (task.decomposition) throw new Error('拆层已接入 不覆盖原目录');
      if (!path.isAbsolute(input.directory || '')) throw new Error('directory须为已有manifest所在绝对目录');
      return attachLayers(task, input.directory);
    }
    if (command === 'material_import') return importMaterial(task, input);
    if (command === 'material_inspect') return inspectMaterials(adapter(task), task, input);
    if (command === 'material_split') return splitMaterials(adapter(task), task, input);
    if (command === 'material_accept') {
      if (!Array.isArray(input.items) || !input.items.length) throw new Error('items须为非空验收参数数组');
      const accepted = input.items.map(item => {
        exact(item, ['review_id', 'material_id', 'expected_size', 'reason', 'crop_review'], 'material_accept.items');
        return acceptMaterial(task, item);
      });
      const ids = new Set(accepted.map(item => item.id));
      task.materials = [...task.materials.filter(item => !ids.has(item.id)), ...accepted];
      await saveTask(task);
      return accepted;
    }
    if (command === 'material_bind') {
      task.resourceReview = bindResources(task, input);
      await saveTask(task);
      return task.resourceReview;
    }
    if (command === 'supplement_plan') return planSupplement(task, input);
    if (command === 'supplement') return supplement(task, input);
    if (command === 'preflight') return preflight(task);
    if (command === 'layout') return compile(task, input);
    if (command === 'layout_patch') return compile(task, input, true);
    if (command === 'apply') return apply(task);
    if (command === 'resolve_preflight') {
      const result = await resolveRejectedPreflight(task, input);
      await saveTask(task);
      return result;
    }
    if (command === 'report') {
      const previewHash = checkedPreview(task);
      if (previewHash !== task.previewHash || task.layoutDraft?.state !== 'ready' || task.assembly?.hash !== jsonDigest(task.appliedAssembly?.plan)) throw new Error('计划或截图已变化 不能沿用旧验收');
      task.delivery = { ...qualityReview(input), prefabPath: task.prefabPath, preview: task.preview, previewHash,
        sourceHash: task.approval.sha256, at: now(), elapsedSeconds: (Date.now() - Date.parse(task.createdAt)) / 1000,
        operations: Object.values(task.operations).map(op => ({ kind: op.kind, state: op.state, wallSeconds: op.wallSeconds })) };
      await saveTask(task);
      return task.delivery;
    }
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === '--help') {
    console.log(JSON.stringify({ usage: 'node image2prefab.mjs --request-file ABSOLUTE_JSON_OR_-', request: { command: '固定命令名', task: '绝对任务目录 init和doctor不用', input: {} },
      contracts, qualityPolicy, reference: fileURLToPath(new URL('../references/contracts.md', import.meta.url)) }, null, 2));
    return;
  }
  if (args.length !== 2 || args[0] !== '--request-file') throw new Error('仅支持--request-file JSON路径或- 不猜参数');
  let request;
  if (args[1] === '-') {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    request = JSON.parse(Buffer.concat(chunks).toString('utf8').replace(/^\uFEFF/, ''));
  } else request = await readJson(args[1]);
  console.log(JSON.stringify({ ok: true, result: await dispatch(request) }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(JSON.stringify({ ok: false, error: error.message })); process.exitCode = 1; });
}
