import { NODE_FIELDS } from './core.js';
import { normalizeLayoutElement, normalizeLayoutGroup } from './layout-config.js';
import { normalizeContent, normalizePlacement } from './placement.js';
import { textStyle } from './text-style.js';

export function assertLayoutContract(input) {
  const errors = [];
  const check = (run, label) => { try { run(); } catch (error) { errors.push(`${label} ${error.message}`); } };
  const checkLayout = (layout, id) => normalizeLayoutGroup(layout?.type === 'grid' ? { ...layout,
    ...layout.cellSize === undefined ? { cellSize: [1, 1] } : {},
    ...layout.constraint !== 'flexible' && layout.constraintCount === undefined ? { constraintCount: 1 } : {} } : layout, id);
  if (input.rootLayout !== undefined) check(() => checkLayout(input.rootLayout, 'root'), 'root_layout');
  const visit = (nodes, label) => {
    if (!Array.isArray(nodes)) { errors.push(`${label}须为扁平节点数组 使用parent引用父级`); return; }
    for (const [index, node] of nodes.entries()) {
      const owner = `${label}[${node?.id || index}]`;
      if (!node || typeof node !== 'object') { errors.push(`${owner}须为对象`); continue; }
      for (const key of Object.keys(node)) if (!NODE_FIELDS.has(key)) errors.push(`${owner}.${key}不支持${key === 'type' ? ' 节点类型使用kind' : key === 'children' ? ' 子节点放入同一nodes数组并填写parent' : key === 'textColor' ? ' 请使用color' : ''}`);
      if (!node.id) errors.push(`${owner}.id必填`);
      if (!['group', 'image', 'button', 'text', 'prefab'].includes(node.kind)) errors.push(`${owner}.kind须为group image button text prefab`);
      if (node.kind === 'group' && !node.layout) errors.push(`${owner}.layout必填`);
      if (node.layout) check(() => checkLayout(node.layout, node.id), owner);
      if (node.layoutElement) check(() => normalizeLayoutElement(node.layoutElement, node.id), owner);
      if (node.placement) check(() => normalizePlacement(node.placement, node.id), owner);
      if (node.content) check(() => normalizeContent(node.content, node.id), owner);
      if (node.kind === 'text') check(() => textStyle(node), owner);
    }
  };
  visit(input.nodes, 'nodes');
  for (const component of input.components || []) visit(component.nodes, `components[${component.id}].nodes`);
  if (errors.length) throw new Error(`布局字段预检失败\n${errors.join('\n')}`);
}
