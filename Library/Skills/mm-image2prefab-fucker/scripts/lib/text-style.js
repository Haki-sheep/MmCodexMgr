const fontStyles = ['Normal', 'Bold', 'Italic', 'BoldItalic'];
const alignments = ['TopLeft', 'Top', 'TopRight', 'Left', 'Center', 'Right', 'BottomLeft', 'Bottom', 'BottomRight', 'MidlineGeoAligned'];
const overflows = ['Overflow', 'Ellipsis', 'Truncate'];

export function textStyle(node) {
  const style = { fontStyle: node.fontStyle ?? 'Normal', alignment: node.alignment ?? 'Center',
    wordWrap: node.wordWrap ?? false, overflow: node.overflow ?? 'Overflow', ...node.autoSize !== undefined ? { autoSize: node.autoSize } : {} };
  for (const [field, values] of [['fontStyle', fontStyles], ['alignment', alignments], ['overflow', overflows]]) {
    if (!values.includes(style[field])) throw new Error(`${node.id} ${field}须为${values.join(' ')}`);
  }
  if (typeof style.wordWrap !== 'boolean') throw new Error(`${node.id} wordWrap须为布尔值`);
  if (node.autoSize !== undefined && typeof node.autoSize !== 'boolean') throw new Error(`${node.id} autoSize须为布尔值`);
  return style;
}
