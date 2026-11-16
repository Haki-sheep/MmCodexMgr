export function measureGrid(layout, box, children, id) {
  if (layout.cellSize && (layout.constraint === 'flexible' || layout.constraintCount !== undefined)) return layout;
  const fail = () => { throw new Error(`容器${id}不是可测量的规则Grid 请显式填写cellSize constraintCount spacing padding及排列方向`); };
  if (!children.length || !box || (layout.startCorner && layout.startCorner !== 'UpperLeft') || (layout.startAxis && layout.startAxis !== 'Horizontal')) fail();
  const near = (a, b) => Math.abs(a - b) <= 1;
  const size = [children[0].width, children[0].height];
  if (children.some(child => !near(child.width, size[0]) || !near(child.height, size[1]))) fail();
  const axisPositions = key => {
    const positions = [];
    for (const value of children.map(child => child[key]).sort((a, b) => a - b)) {
      if (!positions.length || !near(value, positions[positions.length - 1])) positions.push(value);
    }
    return positions;
  };
  const columns = axisPositions('left');
  const rows = axisPositions('top');
  if (children.some((child, index) => !near(child.left, columns[index % columns.length]) || !near(child.top, rows[Math.floor(index / columns.length)]))) fail();
  const gap = (positions, dimension) => {
    if (positions.length < 2) return 0;
    const step = positions[1] - positions[0];
    if (step < dimension || positions.some((value, index) => !near(value, positions[0] + index * step))) fail();
    return step - dimension;
  };
  const spacing = [gap(columns, size[0]), gap(rows, size[1])];
  const right = Math.max(...children.map(child => child.left + child.width));
  const bottom = Math.max(...children.map(child => child.top + child.height));
  const padding = [columns[0] - box.left, rows[0] - box.top, box.left + box.width - right, box.top + box.height - bottom];
  if (padding.some(value => value < -0.001)) fail();
  const constraint = layout.constraint ?? 'fixedColumnCount';
  return { ...layout, constraint, cellSize: layout.cellSize ?? size,
    constraintCount: layout.constraintCount ?? (constraint === 'fixedRowCount' ? rows.length : columns.length),
    spacing: layout.spacing ?? spacing, padding: layout.padding ?? padding.map(Math.round) };
}
