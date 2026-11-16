export const qualityPolicy = Object.freeze({ version: 1, passScore: 80, weights: { layout: 40, images: 30, text: 20, background: 10 },
  ignoredDifferences: ['backgroundTexture', 'dotDistribution', 'minorGradient', 'textOutline'], imageTolerance: 10, fontSizeTolerance: 15 });

export function qualityReview(value) {
  if (!value || Object.keys(value).some(key => !['scores', 'deductions', 'functionalIssues'].includes(key))) throw new Error('quality须含scores deductions functionalIssues 不支持其他字段');
  const scores = value.scores;
  if (!scores || Object.keys(scores).length !== 4 || Object.entries(qualityPolicy.weights).some(([key, maximum]) => !Number.isFinite(scores[key]) || scores[key] < 0 || scores[key] > maximum)) throw new Error('quality.scores须为layout 0到40 images 0到30 text 0到20 background 0到10');
  if (!Array.isArray(value.deductions) || !Array.isArray(value.functionalIssues) || value.functionalIssues.some(item => typeof item !== 'string' || !item.trim())) throw new Error('quality须含deductions和functionalIssues数组 无功能缺陷传空数组');
  const totals = Object.fromEntries(Object.keys(scores).map(key => [key, 0]));
  for (const item of value.deductions) {
    if (!item || Object.keys(item).some(key => !['category', 'points', 'reason', 'evidenceRegion'].includes(key)) || !Object.hasOwn(totals, item.category)
      || !Number.isFinite(item.points) || item.points <= 0 || !item.reason?.trim() || !item.evidenceRegion?.trim()) throw new Error('每项扣分须含category points reason evidenceRegion 引用原图或截图区域 不凭空新增要求');
    totals[item.category] += item.points;
  }
  for (const [key, maximum] of Object.entries(qualityPolicy.weights)) if (Math.abs(maximum - scores[key] - totals[key]) > 0.001) throw new Error(`quality.${key}扣分明细与得分不一致`);
  const score = Object.values(scores).reduce((sum, number) => sum + number, 0);
  return { ...value, score, passScore: qualityPolicy.passScore, verdict: score >= qualityPolicy.passScore && !value.functionalIssues.length ? 'passed' : 'failed', assessment: '执行者按固定尺度进行的视觉评价 不是客观像素精度' };
}

export function workflowState(task) {
  if (task.operation?.state === 'unknown' || task.phase === 'production_failed') return { state: 'stopped', nextAction: 'report_and_stop', allowedActions: ['ui_task.get', 'ui_task.report_failure'] };
  if (task.phase === 'verification_failed') return { state: 'verification_failed', nextAction: 'report_and_stop', allowedActions: ['ui_task.get', 'ui_layout.patch', 'ui_unity.update'], instruction: '先报告 等人类要求修改 不自动循环返工' };
  if (task.operation?.state === 'running') return { state: 'running', nextAction: 'await_operation', operationId: task.operation.id, allowedActions: ['ui_task.get', 'ui_unity.preflight'] };
  if (!task.approval) return { state: 'source_required', nextAction: 'import_source', allowedActions: ['ui_source.inspect', 'ui_source.import_final'] };
  if (task.structure?.state !== 'ready') return { state: 'structure_required', nextAction: 'record_structure', allowedActions: ['ui_task.structure'] };
  if (!task.decomposition) return { state: 'analysis_ready', nextAction: task.regionRegistry && !task.regionAnalyses ? 'collect_regions' : 'plan_decomposition', allowedActions: ['ui_region.get', 'ui_region.view', 'ui_region.submit', 'ui_region.merge', 'dxx_decompose.plan', 'dxx_decompose.execute'] };
  if (task.workflowContractVersion === 2 && task.resourceReview?.state !== 'ready') return { state: 'resource_review', nextAction: 'bind_resources', allowedActions: ['ui_material.bind_layers', 'ui_material.inspect', 'ui_material.split', 'ui_task.background', 'ui_task.authorize_material'] };
  if (task.phase === 'verification_ready' && task.visualReview?.verdict === 'passed' && task.visualReview.sourceSha256 === task.approval.sha256) return { state: 'delivered', nextAction: 'deliver', allowedActions: ['ui_task.get'] };
  if (task.phase === 'verification_ready') return { state: 'completion_review', nextAction: 'report_completion', allowedActions: ['ui_task.report_completion'] };
  return { state: 'layout_ready', nextAction: task.appliedAssembly ? 'patch_layout' : 'build', allowedActions: ['ui_layout.build', 'ui_layout.patch', 'ui_unity.preflight', 'ui_unity.update'] };
}

export function inlineOperation(name, action) {
  return name === 'dxx_image' && action !== 'preflight' || name === 'dxx_decompose' && action !== 'plan'
    || name === 'ui_layout' && action === 'build' || name === 'ui_unity' && ['assemble', 'update', 'inspect'].includes(action);
}

export function assertWorkflowAction(task, name, args) {
  if (task.workflowContractVersion !== 2) return;
  if (name === 'dxx_decompose') {
    if (task.structure?.state !== 'ready' || task.structure.sourceHash !== task.approval?.sha256) throw new Error('WORKFLOW_STRUCTURE_REQUIRED 先记录本定图结构及语义疑点 不越过structure');
    if (task.regionRegistry && task.regionAnalyses?.state !== 'ready') throw new Error('WORKFLOW_REGIONS_PENDING 等各区域submit后merge完成 不跳过未完成分析');
  }
  if (name === 'ui_layout' && ['build', 'patch', 'repeat'].includes(args.action) && !task.decomposition) throw new Error('WORKFLOW_DECOMPOSITION_REQUIRED 先完成原定图拆层 不提前写入Prefab');
}
