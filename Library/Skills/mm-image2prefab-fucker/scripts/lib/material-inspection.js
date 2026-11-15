import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { approvedSource, assertInside, fileDigest, jsonDigest, makeId, now, regularFile } from './core.js';
import { MaterialError, materialReviewItems, materialResult } from './materials.js';
import { parseProcess, runProcess } from './process.js';

const runtime = fileURLToPath(new URL('./runtime/material_inspect.py', import.meta.url));

function sourceReference(task, item) {
  if (Boolean(item.layer_id) === Boolean(item.material_id)) throw new Error('inspect每项须且只能提供layer_id或material_id 不猜文件路径');
  const layer = item.layer_id && task.decomposition?.document.layers.find(layer => layer.id === item.layer_id);
  const material = item.material_id && task.materials?.find(material => material.id === item.material_id);
  if (!layer && !material) throw new Error(`inspect目标不存在 ${item.layer_id || item.material_id}`);
  if (layer?.role === 'base' && !item.crop_box) throw new Error('原始base仅支持crop_box局部查看 不能作为透明图层分割来源');
  if (material && material.sourceHash !== task.approval.sha256) throw new Error('素材所属定图已经变化');
  const file = regularFile((layer || material).file);
  const sha256 = fileDigest(file);
  if (material && sha256 !== material.sha256) throw new Error('查看素材内容已经变化');
  return { file, sha256, layerId: layer?.id || material?.sourceLayerId,
    placement: layer?.placement || material?.referencePlacement || null };
}

export async function inspectMaterials(service, task, args) {
  approvedSource(task);
  if (!Array.isArray(args.items) || !args.items.length) throw new Error('inspect须提供非空items 可批量查看多个layer_id或material_id');
  const requests = args.items.map(item => ({ item, source: sourceReference(task, item) }));
  const inspections = [];
  for (const { item, source } of requests) {
    const signature = jsonDigest({ file: source.file, sha256: source.sha256, cropBox: item.crop_box, scale: item.scale });
    const previous = Object.values(task.materialInspections || {}).filter(value => value.sourceHash === task.approval.sha256 && value.source.file === source.file && value.source.sha256 === source.sha256);
    const cached = previous.find(value => value.signature === signature);
    if (cached) { inspections.push(cached); continue; }
    if (task.workflowContractVersion === 2 && item.crop_box && (!item.question?.trim() || previous.some(value => value.question))) throw new Error('局部素材查看须有明确question 每份素材最多一次定向复查 仍无法判断则上报 不为几像素反复放大');
    const id = makeId('inspection');
    const directory = assertInside(task.directory, path.join(task.directory, id));
    await mkdir(directory);
    const result = parseProcess(await runProcess(service.options.pythonPath, ['-B', '-X', 'utf8', runtime], {
      input: JSON.stringify({ action: 'inspect', source: source.file, output: directory, cropBox: item.crop_box, scale: item.scale }), timeoutMs: 30000 }));
    if (fileDigest(source.file) !== source.sha256) throw new Error('查看期间源图变化 停止 不使用旧坐标');
    inspections.push({ id, source, sourceHash: task.approval.sha256, signature, question: item.question, ...result, at: now() });
  }
  await service.patchTask(task.id, current => ({ materialInspections: { ...current.materialInspections, ...Object.fromEntries(inspections.map(item => [item.id, item])) } }));
  return { taskId: task.id, inspections: inspections.map(({ source, sourceHash, at, ...item }) => ({ ...item, layerId: source.layerId, source: source.file })),
    next: '有crop_box仅查看原尺寸局部与放大图 不改变素材 无crop_box按编号候选批量确认归属 同一图标的分离部分合并一组 所有块恰好归属一次后split 不把同层多个图标直接判失败 缺背景交总控自动补一次 底板残字仍停止' };
}

