import { canvasSize, compileAssembly, expandedNodes, fileDigest, normalizeCoordinates, NODE_FIELDS, layerAssetStem } from './core.js';
import { visualTolerance } from './placement.js';
import path from 'node:path';
import { textStyle } from './text-style.js';
import { normalizeLayoutElement, normalizeLayoutGroup } from './layout-config.js';
import { layerCoverage } from './coverage.js';

export function draftLayout(task, input) {
  const document = task.decomposition?.document;
  if (!document) throw new Error('先完成拆层');
  const nodes = document.layers.filter(layer => layer.role !== 'base' && layer.visible).map(layer => ({
    id: layer.id, name: layer.name, kind: 'image', layerId: layer.id, parent: 'root'
  }));
  const size = canvasSize(task, input);
  return { prefabPath: input.prefabPath, name: input.name, canvasSize: size, coordinateSize: size, nodes };
}

export function editableLayout(task) {
  if (task.assembly?.input) {
    const input = structuredClone(task.assembly.input);
    const savedSize = [task.assembly.plan.width, task.assembly.plan.height];
    return normalizeCoordinates(task, { ...input, canvasSize: input.canvasSize ?? savedSize, coordinateSize: input.coordinateSize ?? savedSize });
  }
  if (!task.assembly?.plan) throw new Error('先draft生成布局或提交完整布局');
  const plan = task.assembly.plan;
  const imported = new Map(plan.imports.map(item => [item.destination, item.source]));
  const layers = task.decomposition.document.layers;
  return { prefabPath: plan.prefabPath, name: plan.nodes[0].name, canvasSize: [plan.width, plan.height], coordinateSize: [plan.width, plan.height],
    nodes: plan.nodes.filter(node => node.id !== 'root').map(node => {
      const { rect, siblingIndex, raycast, preserveAspect, ...input } = node;
      const layer = layers.find(item => item.role !== 'base' && item.file === imported.get(node.sprite)
        && path.basename(node.sprite, path.extname(node.sprite)) === layerAssetStem(item.id));
      if (layer) { input.layerId = layer.id; delete input.sprite; }
      if (input.materialId) delete input.sprite;
      return input;
    }) };
}

export function patchLayout(task, patch) {
  const saved = editableLayout(task);
  const input = normalizeCoordinates(task, { ...saved, canvasSize: patch.canvasSize ?? saved.canvasSize });
  const remove = new Set(patch.remove || []);
  const nodes = new Map(input.nodes.filter(node => !remove.has(node.id)).map(node => [node.id, node]));
  for (const node of normalizeCoordinates(task, { ...patch, canvasSize: input.canvasSize }).nodes || []) {
    if (!node.id) throw new Error('局部修改必须包含节点id');
    const merged = { ...nodes.get(node.id), ...node };
    for (const key of Object.keys(node)) if (!NODE_FIELDS.has(key) && node[key] === null) delete merged[key];
    nodes.set(node.id, merged);
  }
  const replacements = new Map((input.replacements || []).map(item => [item.layerId, item]));
  for (const item of patch.replacements || []) replacements.set(item.layerId, item);
  return { ...input, ...patch.prefabPath ? { prefabPath: patch.prefabPath } : {}, ...patch.name ? { name: patch.name } : {},
    ...patch.rootLayout ? { rootLayout: patch.rootLayout } : {}, ...patch.layoutPolicy ? { layoutPolicy: patch.layoutPolicy } : {},
    ...patch.components !== undefined ? { components: patch.components } : {}, replacements: [...replacements.values()], nodes: [...nodes.values()] };
}

