import fs from 'node:fs/promises';
import path from 'node:path';
import { approvedSource, fileDigest, jsonDigest, makeId, normalizeManifest, regularFile, now } from './lib/core.js';
import { builtinDecompositionPlan, decompositionPlanSummary, decompositionMaterialRules, decompositionOutputBoundary, validateDecompositionPlan } from './lib/decomposition-plan.js';
import { decompositionRequest } from './lib/decomposition-model.js';
import { resourceContract } from './lib/resource-review.js';
import { materialRequest, materialResult } from './lib/materials.js';
import { imageSizeConfig, imageSizeAudit } from './lib/image-size.js';
import { readJson, writeJson, python, imageMetadata, operation, saveTask, credentials, runtime } from './store.mjs';
import { runProcess, parseProcess } from './lib/process.js';

export async function planDecomposition(task, input) {
  if (task.structure?.state !== 'ready') throw new Error('先structure明确元素归属 语义疑点须人类确认');
  if (task.regionRegistry && task.regionAnalyses?.state !== 'ready') throw new Error('登记区域后先完成submit及merge 不跳过未分析区域');
  if (task.decomposition || task.operations?.['decompose:' + task.approval.sha256]) throw new Error('已有拆图结果或执行记录 使用原操作 不重新规划收费');
  const source = approvedSource(task);
  if (source.size[0] * source.size[1] < 262144) throw new Error('图片小于262144像素 请人类提供大图 不自行放大');
  const model = input.model || task.models.decompose;
  const elements = input.elements || task.regionAnalyses?.elements?.filter(item => ['background', 'panel', 'icon', 'indicator', 'decoration'].includes(item.semanticRole)).map(item => ({
    id: item.id, name: item.name, semanticRole: item.semanticRole, box: item.sourceBox, requirements: item.requirements
  }));
  if (!Array.isArray(elements) || !elements.length) throw new Error('需要非空elements图片资源清单 TMP文案不列入');
  let plan;
  if (model === 'builtin') plan = builtinDecompositionPlan(task, input.prompt, elements, source.size, input.layerSize || '1K');
  else {
    plan = decompositionRequest(model, elements, task, source.size);
    plan = { ...plan, id: makeId('decomposition-plan'), prompt: input.prompt || '', resourceCatalog: plan.requests.map(resourceContract) };
    plan.hash = jsonDigest(plan);
  }
  task.decompositionPlan = plan;
  task.resourceCatalog = plan.resourceCatalog;
  await saveTask(task);
  return model === 'builtin' ? decompositionPlanSummary(plan) : { planId: plan.id, model, requestCount: plan.requestCount, coordinateOrigin: plan.coordinateOrigin };
}

export async function attachLayers(task, directory) {
  if (!task.resourceCatalog?.length) throw new Error('先plan生成资源目录 再接入已产生的manifest');
  const document = normalizeManifest(await readJson(path.join(directory, 'manifest.json')), directory);
  document.sourceSize = approvedSource(task).size;
  const overview = path.join(task.directory, makeId('layers') + '.jpg');
  const decomposition = { directory, sourceHash: task.approval.sha256, document };
  const support = await python(task, 'layer_support.py', { document, output: path.join(task.directory, 'visible-support.json') });
  document.layers = document.layers.map(layer => ({ ...layer, visibleSupport: support.layers.find(item => item.layerId === layer.id) }));
  const preview = await python(task, 'layer_overview.py', document, ['--output', overview]);
  task.decomposition = Object.assign(decomposition, preview, { overview });
  await saveTask(task);
  return task.decomposition;
}

export async function decompose(task, input) {
  const plan = task.decompositionPlan;
  if (!plan || input.planId !== plan.id || plan.sourceHash !== task.approval.sha256) throw new Error('planId须引用当前已保存拆图计划');
  if (task.decomposition) throw new Error('已有拆图结果 不重复提交');
  if (plan.model === 'builtin') validateDecompositionPlan(plan);
  await credentials(task);
  return operation(task, 'decompose:' + task.approval.sha256, 'decompose', async op => {
    const file = path.join(op.directory, 'decomposition-plan.json');
    await writeJson(file, plan);
    const args = ['-B', '-X', 'utf8', path.join(runtime, 'scripts/dxx_image.py'), 'Decompose', '--file', approvedSource(task).file,
      '--out-dir', op.directory, '--decompose-model', plan.model, '--size', plan.layerSize || '1K'];
    if (plan.model === 'builtin') args.push('--batch-plan-file', file);
    else args.push('--elements-file', file, '--prompt', [decompositionMaterialRules, plan.prompt, decompositionOutputBoundary].filter(Boolean).join('\n\n'));
    parseProcess(await runProcess(task.runtime.python, args, { timeoutMs: 1900000 * plan.requestCount }));
    return attachLayers(task, op.directory);
  });
}

