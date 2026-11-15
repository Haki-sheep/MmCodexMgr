import { fileDigest, jsonDigest } from './core.js';

export function resourceContract(item) {
  const forbiddenContent = item.forbiddenContent || ['ordinaryText', 'variableNumbers', 'otherIndependentElements', 'neighborFragments'];
  if (!Array.isArray(forbiddenContent) || forbiddenContent.some(value => !['ordinaryText', 'variableNumbers', 'otherIndependentElements', 'neighborFragments', 'bakedRankBadge'].includes(value))) throw new Error(`素材${item.id}.forbiddenContent不支持`);
  return { ...item, independent: true, forbiddenContent, coordinateSpace: 'sourcePixels' };
}

export function bindResources(task, args) {
  const catalog = task.resourceCatalog;
  if (!catalog?.length || !task.decomposition || task.decomposition.sourceHash !== task.approval.sha256) throw new Error('当前任务没有可绑定的同版本素材清单与拆层结果');
  const review = task.resourceReview?.sourceHash === task.approval.sha256 ? task.resourceReview : {};
  const bindings = new Map((review.bindings || []).map(item => [item.resourceId, item]));
  const unused = new Map((review.unused || []).map(item => [item.layerId, item]));
  const layers = new Map(task.decomposition.document.layers.filter(item => item.role !== 'base' && item.visible !== false).map(item => [item.id, item]));
  for (const item of args.bindings || []) {
    if (!item || Object.keys(item).some(key => !['resource_id', 'layer_ids', 'material_ids', 'checks', 'reason', 'reference_region_id'].includes(key))) throw new Error('bindings仅支持resource_id layer_ids material_ids checks reason reference_region_id');
    const resource = catalog.find(resource => resource.id === item.resource_id);
    if (!resource || !item.reason?.trim() || !Array.isArray(item.layer_ids) || !Array.isArray(item.material_ids)) throw new Error('bindings须使用真实resource_id及layer_ids material_ids数组和具体reason');
    if (item.reference_region_id !== (resource.regionId || 'root')) throw new Error(`素材${resource.id}须引用登记的原图区域${resource.regionId || 'root'}`);
    if (!item.checks || Object.keys(item.checks).length !== 2 || ['noForbiddenContent', 'completeContour'].some(key => !['passed', 'failed', 'unknown'].includes(item.checks[key]))) throw new Error('checks须逐资源填写noForbiddenContent completeContour 为passed failed或unknown 不用总评代替');
    const references = [...item.layer_ids.map(id => { const layer = layers.get(id); if (!layer) throw new Error(`图层不存在 ${id}`); unused.delete(id); return { kind: 'layer', id, file: layer.file, sha256: fileDigest(layer.file) }; }),
      ...item.material_ids.map(id => { const material = task.materials?.find(material => material.id === id && material.state === 'accepted'); if (!material) throw new Error(`素材未验收或不存在 ${id}`); return { kind: 'material', id, file: material.file, sha256: material.sha256 }; })];
    if (!references.length && Object.values(item.checks).every(value => value === 'passed')) throw new Error(`素材${resource.id}没有实际图层或素材 不能通过`);
    bindings.set(resource.id, { resourceId: resource.id, referenceRegionId: item.reference_region_id, references, checks: item.checks, reason: item.reason.trim() });
  }
  for (const item of args.unused_layers || []) {
    if (!item || Object.keys(item).some(key => !['layer_id', 'reason'].includes(key)) || !layers.has(item.layer_id) || !item.reason?.trim()) throw new Error('unused_layers须使用真实layer_id及明确语义reason 不按名字相似或数量猜删');
    unused.set(item.layer_id, { layerId: item.layer_id, reason: item.reason.trim(), sha256: fileDigest(layers.get(item.layer_id).file) });
  }
  const used = new Set([...bindings.values()].flatMap(item => item.references.filter(ref => ref.kind === 'layer').map(ref => ref.id)));
  if ([...unused.keys()].some(id => used.has(id))) throw new Error('同一图层不能同时绑定和标为unused 修改绑定时只提交该资源差量');
  const missing = catalog.filter(item => !bindings.has(item.id)).map(item => item.id);
  const unclassified = [...layers.keys()].filter(id => !used.has(id) && !unused.has(id));
  const defects = [...bindings.values()].filter(item => Object.values(item.checks).some(value => value !== 'passed')).map(item => item.resourceId);
  return { sourceHash: task.approval.sha256, catalogHash: jsonDigest(catalog), bindings: [...bindings.values()], unused: [...unused.values()], missing, unclassified, defects,
    state: missing.length || unclassified.length || defects.length ? 'incomplete' : 'ready' };
}

export function assertResourceReview(task, input) {
  if (task.workflowContractVersion !== 2) return;
  const review = task.resourceReview;
  if (!review || review.state !== 'ready' || review.sourceHash !== task.approval.sha256 || review.catalogHash !== jsonDigest(task.resourceCatalog)) throw new Error('先ui_material bind_layers一次绑定资源及逐项原子化结论 不完整或明确缺陷不能装配');
  for (const item of [...review.bindings.flatMap(item => item.references), ...review.unused.map(item => ({ ...item, file: task.decomposition.document.layers.find(layer => layer.id === item.layerId)?.file }))]) {
    if (!item.file || fileDigest(item.file) !== item.sha256) throw new Error('绑定素材版本变化 不使用旧验收');
  }
  const allowedLayers = new Set(review.bindings.flatMap(item => item.references.filter(ref => ref.kind === 'layer').map(ref => ref.id)));
  const allowedMaterials = new Set(review.bindings.flatMap(item => item.references.filter(ref => ref.kind === 'material').map(ref => ref.id)));
  for (const node of [...input.nodes || [], ...(input.components || []).flatMap(item => item.nodes || [])]) {
    for (const part of [node, ...node.overrides || []]) {
      if (part.layerId && !allowedLayers.has(part.layerId) || part.materialId && !allowedMaterials.has(part.materialId)) throw new Error(`节点${node.id}引用未绑定资源 不让多余图层进入装配`);
      if (part.sprite) throw new Error(`节点${node.id}使用layerId或materialId 不用sprite路径绕过资源绑定`);
    }
  }
}