export function layoutSummary(task) {
  const input = editableLayout(task);
  const document = task.decomposition.document;
  const plan = validateLayout(task, input);
  return { prefabPath: input.prefabPath, name: input.name, planHash: task.assembly.hash, canvasSize: input.canvasSize,
    coordinateSize: input.coordinateSize, documentSize: [document.width, document.height], sourceSize: document.sourceSize, replacements: input.replacements || [],
    semanticAudit: semanticAudit(input),
    geometryAudit: geometryAudit(plan),
    components: input.components || [],
    nodes: input.nodes.map(node => ({ id: node.id, name: node.name || node.id, parent: node.parent || 'root', kind: node.kind,
      ...node.bounds ? { bounds: node.bounds } : {}, ...node.placement ? { placement: node.placement } : {}, ...node.content ? { content: node.content } : {},
      ...node.semanticRole ? { semanticRole: node.semanticRole } : {}, ...node.repeatKey ? { repeatKey: node.repeatKey } : {}, ...node.bindKey ? { bindKey: node.bindKey } : {},
      ...node.box ? { box: node.box } : {}, ...node.layerId ? { layerId: node.layerId } : {}, ...node.materialId ? { materialId: node.materialId } : {},
      ...node.prefab || node.componentId ? { prefab: node.prefab, componentId: node.componentId, overrides: node.overrides || [] } : {},
      ...node.layout ? { layout: node.layout } : {},
      ...node.layoutElement ? { layoutElement: node.layoutElement } : {},
      ...node.text !== undefined ? { text: node.text, font: node.font, fontId: node.fontId, fontSize: node.fontSize, color: node.color, ...textStyle(node) } : {} })) };
}

export function geometryAudit(plan) {
  const nodes = expandedNodes(plan).filter(node => node.active !== false && ['icon', 'label', 'value'].includes(node.semanticRole));
  const overlaps = [];
  for (let firstIndex = 0; firstIndex < nodes.length; firstIndex++) {
    const first = nodes[firstIndex];
    for (let secondIndex = firstIndex + 1; secondIndex < nodes.length; secondIndex++) {
      const second = nodes[secondIndex];
      if (first.id.startsWith(`${second.id}/`) || second.id.startsWith(`${first.id}/`)) continue;
      if (first.semanticRole !== 'icon' && second.semanticRole !== 'icon') continue;
      const left = Math.max(first.box.left, second.box.left);
      const top = Math.max(first.box.top, second.box.top);
      const right = Math.min(first.box.left + first.box.width, second.box.left + second.box.width);
      const bottom = Math.min(first.box.top + first.box.height, second.box.top + second.box.height);
      if (right - left <= 0.5 || bottom - top <= 0.5) continue;
      overlaps.push({ first: first.id, firstRole: first.semanticRole, second: second.id, secondRole: second.semanticRole,
        intersection: { left, top, width: right - left, height: bottom - top } });
    }
  }
  return { checkedNodes: nodes.length, overlaps, next: overlaps.length
    ? '这些图标与文字区域相交 逐项对照定图确认 误差项在assemble前一次patch修正 有意叠放需保留并注明'
    : '关键图文区域未发现矩形相交 仍须对照Unity截图检查素材与整体视觉' };
}

function uncoveredRectangle(target, boxes) {
  const right = target.left + target.width;
  const bottom = target.top + target.height;
  const clipped = boxes.map(box => ({ left: Math.max(target.left, box.left), top: Math.max(target.top, box.top),
    right: Math.min(right, box.left + box.width), bottom: Math.min(bottom, box.top + box.height) }))
    .filter(box => box.right > box.left && box.bottom > box.top);
  const columns = [...new Set([target.left, right, ...clipped.flatMap(box => [box.left, box.right])])].sort((a, b) => a - b);
  for (let index = 0; index < columns.length - 1; index++) {
    const left = columns[index];
    const columnRight = columns[index + 1];
    if (columnRight - left <= 0.5) continue;
    const intervals = clipped.filter(box => box.left <= left + 0.5 && box.right >= columnRight - 0.5)
      .map(box => [box.top, box.bottom]).sort((a, b) => a[0] - b[0]);
    let top = target.top;
    for (const interval of intervals) {
      if (interval[0] > top + 0.5) return { left, top, width: columnRight - left, height: interval[0] - top };
      top = Math.max(top, interval[1]);
    }
    if (top < bottom - 0.5) return { left, top, width: columnRight - left, height: bottom - top };
  }
  return null;
}

const semanticRoles = new Set(['background', 'panel', 'header', 'navigation', 'list', 'item', 'icon', 'indicator', 'label', 'value', 'button', 'input', 'decoration', 'overlay']);