export async function splitMaterials(service, task, args) {
  const approved = approvedSource(task);
  if (!Array.isArray(args.items) || !args.items.length) throw new Error('split须提供非空items 含inspection_id和groups');
  const seen = new Set();
  const requests = args.items.map(item => {
    const inspection = task.materialInspections?.[item.inspection_id];
    if (!inspection || !inspection.components?.length) throw new Error('inspection_id无效或只是局部查看 请先inspect透明图层 不猜编号');
    if (inspection.fullyOpaque) throw new Error('不透明图层不能用透明分割 不通过增加透明边框绕过素材检查');
    if (seen.has(inspection.id)) throw new Error('同批次inspection_id不能重复');
    seen.add(inspection.id);
    if (inspection.sourceHash !== approved.sha256 || fileDigest(inspection.source.file) !== inspection.source.sha256) throw new Error('查看快照或源图已变化 重新inspect 不复用旧候选');
    if (inspection.splitMaterialIds) throw new Error(`该快照已经split 不重复裁图 使用已有materialId ${inspection.splitMaterialIds.join(' ')}`);
    if (!Array.isArray(item.groups) || !item.groups.length) throw new Error('split每项groups须为非空数组');
    const groups = item.groups.map(group => {
      if (typeof group.name !== 'string' || !group.name.trim()) throw new Error('split分组须有职责name');
      if (!['icon', 'indicator', 'decoration', 'panel'].includes(group.semantic_role)) throw new Error('split须明确semantic_role icon indicator decoration或panel 不修补背景');
      if (!Array.isArray(group.component_ids) || !group.component_ids.length) throw new Error('split分组须指定非空component_ids');
      return { name: group.name, componentIds: group.component_ids, semanticRole: group.semantic_role,
        kind: ['icon', 'indicator'].includes(group.semantic_role) ? 'icon' : 'decoration' };
    });
    const ids = groups.flatMap(group => group.componentIds);
    if (ids.length !== inspection.components.length || new Set(ids).size !== ids.length || ids.some(id => !Number.isInteger(id) || !inspection.components.some(part => part.id === id))) {
      throw new Error('所有候选块须恰好归属一个分组 不遗漏 不重复 不丢弃小碎片');
    }
    return { inspection, groups };
  });
  const directory = assertInside(task.directory, path.join(task.directory, makeId('split')));
  await mkdir(directory);
  let sequence = 0;
  const payload = requests.map(({ inspection, groups }) => ({ inspectionId: inspection.id, source: inspection.source.file, components: inspection.components,
    groups: groups.map(group => { const id = ++sequence; return { ...group, file: path.join(directory, `${id}.png`), auditOutput: path.join(directory, `${id}-source.png`) }; }) }));
  const result = parseProcess(await runProcess(service.options.pythonPath, ['-B', '-X', 'utf8', runtime], {
    input: JSON.stringify({ action: 'split', items: payload }), timeoutMs: 30000 }));
  for (const { inspection } of requests) if (fileDigest(inspection.source.file) !== inspection.source.sha256) throw new Error('分割期间源图变化 未登记素材 不使用旧坐标');
  const materials = result.results.map(image => {
    const inspection = task.materialInspections[image.inspectionId];
    const placement = inspection.source.placement;
    const [left, top, width, height] = image.cropBox;
    const referencePlacement = placement && { left: placement.left + left * placement.width / image.sourceSize[0],
      top: placement.top + top * placement.height / image.sourceSize[1], width: width * placement.width / image.sourceSize[0], height: height * placement.height / image.sourceSize[1] };
    return { id: makeId('material'), file: image.file, name: image.name, sha256: fileDigest(image.file), createdAt: now(),
      size: image.size, fullyOpaque: image.fullyOpaque, hasVisiblePixels: image.hasVisiblePixels,
      referencePlacement, sourceLayerId: inspection.source.layerId, inspectionId: inspection.id, origin: 'local_extract',
      derivation: { source: image.source, sourceHash: inspection.source.sha256, sourceSize: image.sourceSize,
        sourceOverlay: image.sourceOverlay, sourceOverlaySha256: fileDigest(image.sourceOverlay), cropBox: image.cropBox,
        componentIds: image.componentIds, method: 'alpha_components' }, kind: image.kind, semanticRole: image.semanticRole };
  });
  const sourceSize = await service.sourceDimensions(task);
  let merged = task;
  for (const material of materials) merged = { ...merged, ...materialResult(merged, [material], { kind: material.kind, semanticRole: material.semanticRole,
    sourceHash: approved.sha256, sourceSize }) };
  const added = merged.materials.filter(item => materials.some(material => item.id === material.id));
  await service.patchTask(task.id, current => ({ materials: [...current.materials || [], ...added], materialReviewSequence: merged.materialReviewSequence,
    materialInspections: { ...current.materialInspections, ...Object.fromEntries(requests.map(({ inspection }) => [inspection.id,
      { ...inspection, splitMaterialIds: added.filter(material => material.inspectionId === inspection.id).map(material => material.id) }])) } }));
  const overview = path.join(directory, 'overview.jpg');
  try {
    parseProcess(await runProcess(service.options.pythonPath, ['-B', '-X', 'utf8', path.join(path.dirname(runtime), 'layer_overview.py'), '--output', overview], {
      input: JSON.stringify({ layers: added.flatMap(item => [
        { id: `${item.reviewId} crop`, file: item.file, placement: { left: 0, top: 0, width: item.size[0], height: item.size[1] } },
        { id: `${item.reviewId} source`, file: item.derivation.sourceOverlay, placement: { left: 0, top: 0, width: item.derivation.sourceSize[0], height: item.derivation.sourceSize[1] } }
      ]) }), timeoutMs: 30000 }));
  } catch (error) {
    throw new MaterialError('MATERIAL_OVERVIEW_FAILED', '分割素材已登记 仅总览失败 不重复split', {
      taskId: task.id, state: 'preview_failed', results: added.map(material => ({ material })), reviewItems: materialReviewItems(added), notExecuted: [],
      error: { code: 'MATERIAL_OVERVIEW_FAILED', message: error.message }, nextAction: 'read_material_files',
      next: '分割素材已全部登记 先list绑定已有审核批次 再read_image核对file及sourceOverlay后review 使用已有materialId 不重复split' });
  }
  return { taskId: task.id, state: 'awaiting_review', overview, results: added.map(material => ({ material })),
    next: '批量分割已完成 且保留全部可见像素 坐标已自动映射 一次总览后review接回materialId 页面省略box可用referencePlacement 组件内仍填局部box 替换原合并图层须登记replacements 不重复split 不重拆 不补画' };
}
