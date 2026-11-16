export const feedbackInstruction = '对用户的进度及结果使用中文自然语言模板 不直接输出JSON 参数表 节点ID 哈希或内部状态码 进度模板 当前进度：已完成的具体工作 结果：当前可见结果 待处理：实际问题或无 下一步：具体动作 完成模板 制作结果：实际完成内容 验收情况：已检查项及未验证项 耗时：delivery中的真实记录 产物：截图和Prefab路径 仅失败修复时用 问题： 修复了什么： 如何测试修复是否完成： 不把工具返回的结构检查通过写成视觉通过';

export function layoutFeedback(plan, changes, warnings) {
  const changed = changes.filter(item => item.geometryChanged).length;
  const usage = layoutUsage(plan);
  return `当前进度：布局计划已保存 共${plan.nodes.length - 1}个节点\n结果：${changed ? `新增或调整了${changed}个节点的位置或尺寸` : '参考位置已保留'} 计划包含${usage.layoutGroups}个排列组件 ${usage.placements}个锚点或拉伸规则 尚未写入Unity\n待处理：${warnings.length ? `有${warnings.length}项布局提示 需结合截图复核` : '未发现布局范围问题'}${usage.undeclaredGroups.length ? ` 有${usage.undeclaredGroups.length}个分组尚未声明布局策略` : ''}\n下一步：完成语义与素材预检后装配预制体 再核对实际截图`;
}

export function layoutUsage(plan) {
  const nodes = [...plan.nodes, ...(plan.components || []).flatMap(item => item.plan.nodes)];
  return { layoutGroups: nodes.filter(node => ['horizontal', 'vertical', 'grid'].includes(node.layout?.type)).length,
    placements: nodes.filter(node => node.placement).length,
    undeclaredGroups: nodes.filter(node => node.id !== 'root' && node.kind === 'group' && !node.layout).map(node => node.id) };
}