// 草稿允许保存 只有装配入口强制要求完成语义分组
export function semanticAudit(input) {
  const errors = [];
  const warnings = [];
  const nodes = input.nodes || [];
  const groups = nodes.filter(node => node.kind === 'group');
  if (!groups.length) errors.push('缺少语义分组 至少创建一个group作为面板 导航 列表或条目容器');
  const directVisuals = nodes.filter(node => (node.parent || 'root') === 'root' && node.kind !== 'group');
  const nonBackgroundDirectVisuals = directVisuals.filter(node => node.kind !== 'image' || node.semanticRole !== 'background');
  if (nonBackgroundDirectVisuals.length) errors.push(`视觉节点不能直接挂在root 请按功能放入group ${nonBackgroundDirectVisuals.map(node => node.id).join(' ')}`);
  for (const node of nodes) {
    if (!semanticRoles.has(node.semanticRole)) errors.push(`${node.id} 缺少有效semanticRole 请说明节点职责`);
    if (/^(?:layer-?\d+|Text_Value_\d+|Text_Level_Lv\d+|.*[_-](?:\d+|Lv\d+|\d+of\d+))$/i.test(node.name || node.id)) warnings.push(`${node.id} 名称疑似包含当前内容或拆图编号 ${node.name || node.id}`);
    if (node.kind === 'group' && !nodes.some(child => (child.parent || 'root') === node.id)) warnings.push(`${node.id} 是空语义分组`);
  }
  const repeated = new Map();
  for (const node of nodes.filter(node => node.repeatKey)) repeated.set(node.repeatKey, [...(repeated.get(node.repeatKey) || []), node]);
  for (const [key, items] of repeated) if (items.length > 1 && (!items.every(node => node.kind === 'prefab' && (node.prefab || node.componentId))
    || new Set(items.map(node => node.componentId || node.prefab)).size !== 1)) warnings.push(`重复结构${key}未复用同一Prefab资源 请确认是否应抽取条目模板`);
  for (const component of input.components || []) {
    const audit = semanticAudit({ nodes: [{ id: 'component-root', kind: 'group', semanticRole: 'item' },
      ...(component.nodes || []).map(node => ({ ...node, parent: !node.parent || node.parent === 'root' ? 'component-root' : node.parent }))] });
    errors.push(...audit.errors.map(message => `组件${component.id} ${message}`));
    warnings.push(...audit.warnings.map(message => `组件${component.id} ${message}`));
  }
  return { passed: errors.length === 0, errors, warnings, groups: groups.length, directVisuals: directVisuals.length };
}

export function assertSemanticLayout(input) {
  const result = semanticAudit(input);
  if (!result.passed) throw new Error(`语义结构预检失败\n${result.errors.join('\n')}`);
  return result;
}

