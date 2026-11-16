const anchors = {
  topLeft: [0, 1], topCenter: [0.5, 1], topRight: [1, 1],
  middleLeft: [0, 0.5], center: [0.5, 0.5], middleRight: [1, 0.5],
  bottomLeft: [0, 0], bottomCenter: [0.5, 0], bottomRight: [1, 0]
};

function fields(value, allowed, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label}须为对象`);
  const unknown = Object.keys(value).filter(key => !allowed.includes(key));
  if (unknown.length) throw new Error(`${label}包含不支持字段 ${unknown.join(' ')}`);
}

export function normalizePlacement(value, id) {
  fields(value, ['mode', 'anchor', 'offset', 'insets'], `${id}.placement`);
  const mode = value.mode ?? 'reference';
  if (!['reference', 'anchor', 'stretch'].includes(mode)) throw new Error(`${id}.placement.mode须为reference anchor stretch`);
  if (mode === 'stretch') {
    if (value.anchor !== undefined || value.offset !== undefined) throw new Error(`${id}.placement.stretch不能设置anchor或offset`);
    const insets = value.insets ?? { left: 0, top: 0, right: 0, bottom: 0 };
    fields(insets, ['left', 'top', 'right', 'bottom'], `${id}.placement.insets`);
    if (['left', 'top', 'right', 'bottom'].some(key => !Number.isFinite(insets[key]))) throw new Error(`${id}.placement.insets须包含四边有限数值`);
    return { mode, insets };
  }
  const anchor = value.anchor ?? 'topLeft';
  if (!Object.hasOwn(anchors, anchor)) throw new Error(`${id}.placement.anchor无效 ${anchor}`);
  if (value.insets !== undefined) throw new Error(`${id}.placement仅stretch支持insets`);
  if (mode === 'reference') {
    if (value.offset !== undefined) throw new Error(`${id}.placement.reference保持参考位置 不能设置offset`);
    return { mode, anchor };
  }
  const offset = value.offset ?? [0, 0];
  if (!Array.isArray(offset) || offset.length !== 2 || !offset.every(Number.isFinite)) throw new Error(`${id}.placement.offset须为两数数组`);
  return { mode, anchor, offset };
}

export function normalizeContent(value, id) {
  fields(value, ['fit', 'alignment'], `${id}.content`);
  const fit = value.fit ?? 'stretch';
  if (!['stretch', 'contain'].includes(fit)) throw new Error(`${id}.content.fit须为stretch或contain`);
  if (value.alignment !== undefined && value.alignment !== 'center') throw new Error(`${id}.content.alignment首版仅支持center 其他对齐请使用独立槽位及锚点`);
  return { fit, alignment: 'center' };
}

export function scalePlacement(value, scaleX, scaleY, id) {
  const placement = normalizePlacement(value, id);
  if (placement.offset) placement.offset = [placement.offset[0] * scaleX, placement.offset[1] * scaleY];
  if (placement.insets) placement.insets = { left: placement.insets.left * scaleX, top: placement.insets.top * scaleY,
    right: placement.insets.right * scaleX, bottom: placement.insets.bottom * scaleY };
  return placement;
}

export function referenceBoxes(input, document, materials = []) {
  const nodes = new Map(input.nodes.map(node => [node.id, node]));
  const layers = new Map(document.layers.map(layer => [layer.id, layer]));
  const boxes = new Map();
  const visiting = new Set();
  const layerBox = (id, owner) => {
    const layer = layers.get(id);
    if (!layer) throw new Error(`${owner}.bounds图层不存在 ${id}`);
    const source = layer.placement;
    return { left: source.left * input.canvasSize[0] / document.width, top: source.top * input.canvasSize[1] / document.height,
      width: source.width * input.canvasSize[0] / document.width, height: source.height * input.canvasSize[1] / document.height };
  };
  const resolve = id => {
    if (id === 'root') return { left: 0, top: 0, width: input.canvasSize[0], height: input.canvasSize[1] };
    if (boxes.has(id)) return boxes.get(id);
    if (visiting.has(id)) throw new Error(`bounds引用循环 ${id}`);
    const node = nodes.get(id);
    if (!node) throw new Error(`bounds节点不存在 ${id}`);
    visiting.add(id);
    let box = node.box;
    if (node.bounds != null) {
      if (node.kind !== 'group') throw new Error(`${id}.bounds只能用于group`);
      if (box) throw new Error(`${id}.bounds不能与box并用`);
      fields(node.bounds, ['layerId', 'nodeIds'], `${id}.bounds`);
      if ((node.bounds.layerId !== undefined) === (node.bounds.nodeIds !== undefined)) throw new Error(`${id}.bounds须且只能设置layerId或nodeIds`);
      if (node.bounds.layerId !== undefined) box = layerBox(node.bounds.layerId, id);
      else {
        const ids = node.bounds.nodeIds;
        if (!Array.isArray(ids) || !ids.length || ids.some(value => typeof value !== 'string') || new Set(ids).size !== ids.length) throw new Error(`${id}.bounds.nodeIds须为非空不重复节点ID数组`);
        const members = ids.map(resolve);
        const left = Math.min(...members.map(item => item.left));
        const top = Math.min(...members.map(item => item.top));
        box = { left, top, width: Math.max(...members.map(item => item.left + item.width)) - left,
          height: Math.max(...members.map(item => item.top + item.height)) - top };
      }
    } else if (!box && node.layerId) box = layerBox(node.layerId, id);
    if (!box && node.materialId) {
      const reference = materials.find(material => material.id === node.materialId)?.referencePlacement;
      if (reference) box = { left: reference.left * input.canvasSize[0] / document.width, top: reference.top * input.canvasSize[1] / document.height,
        width: reference.width * input.canvasSize[0] / document.width, height: reference.height * input.canvasSize[1] / document.height };
    }
    if (!box && node.placement?.mode === 'stretch') box = placedBox(null, resolve(node.parent || 'root'), normalizePlacement(node.placement, id), id);
    if (box) boxes.set(id, box);
    visiting.delete(id);
    if (!box) throw new Error(`${id}缺少参考矩形 请提供box或layerId bounds合并只读取参考矩形 不读取最终排版结果`);
    return box;
  };
  for (const node of input.nodes) if (node.box || node.layerId || node.materialId || node.bounds !== undefined || node.placement?.mode === 'stretch') resolve(node.id);
  return boxes;
}

export function placedBox(box, parent, placement, id) {
  if (placement?.mode === 'stretch') {
    const { left, top, right, bottom } = placement.insets;
    box = { left: parent.left + left, top: parent.top + top, width: parent.width - left - right, height: parent.height - top - bottom };
  } else if (placement?.mode === 'anchor') {
    const anchor = anchors[placement.anchor];
    if (!box) throw new Error(`${id}锚点定位需要box或layerId提供尺寸`);
    box = { ...box, left: parent.left + parent.width * anchor[0] + placement.offset[0] - box.width / 2,
      top: parent.top + parent.height * (1 - anchor[1]) + placement.offset[1] - box.height / 2 };
  }
  if (!box || ['left', 'top', 'width', 'height'].some(key => !Number.isFinite(box[key])) || box.width <= 0 || box.height <= 0) throw new Error(`无效矩形 ${id}`);
  return { ...box };
}

export function rectOf(box, parent, placement) {
  if (placement?.mode === 'stretch') return { anchorMin: [0, 0], anchorMax: [1, 1], pivot: [0.5, 0.5],
    position: [box.left - parent.left + box.width / 2 - parent.width / 2, -(box.top - parent.top) - box.height / 2 + parent.height / 2],
    size: [box.width - parent.width, box.height - parent.height] };
  const anchor = anchors[placement?.anchor ?? 'topLeft'];
  return { anchorMin: [...anchor], anchorMax: [...anchor], pivot: [0.5, 0.5],
    position: [box.left - parent.left + box.width / 2 - parent.width * anchor[0],
      -(box.top - parent.top) - box.height / 2 + parent.height * (1 - anchor[1])], size: [box.width, box.height] };
}

export function resizedChild(box, before, after, placement, id) {
  if (placement?.mode === 'stretch' || placement?.mode === 'anchor') return placedBox(box, after, placement, id);
  const anchor = anchors[placement?.anchor ?? 'topLeft'];
  return { ...box, left: box.left + after.left - before.left + (after.width - before.width) * anchor[0],
    top: box.top + after.top - before.top + (after.height - before.height) * (1 - anchor[1]) };
}

export function visualTolerance(task, targetSize) {
  const document = task.decomposition.document;
  const candidate = task.candidates.find(item => item.id === task.approval?.candidateId);
  const sourceSize = document.sourceSize ?? (candidate?.width > 0 && candidate?.height > 0 ? [candidate.width, candidate.height] : [document.width, document.height]);
  return [10 * targetSize[0] / sourceSize[0], 10 * targetSize[1] / sourceSize[1]];
}
