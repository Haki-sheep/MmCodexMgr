export function expandLayoutInput(task, input) {
  const result = structuredClone(input);
  if (result.font && result.fontId) throw new Error('公共字体font与fontId不能同时填写');
  const roles = (field, id) => {
    const references = task.resourceReview?.bindings.filter(binding => binding.references.some(ref => ref.kind === field && ref.id === id)) || [];
    return references.map(binding => task.resourceCatalog.find(resource => resource.id === binding.resourceId)?.semanticRole).filter(Boolean);
  };
  for (const node of result.nodes || []) {
    const signals = [node.text !== undefined ? 'text' : null, node.layerId || node.materialId || node.sprite ? 'image' : null,
      node.layout ? 'group' : null, node.componentId || node.prefab ? 'prefab' : null].filter(Boolean);
    if (!node.kind) {
      if (signals.length !== 1) throw new Error(`节点${node.id}类型存在歧义 请显式填写kind并移除冲突字段`);
      node.kind = signals[0];
    } else {
      const allowed = node.kind === 'button' ? ['image'] : node.kind === 'group' ? ['group', 'image'] : [node.kind];
      if (signals.some(signal => !allowed.includes(signal))) throw new Error(`节点${node.id}的kind与内容字段冲突`);
    }
    if (typeof node.layout === 'string') node.layout = { type: node.layout };
    if (!node.semanticRole) {
      if (node.kind === 'image') {
        let candidates = node.layerId ? roles('layer', node.layerId) : node.materialId ? roles('material', node.materialId) : [];
        if (!candidates.length && node.materialId) {
          const material = task.materials?.find(item => item.id === node.materialId && item.state === 'accepted');
          if (material?.semanticRole) candidates = [material.semanticRole];
        }
        const distinct = [...new Set(candidates)];
        if (distinct.length !== 1) throw new Error(`图片${node.id}没有唯一已验收素材职责 请显式填写semanticRole`);
        node.semanticRole = distinct[0];
      } else node.semanticRole = { text: 'label', button: 'button', prefab: 'item', group: node.layout?.type === 'overlay' ? 'panel' : 'list' }[node.kind];
    }
    if (node.kind === 'text' && !node.font && !node.fontId) {
      if (result.font) node.font = result.font;
      if (result.fontId) node.fontId = result.fontId;
    }
  }
  if (typeof result.rootLayout === 'string') result.rootLayout = { type: result.rootLayout };
  if (result.components) result.components = result.components.map(component => expandLayoutInput(task, {
    ...component, ...!component.font && !component.fontId ? { font: result.font, fontId: result.fontId } : {}
  }));
  return result;
}
