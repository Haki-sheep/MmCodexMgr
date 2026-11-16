import { resizedChild } from './placement.js';

const alignments = ['UpperLeft', 'UpperCenter', 'UpperRight', 'MiddleLeft', 'MiddleCenter', 'MiddleRight', 'LowerLeft', 'LowerCenter', 'LowerRight'];
const gridConstraints = ['fixedColumnCount', 'fixedRowCount', 'flexible'];
const gridCorners = ['UpperLeft', 'UpperRight', 'LowerLeft', 'LowerRight'];
const gridAxes = ['Horizontal', 'Vertical'];

function vector(value, length, label, minimum = 0) {
  if (!Array.isArray(value) || value.length !== length || value.some(item => typeof item !== 'number' || !Number.isFinite(item) || item < minimum)) {
    throw new Error(`${label}须为${length}个不小于${minimum}的有限数值`);
  }
  return value;
}

function object(value, label, fields) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label}须为对象`);
  const unknown = Object.keys(value).filter(key => !fields.includes(key));
  if (unknown.length) throw new Error(`${label}包含不支持字段 ${unknown.join(' ')}`);
}

export function normalizeLayoutGroup(value, id) {
  object(value, `${id}.layout`, ['type', 'constraint', 'constraintCount', 'cellSize', 'spacing', 'padding', 'childAlignment', 'startCorner', 'startAxis',
    'childControlWidth', 'childControlHeight', 'childForceExpandWidth', 'childForceExpandHeight']);
  if (value.type === 'overlay') {
    if (Object.keys(value).some(key => key !== 'type')) throw new Error(`${id}.layout.overlay不支持排列参数 子节点使用placement定位`);
    return { type: 'overlay' };
  }
  if (!['grid', 'horizontal', 'vertical'].includes(value.type)) throw new Error(`${id}.layout.type须为overlay grid horizontal vertical`);
  const layout = { type: value.type, padding: value.padding ?? [0, 0, 0, 0], spacing: value.spacing ?? [0, 0],
    childAlignment: value.childAlignment ?? 'UpperLeft', childControlWidth: value.childControlWidth ?? false,
    childControlHeight: value.childControlHeight ?? false, childForceExpandWidth: value.childForceExpandWidth ?? false,
    childForceExpandHeight: value.childForceExpandHeight ?? false };
  if (typeof layout.spacing === 'number' && value.type !== 'grid') layout.spacing = value.type === 'horizontal' ? [layout.spacing, 0] : [0, layout.spacing];
  vector(layout.padding, 4, `${id}.layout.padding`);
  if (!layout.padding.every(Number.isInteger)) throw new Error(`${id}.layout.padding须为整数像素`);
  vector(layout.spacing, 2, `${id}.layout.spacing`);
  if (!alignments.includes(layout.childAlignment)) throw new Error(`${id}.layout.childAlignment无效`);
  for (const key of ['childControlWidth', 'childControlHeight', 'childForceExpandWidth', 'childForceExpandHeight']) {
    if (typeof layout[key] !== 'boolean') throw new Error(`${id}.layout.${key}须为布尔值`);
  }
  if (value.type === 'grid') {
    if (['childControlWidth', 'childControlHeight', 'childForceExpandWidth', 'childForceExpandHeight'].some(key => layout[key])) {
      throw new Error(`${id}.layout的Grid不支持childControl和childForceExpand`);
    }
    layout.constraint = value.constraint ?? 'fixedColumnCount';
    layout.constraintCount = value.constraintCount;
    layout.cellSize = value.cellSize;
    layout.startCorner = value.startCorner ?? 'UpperLeft';
    layout.startAxis = value.startAxis ?? 'Horizontal';
    if (!gridConstraints.includes(layout.constraint)) throw new Error(`${id}.layout.constraint无效`);
    if (layout.constraint !== 'flexible' && (!Number.isInteger(layout.constraintCount) || layout.constraintCount <= 0)) throw new Error(`${id}.layout.constraintCount须为正整数`);
    if (layout.constraint === 'flexible' && layout.constraintCount !== undefined) throw new Error(`${id}.layout.flexible不能设置constraintCount`);
    vector(layout.cellSize, 2, `${id}.layout.cellSize`);
    if (layout.cellSize.some(item => item <= 0)) throw new Error(`${id}.layout.cellSize须为正数`);
    if (!gridCorners.includes(layout.startCorner)) throw new Error(`${id}.layout.startCorner无效`);
    if (!gridAxes.includes(layout.startAxis)) throw new Error(`${id}.layout.startAxis无效`);
  } else if (['constraint', 'constraintCount', 'cellSize', 'startCorner', 'startAxis'].some(key => value[key] !== undefined)) {
    throw new Error(`${id}.layout仅grid支持constraint cellSize startCorner startAxis`);
  }
  return layout;
}

export function normalizeLayoutElement(value, id) {
  object(value, `${id}.layoutElement`, ['minSize', 'preferredSize', 'flexibleSize', 'ignoreLayout']);
  const minSize = value.minSize ?? [-1, -1];
  const preferredSize = value.preferredSize ?? [-1, -1];
  const flexibleSize = value.flexibleSize ?? [-1, -1];
  vector(minSize, 2, `${id}.layoutElement.minSize`, -1);
  vector(preferredSize, 2, `${id}.layoutElement.preferredSize`, -1);
  vector(flexibleSize, 2, `${id}.layoutElement.flexibleSize`, -1);
  if (typeof (value.ignoreLayout ?? false) !== 'boolean') throw new Error(`${id}.layoutElement.ignoreLayout须为布尔值`);
  return { minSize, preferredSize, flexibleSize, ignoreLayout: value.ignoreLayout ?? false };
}

export function projectLayoutBounds(plan) {
  const nodes = structuredClone(plan.nodes);
  const byId = new Map(nodes.map(node => [node.id, node]));
  const originalBoxes = new Map(nodes.map(node => [node.id, { ...node.box }]));
  const depth = node => {
    let count = 0;
    while (node?.parent) { count++; node = byId.get(node.parent); }
    return count;
  };
  const groups = [...nodes].sort((a, b) => depth(a) - depth(b));
  for (const group of groups) {
    const allChildren = nodes.filter(node => node.parent === group.id);
    for (const child of allChildren) child.box = resizedChild(child.box, originalBoxes.get(group.id), group.box, child.placement, child.id);
    const layout = group.layout;
    if (!layout || layout.type === 'overlay') continue;
    const children = allChildren.filter(node => node.active !== false && node.layoutElement?.ignoreLayout !== true)
      .sort((a, b) => a.siblingIndex - b.siblingIndex);
    if (!children.length) continue;
    const [left, top, right, bottom] = layout.padding;
    const inner = { left: group.box.left + left, top: group.box.top + top,
      width: group.box.width - left - right, height: group.box.height - top - bottom };
    if (layout.type === 'grid') {
      const flexibleColumns = Math.max(1, Math.floor((inner.width + layout.spacing[0] + 0.001) / (layout.cellSize[0] + layout.spacing[0])));
      const columns = layout.constraint === 'fixedColumnCount' ? layout.constraintCount
        : layout.constraint === 'fixedRowCount' ? Math.ceil(children.length / layout.constraintCount)
          : flexibleColumns;
      const flexibleRows = Math.max(1, Math.floor((inner.height + layout.spacing[1] + 0.001) / (layout.cellSize[1] + layout.spacing[1])));
      const capacityRows = layout.constraint === 'fixedRowCount' ? layout.constraintCount : layout.constraint === 'fixedColumnCount' ? Math.ceil(children.length / columns) : flexibleRows;
      const cellsPerMainAxis = layout.startAxis === 'Horizontal' ? columns : capacityRows;
      const actualColumns = Math.max(1, Math.min(columns, layout.startAxis === 'Horizontal' ? children.length : Math.ceil(children.length / cellsPerMainAxis)));
      const rows = Math.max(1, Math.min(capacityRows, layout.startAxis === 'Vertical' ? children.length : Math.ceil(children.length / cellsPerMainAxis)));
      const totalWidth = actualColumns * layout.cellSize[0] + Math.max(0, actualColumns - 1) * layout.spacing[0];
      const totalHeight = rows * layout.cellSize[1] + Math.max(0, rows - 1) * layout.spacing[1];
      const alignX = layout.childAlignment.endsWith('Right') ? 1 : layout.childAlignment.endsWith('Center') ? 0.5 : 0;
      const alignY = layout.childAlignment.startsWith('Lower') ? 1 : layout.childAlignment.startsWith('Middle') ? 0.5 : 0;
      const originX = inner.left + (inner.width - totalWidth) * alignX;
      const originY = inner.top + (inner.height - totalHeight) * alignY;
      children.forEach((node, index) => {
        let column = layout.startAxis === 'Horizontal' ? index % cellsPerMainAxis : Math.floor(index / cellsPerMainAxis);
        let row = layout.startAxis === 'Horizontal' ? Math.floor(index / cellsPerMainAxis) : index % cellsPerMainAxis;
        if (layout.startCorner.endsWith('Right')) column = actualColumns - 1 - column;
        if (layout.startCorner.startsWith('Lower')) row = rows - 1 - row;
        node.box = { left: originX + column * (layout.cellSize[0] + layout.spacing[0]),
          top: originY + row * (layout.cellSize[1] + layout.spacing[1]), width: layout.cellSize[0], height: layout.cellSize[1] };
      });
    } else {
      const horizontal = layout.type === 'horizontal';
      const align = [layout.childAlignment.endsWith('Right') ? 1 : layout.childAlignment.endsWith('Center') ? 0.5 : 0,
        layout.childAlignment.startsWith('Lower') ? 1 : layout.childAlignment.startsWith('Middle') ? 0.5 : 0];
      const mainAxis = horizontal ? 0 : 1;
      const positions = children.map(() => [0, 0]);
      const dimensions = children.map(node => [node.box.width, node.box.height]);
      for (const axis of [0, 1]) {
        const control = axis === 0 ? layout.childControlWidth : layout.childControlHeight;
        const force = axis === 0 ? layout.childForceExpandWidth : layout.childForceExpandHeight;
        const available = axis === 0 ? inner.width : inner.height;
        const origin = axis === 0 ? inner.left : inner.top;
        const metrics = children.map((node, index) => {
          const element = node.layoutElement;
          const minimum = control ? Math.max(0, element?.minSize[axis] ?? 0) : dimensions[index][axis];
          const preferred = control ? Math.max(minimum, element?.preferredSize[axis] >= 0 ? element.preferredSize[axis] : dimensions[index][axis]) : minimum;
          const flexible = control ? Math.max(0, element?.flexibleSize[axis] ?? 0) : 0;
          return { minimum, preferred, flexible: force ? Math.max(1, flexible) : flexible };
        });
        if (axis !== mainAxis) {
          metrics.forEach((metric, index) => {
            const slot = Math.max(metric.minimum, Math.min(available, metric.flexible > 0 ? available : metric.preferred));
            positions[index][axis] = origin + (available - slot) * align[axis] + (control ? 0 : (slot - dimensions[index][axis]) * align[axis]);
            if (control) dimensions[index][axis] = slot;
          });
          continue;
        }
        const spacing = layout.spacing[axis];
        const gaps = Math.max(0, children.length - 1) * spacing;
        const minimum = metrics.reduce((sum, metric) => sum + metric.minimum, gaps);
        const preferred = metrics.reduce((sum, metric) => sum + metric.preferred, gaps);
        const flexible = metrics.reduce((sum, metric) => sum + metric.flexible, 0);
        const interpolation = minimum === preferred ? 0 : Math.max(0, Math.min(1, (available - minimum) / (preferred - minimum)));
        const surplus = available > preferred && flexible > 0 ? (available - preferred) / flexible : 0;
        let cursor = origin + (available > preferred && flexible === 0 ? (available - preferred) * align[axis] : 0);
        metrics.forEach((metric, index) => {
          const slot = metric.minimum + (metric.preferred - metric.minimum) * interpolation + metric.flexible * surplus;
          positions[index][axis] = cursor + (control ? 0 : (slot - dimensions[index][axis]) * align[axis]);
          if (control) dimensions[index][axis] = slot;
          cursor += slot + spacing;
        });
      }
      children.forEach((node, index) => {
        node.box = { left: positions[index][0], top: positions[index][1], width: dimensions[index][0], height: dimensions[index][1] };
      });
    }
  }
  return nodes;
}
