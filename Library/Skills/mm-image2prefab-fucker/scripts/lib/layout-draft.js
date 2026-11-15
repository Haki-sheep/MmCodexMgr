import { NODE_FIELDS, normalizeCoordinates } from './core.js';

export function mergeLayoutDraft(saved, patch, task) {
  const fields = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
  if (task) {
    const basis = saved.coordinateSize || saved.canvasSize;
    const target = fields.canvasSize || saved.canvasSize;
    const normalized = normalizeCoordinates(task, { ...fields, canvasSize: basis, coordinateSize: fields.coordinateSize || target });
    fields.nodes = normalized.nodes;
    if (fields.rootLayout) fields.rootLayout = normalized.rootLayout;
    fields.canvasSize = target;
    fields.coordinateSize = basis;
  }
  const remove = new Set(patch.remove || []);
  const nodes = new Map((saved.nodes || []).filter(node => !remove.has(node.id)).map(node => [node.id, node]));
  for (const node of fields.nodes || []) {
    if (!node.id) throw new Error('局部修改必须包含节点id');
    const merged = { ...nodes.get(node.id), ...node };
    for (const key of Object.keys(node)) if (!NODE_FIELDS.has(key) && node[key] === null) delete merged[key];
    nodes.set(node.id, merged);
  }
  const replacements = new Map((saved.replacements || []).map(item => [item.layerId, item]));
  for (const item of patch.replacements || []) replacements.set(item.layerId, item);
  const result = { ...saved, ...fields, nodes: [...nodes.values()], replacements: [...replacements.values()] };
  for (const key of ['action', 'planId', 'remove']) delete result[key];
  return result;
}

export function draftSummary(draft) {
  return { planId: draft.id, state: draft.state, error: draft.error, nodes: draft.input.nodes?.length || 0, canvasSize: draft.input.canvasSize, coordinateSize: draft.input.coordinateSize,
    nodeIndex: (draft.input.nodes || []).map(node => ({ id: node.id, parent: node.parent || 'root', kind: node.kind, name: node.name || node.id })),
    nextAction: draft.state === 'invalid' ? 'patch_layout' : 'build' };
}
