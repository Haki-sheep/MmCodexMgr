import { normalizeCoordinates } from './core.js';
import { referenceBoxes } from './placement.js';
import { measureGrid } from './grid-measurement.js';

const flowTypes = ['horizontal', 'vertical', 'grid'];

function measuredFlow(layout, box, children, id) {
  if (!children.length) throw new Error(`容器${id}没有参与排列的子项 请核对结构后停止上报`);
  if (layout.type === 'grid') return measureGrid(layout, box, children, id);
  const horizontal = layout.type === 'horizontal';
  const start = horizontal ? 'left' : 'top';
  const size = horizontal ? 'width' : 'height';
  const gaps = children.slice(1).map((child, index) => child[start] - children[index][start] - children[index][size]);
  if (layout.spacing === undefined && gaps.some(gap => gap < -10)) throw new Error(`容器${id}的参考元素互相重叠 无法直接推导${layout.type}排列 请停止并报告结构疑点`);
  if (layout.spacing === undefined && gaps.length && Math.max(...gaps) - Math.min(...gaps) > 20) throw new Error(`容器${id}的参考间距不一致 请停止并报告容器结构疑点 不猜测子项坐标`);
  const spacing = gaps.length ? Math.max(0, gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length) : 0;
  const left = Math.min(...children.map(child => child.left));
  const top = Math.min(...children.map(child => child.top));
  const right = Math.max(...children.map(child => child.left + child.width));
  const bottom = Math.max(...children.map(child => child.top + child.height));
  return { childControlWidth: true, childControlHeight: true, ...layout,
    padding: layout.padding ?? [left - box.left, top - box.top, box.left + box.width - right, box.top + box.height - bottom].map(value => Math.max(0, Math.round(value))),
    spacing: layout.spacing ?? (horizontal ? [spacing, 0] : [0, spacing]) };
}

export function prepareComponentLayout(task, input) {
  const result = structuredClone(normalizeCoordinates(task, input));
  if (!result.nodes?.length) throw new Error('build需要完整元素与容器树 不自动猜测元素');
  const childrenOf = id => result.nodes.filter(node => (node.parent || 'root') === id);
  for (const group of result.nodes.filter(node => node.kind === 'group')) {
    if (!group.layout) throw new Error(`容器${group.id}必须声明layout 由AI选择横排竖排网格或艺术叠放 不使用静态布局默认值`);
    if (!group.box && !group.bounds && !group.layerId) {
      if (group.placement?.mode === 'stretch') continue;
      const children = childrenOf(group.id).filter(node => node.placement?.mode !== 'stretch');
      if (children.length) group.bounds = { nodeIds: children.map(node => node.id) };
      else if (group.semanticRole === 'background') group.placement = { mode: 'stretch', insets: { left: 0, top: 0, right: 0, bottom: 0 } };
      else throw new Error(`容器${group.id}缺少可测量的参考范围 请提供box bounds layerId或显式stretch 不从子项反推循环尺寸`);
    }
  }
  const references = referenceBoxes(result, task.decomposition.document, task.materials);
  const rootBox = { left: 0, top: 0, width: result.canvasSize[0], height: result.canvasSize[1] };
  const managedRoot = childrenOf('root').filter(node => !node.layoutElement?.ignoreLayout && node.semanticRole !== 'background');
  result.rootLayout ??= { type: managedRoot.length === 1 ? 'vertical' : 'overlay' };
  const groups = [{ id: 'root', layout: result.rootLayout }, ...result.nodes.filter(node => node.kind === 'group')];
  for (const group of groups) {
    const children = childrenOf(group.id);
    if (group.id === 'root') for (const child of children.filter(node => node.semanticRole === 'background')) {
      child.layoutElement = { ...child.layoutElement, ignoreLayout: true };
      child.placement ??= { mode: 'stretch', insets: { left: 0, top: 0, right: 0, bottom: 0 } };
    }
    if (flowTypes.includes(group.layout.type)) {
      const managed = children.filter(node => node.active !== false && !node.layoutElement?.ignoreLayout)
        .sort((a, b) => (a.order ?? result.nodes.indexOf(a)) - (b.order ?? result.nodes.indexOf(b)));
      const boxes = managed.map(node => references.get(node.id));
      if (boxes.some(box => !box)) throw new Error(`容器${group.id}的子项缺少尺寸参考 请提供layerId bounds或参考box`);
      group.layout = measuredFlow(group.layout, group.id === 'root' ? rootBox : references.get(group.id), boxes, group.id);
    }
    for (const child of children) if ((group.layout.type === 'overlay' || child.layoutElement?.ignoreLayout) && !child.placement) {
      const box = references.get(child.id);
      const parent = group.id === 'root' ? rootBox : references.get(group.id);
      if (!box || !parent) throw new Error(`叠放元素${child.id}缺少参考范围`);
      const x = (box.left + box.width / 2 - parent.left) / parent.width;
      const y = (box.top + box.height / 2 - parent.top) / parent.height;
      const horizontal = x < 1 / 3 ? 'Left' : x > 2 / 3 ? 'Right' : 'Center';
      const vertical = y < 1 / 3 ? 'top' : y > 2 / 3 ? 'bottom' : 'middle';
      const anchor = vertical === 'middle' && horizontal === 'Center' ? 'center' : vertical + horizontal;
      child.placement = { mode: 'reference', anchor };
    }
    if (group.id === 'root') result.rootLayout = group.layout;
  }
  result.layoutPolicy = 'components';
  if (result.components) result.components = result.components.map(component => prepareComponentLayout(task, { ...component, coordinateSize: component.canvasSize }));
  return result;
}

export function assertComponentLayout(plan) {
  const errors = [];
  const groups = plan.nodes.filter(node => node.kind === 'group' && node.active !== false);
  if (plan.layoutPolicy !== 'components') errors.push('新建必须使用ui_layout build提交组件布局树 不再接受静态坐标装配');
  for (const group of groups) if (!group.layout) errors.push(`容器${group.id}未声明布局组件策略`);
  if (!groups.some(node => flowTypes.includes(node.layout?.type))) errors.push('计划没有实际LayoutGroup组件');
  for (const component of plan.components || []) {
    try { assertComponentLayout(component.plan); } catch (error) { errors.push(error.message); }
  }
  if (errors.length) throw new Error(errors.join('\n'));
}