export async function importMaterial(task, input) {
  regularFile(input.image_path);
  const sourceSize = approvedSource(task).size;
  const { context } = materialRequest(task, input, sourceSize);
  let file = path.resolve(input.image_path);
  let derivation;
  if (input.crop_box || input.clear_boxes || input.chroma_key) {
    if (input.material_kind === 'background') throw new Error('裁剪不能补齐干净背景');
    const sourceHash = fileDigest(file);
    const output = path.join(task.directory, makeId('extract') + '.png');
    const auditOutput = path.join(task.directory, makeId('extract-source') + '.png');
    const result = await python(task, 'material_extract.py', { source: file, output, auditOutput,
      cropBox: input.crop_box, clearBoxes: input.clear_boxes, chromaKey: input.chroma_key });
    if (fileDigest(file) !== sourceHash) throw new Error('裁剪期间源图变化');
    derivation = { ...result, source: file, sourceHash, sourceOverlay: auditOutput, sourceOverlaySha256: fileDigest(auditOutput), cropBox: input.crop_box };
    file = output;
  }
  const metadata = await imageMetadata(task, file);
  Object.assign(task, materialResult(task, [{ id: makeId('material'), file, name: input.name, sha256: fileDigest(file), createdAt: now(), ...metadata,
    ...derivation ? { origin: 'local_extract', derivation } : {} }], context));
  await saveTask(task);
  return task.materials.at(-1);
}

export async function planSupplement(task, input) {
  if (!input.prompt?.trim()) throw new Error('补图需要具体prompt');
  const automatic = input.material_kind === 'background' && !Object.values(task.supplementPlans || {}).some(plan => plan.automatic);
  if (!automatic && !input.authorization?.trim()) throw new Error('新增收费补图须填写本次人类授权原话 不复用旧授权');
  if (!automatic && Object.values(task.supplementPlans || {}).some(plan => plan.authorization === input.authorization)) throw new Error('该授权已用于另一补图计划 请引用原计划或等待新的明确授权');
  const model = input.model || task.models.generate;
  if (model !== 'image2.5') throw new Error('独立补图入口仅支持已验证image2.5 不自动切模型');
  const size = imageSizeConfig(model, { purpose: 'material', material_kind: input.material_kind, image_size: input.image_size }, approvedSource(task).size);
  const material = materialRequest(task, input, approvedSource(task).size, size.requestedSize);
  const request = { function: 'image2.5生图', prompt: material.prompt, images: material.images,
    config: { ...size.config, image25Background: input.material_kind === 'background' ? 'opaque' : 'transparent', image25OutputFormat: 'png' } };
  const signature = jsonDigest(request);
  if (Object.values(task.supplementPlans || {}).some(plan => plan.signature === signature)) throw new Error('相同收费请求已有计划 请使用原planId 不重复提交');
  const plan = { id: makeId('supplement-plan'), signature, automatic, authorization: input.authorization, request,
    context: { ...material.context, requestedSize: size.requestedSize } };
  task.supplementPlans = { ...task.supplementPlans, [plan.id]: plan };
  await saveTask(task);
  return { planId: plan.id, requestCount: 1, model, automatic, requestedSize: size.requestedSize, kind: input.material_kind };
}

export async function supplement(task, input) {
  const plan = task.supplementPlans?.[input.planId];
  if (!plan || plan.context.sourceHash !== task.approval.sha256) throw new Error('补图planId无效或属于旧定图');
  await credentials(task);
  return operation(task, 'supplement:' + plan.signature, 'supplement', async op => {
    await writeJson(path.join(op.directory, 'request-input.json'), plan.request);
    const result = await python(task, 'scripts/dxx_image.py', plan.request, ['Run', '--request-file', '-', '--out-dir', op.directory], 1900000);
    if (!Array.isArray(result.files) || result.files.length !== 1) throw new Error('补图未返回唯一素材 保留files.json不猜选');
    const file = path.resolve(result.files[0]);
    const metadata = await imageMetadata(task, file);
    Object.assign(task, materialResult(task, [{ id: makeId('material'), file, sha256: fileDigest(file), ...metadata,
      sizeAudit: imageSizeAudit(plan.context.requestedSize, metadata.size) }], plan.context));
    await saveTask(task);
    return task.materials.at(-1);
  });
}