export function validateLayout(task, input) {
  const errors = [];
  const targetSize = input.canvasSize || canvasSize(task, input);
  const ids = new Set(['root']);
  const inputNodes = new Map();
  const layers = new Map(task.decomposition.document.layers.map(layer => [layer.id, layer]));
  const components = new Map();
  for (const component of input.components || []) {
    if (!component?.id) continue;
    if (components.has(component.id)) errors.push(`components重复定义 ${component.id}`);
    components.set(component.id, component);
    if (!component.prefabPath) errors.push(`components[${component.id}]缺少prefabPath`);
    if (!Array.isArray(component.nodes) || !component.nodes.length) errors.push(`components[${component.id}]缺少nodes`);
  }
  const checkMaterial = (materialId, owner) => {
    if (!materialId) return;
    const material = task.materials?.find(item => item.id === materialId);
    if (!material) { errors.push(`${owner}.materialId不存在 ${materialId}`); return; }
    if (material.state !== 'accepted' || material.sourceHash !== task.approval?.sha256) errors.push(`${owner}.materialId未经核对或定图已变化 ${materialId}`);
    try { if (fileDigest(material.file) !== material.sha256) errors.push(`${owner}.materialId内容已变化 ${materialId}`); }
    catch { errors.push(`${owner}.materialId文件不可读 ${material.file}`); }
  };
  for (const node of input.nodes || []) {
    if (!/^[a-zA-Z0-9_-]+$/.test(node.id) || ids.has(node.id)) errors.push(`${node.id} 节点id无效或重复 root由工具创建`);
    ids.add(node.id);
    inputNodes.set(node.id, node);
    if (!['group', 'image', 'button', 'text', 'prefab'].includes(node.kind)) errors.push(`nodes[${node.id}].kind不受支持 ${node.kind}`);
    if (node.layout != null) {
      if (node.kind !== 'group') errors.push(`nodes[${node.id}].layout只能挂在group节点`);
      else {
        try { normalizeLayoutGroup(node.layout, node.id); } catch (error) { errors.push(error.message); }
      }
    }
    if (node.layoutElement != null) {
      try { normalizeLayoutElement(node.layoutElement, node.id); } catch (error) { errors.push(error.message); }
    }
    if (node.kind === 'text') {
      if (typeof node.text !== 'string') errors.push(`${node.id} text须为字符串`);
      else if (/^\s/.test(node.text)) errors.push(`${node.id} 禁止使用前导空白定位 请调整box或alignment`);
      if (!node.font && !node.fontId) errors.push(`nodes[${node.id}].font 缺少fontId或Assets字体路径 先ui_unity preflight`);
      if (typeof node.fontSize !== 'number' || !Number.isFinite(node.fontSize) || node.fontSize <= 0) errors.push(`nodes[${node.id}].fontSize须为有限正数`);
    }
    if (node.kind === 'image' && !node.layerId && !node.materialId && !node.sprite && node.color === undefined) errors.push(`nodes[${node.id}]图片缺少layerId materialId sprite或纯色color`);
    if (node.layerId && !layers.has(node.layerId)) errors.push(`nodes[${node.id}].layerId不存在 ${node.layerId}`);
    if (node.materialId && (node.layerId || node.sprite || !['image', 'button'].includes(node.kind))) errors.push(`nodes[${node.id}].materialId不能与layerId或sprite并用 且仅支持image/button`);
    checkMaterial(node.materialId, `nodes[${node.id}]`);
    if (node.kind === 'prefab' && node.componentId && !components.has(node.componentId)) errors.push(`nodes[${node.id}].componentId未定义 ${node.componentId}`);
    if (node.kind === 'prefab' && !node.componentId && !node.prefab) errors.push(`nodes[${node.id}]Prefab缺少prefab或componentId`);
    for (const [index, override] of (node.overrides || []).entries()) checkMaterial(override.materialId, `nodes[${node.id}].overrides[${index}]`);
    if (node.box) {
      const values = Array.isArray(node.box) ? node.box : node.box && ['left', 'top', 'width', 'height'].map(key => node.box[key]);
      if (!Array.isArray(values) || values.length !== 4 || values.some(value => typeof value !== 'number' || !Number.isFinite(value))) {
        errors.push(`nodes[${node.id}].box须包含有限的left top width height坐标`);
      } else if (values[2] <= 0 || values[3] <= 0) {
        errors.push(`nodes[${node.id}].box.width和height须大于0`);
      }
    }
  }
  for (const component of input.components || []) {
    for (const [index, node] of (component.nodes || []).entries()) {
      checkMaterial(node.materialId, `components[${component.id}].nodes[${index}]`);
      for (const [overrideIndex, override] of (node.overrides || []).entries()) checkMaterial(override.materialId, `components[${component.id}].nodes[${index}].overrides[${overrideIndex}]`);
    }
  }
  for (const node of input.nodes || []) if (node.parent && !ids.has(node.parent)) errors.push(`${node.id} 父节点不存在 ${node.parent} nodes[${node.id}].parent`);
  if (errors.length) throw new Error(`布局参数预检失败\n${[...new Set(errors)].join('\n')}`);
  let plan;
  try { plan = compileAssembly(task, input); }
  catch (error) { throw new Error(`布局编译失败 ${error.message}`, { cause: error }); }
  const visuals = expandedNodes(plan);
  const byId = new Map(visuals.map(node => [node.id, node]));
  const isVisible = node => {
    if (!node || node.active === false || node.color?.[3] === 0) return false;
    let parent = byId.get(node.parent);
    while (parent) { if (parent.active === false) return false; parent = byId.get(parent.parent); }
    return ['image', 'text', 'button'].includes(node.kind) && (node.kind !== 'button' || node.sprite || node.color?.[3] > 0);
  };
  const imported = new Map(plan?.imports.map(item => [item.destination, item.source]) || []);
  const unusedLayers = new Set(task.workflowContractVersion === 2 && task.resourceReview?.state === 'ready' ? task.resourceReview.unused.map(item => item.layerId) : []);
  for (const layer of task.decomposition.document.layers.filter(item => item.role !== 'base' && item.visible !== false && !unusedLayers.has(item.id))) {
    const retained = visuals.some(node => isVisible(node) && imported.get(node.sprite) === layer.file && path.basename(node.sprite, path.extname(node.sprite)) === layerAssetStem(layer.id));
    if (retained) continue;
    const splitInspections = Object.values(task.materialInspections || {}).filter(inspection => inspection.source?.layerId === layer.id && inspection.sourceHash === task.approval.sha256 && inspection.source.sha256 === fileDigest(layer.file) && inspection.splitMaterialIds?.length);
    const completeSplit = splitInspections.find(inspection => inspection.splitMaterialIds.every(id => {
      const material = task.materials?.find(item => item.id === id);
      return material?.state === 'accepted' && material.derivation?.method === 'alpha_components' && fileDigest(material.file) === material.sha256
        && visuals.some(node => isVisible(node) && imported.get(node.sprite) === material.file);
    }));
    if (completeSplit) {
      plan.materialCoverage ||= [];
      plan.materialCoverage.push({ layerId: layer.id, method: 'verified_alpha_split', materialCount: completeSplit.splitMaterialIds.length });
      continue;
    }
    const replacement = (input.replacements || []).find(item => item.layerId === layer.id);
    if (!replacement?.reason?.trim() || !replacement.nodeIds?.length) {
      errors.push(`replacements[${layer.id}]原图层被丢弃且未登记完整替换 请保留原图层或提供nodeIds与reason`);
      continue;
    }
    const missing = replacement.nodeIds.filter(id => !byId.has(id));
    if (missing.length) errors.push(`replacements[${layer.id}].nodeIds包含不存在节点 ${missing.join(' ')}`);
    const invalid = replacement.nodeIds.filter(id => byId.has(id) && !isVisible(byId.get(id)) && !visuals.some(node => node.id.startsWith(`${id}/`) && isVisible(node)));
    if (invalid.length) errors.push(`replacements[${layer.id}].nodeIds必须引用有效视觉节点 不引用group或隐藏透明节点 ${invalid.join(' ')}`);
    const target = { left: layer.placement.left * targetSize[0] / task.decomposition.document.width,
      top: layer.placement.top * targetSize[1] / task.decomposition.document.height,
      width: layer.placement.width * targetSize[0] / task.decomposition.document.width,
      height: layer.placement.height * targetSize[1] / task.decomposition.document.height };
    const boxes = visuals.filter(node => isVisible(node) && replacement.nodeIds.some(id => id === node.id || node.id.startsWith(`${id}/`))).map(node => node.box);
    if (missing.length || invalid.length || !plan) continue;
    const support = layer.visibleSupport;
    if (support && fileDigest(layer.file) !== support.sha256) { errors.push(`原图层内容已变化 ${layer.id} 请重新读取支撑集`); continue; }
    const coverage = support ? layerCoverage(layer, [task.decomposition.document.width, task.decomposition.document.height], targetSize, boxes, support) : null;
    const gap = coverage ? coverage.covered ? null : coverage.gap : uncoveredRectangle(target, boxes);
    if (gap) {
      const [toleranceX, toleranceY] = visualTolerance(task, targetSize);
      const tolerantBoxes = boxes.map(box => ({ left: box.left - toleranceX, top: box.top - toleranceY, width: box.width + toleranceX * 2, height: box.height + toleranceY * 2 }));
      const remaining = support ? layerCoverage(layer, [task.decomposition.document.width, task.decomposition.document.height], targetSize, tolerantBoxes, support).gap : uncoveredRectangle(target, tolerantBoxes);
      if (remaining) errors.push(`replacements[${layer.id}]布局范围未覆盖原图层 此检查不表示拆分素材丢像素 请核对坐标单位和容器排列 ${support ? '原位置存在非透明像素 ' : ''}缺口=${JSON.stringify(remaining)}`);
    }
  }
  if (errors.length) throw new Error(`布局预检失败 一次修正以下问题\n${[...new Set(errors)].join('\n')}`);
  return plan;
}
