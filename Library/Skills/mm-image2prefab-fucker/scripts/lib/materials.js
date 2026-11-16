import { approvedSource, assertCleanMaterial, fileDigest, now } from './core.js';

export const materialKinds = ['background', 'icon', 'decoration'];

export class MaterialError extends Error {
  constructor(code, message, details = {}) {
    const failure = { code, message, ...details };
    super(JSON.stringify(failure));
    this.details = failure;
  }
}

export function materialReviewState(task) {
  if (!task.materials?.length) return {};
  const used = new Set(task.materials.map(item => item.reviewId).filter(Boolean));
  let sequence = Math.max(task.materialReviewSequence || 0, ...[...used].map(id => /^m\d+$/.test(id) ? Number(id.slice(1)) : 0));
  const materials = task.materials.map(item => {
    if (item.reviewId) return item;
    const reviewId = `m${++sequence}`;
    used.add(reviewId);
    return { ...item, reviewId };
  });
  return { materials, materialReviewSequence: sequence };
}

export function materialReviewItems(materials) {
  return materials.map(item => ({ reviewId: item.reviewId, materialId: item.id, file: item.file,
    expectedSize: item.size, ...item.origin === 'local_extract' ? { sourceOverlay: item.derivation?.sourceOverlay } : {} }));
}

export function validateMaterialArgs(task, args) {
  const issues = [];
  const requireText = field => {
    if (typeof args[field] !== 'string' || !args[field].trim()) issues.push({ field, code: 'REQUIRED', message: `缺少${field}` });
  };
  if (!['import', 'extract', 'accept'].includes(args?.action)) return [{ field: 'action', code: 'INVALID_ACTION', message: 'action仅支持import extract accept' }];
  if (args.action === 'accept') {
    if (!args.review_id && !args.material_id) issues.push({ field: 'review_id', code: 'REQUIRED', message: '填写list或extract返回的短reviewId 如m1' });
    requireText('reason');
    if (!Array.isArray(args.expected_size) || args.expected_size.length !== 2 || !args.expected_size.every(value => Number.isInteger(value) && value > 0)) {
      issues.push({ field: 'expected_size', code: 'INVALID_SIZE', message: '填写核对后的实际位图宽高 两个正整数' });
    }
    const material = task.materials?.find(item => args.review_id ? item.reviewId === args.review_id : item.id === args.material_id);
    if (material?.origin === 'local_extract') requireText('crop_review');
  } else {
    if (!materialKinds.includes(args.material_kind)) issues.push({ field: 'material_kind', code: 'INVALID_KIND', message: '补图必须指定material_kind background icon或decoration' });
    if (args.semantic_role !== undefined && !['background', 'panel', 'icon', 'indicator', 'decoration'].includes(args.semantic_role)) issues.push({ field: 'semantic_role', code: 'INVALID_ROLE', message: '素材职责须为background panel icon indicator或decoration' });
    if (!args.image_path && !args.operation_id) issues.push({ field: 'image_path', code: 'REQUIRED', message: '填写image_path或operation_id' });
    if (args.action === 'extract') {
      if (!args.crop_box && !args.clear_boxes?.length && !args.chroma_key) issues.push({ field: 'crop_box', code: 'REQUIRED', message: 'extract须提供crop_box clear_boxes或chroma_key' });
      if (args.material_kind === 'background') issues.push({ field: 'material_kind', code: 'INVALID_KIND', message: 'extract不修补背景缺洞' });
    }
  }
  return issues;
}

export function materialRequest(task, args, sourceSize, generationSize = sourceSize) {
  const source = approvedSource(task);
  if (!sourceSize?.every(value => Number.isFinite(value) && value > 0)) throw new Error('补图缺少实际原图尺寸');
  if (!materialKinds.includes(args.material_kind)) throw new Error('补图必须指定material_kind background icon或decoration');
  const context = { purpose: 'material', kind: args.material_kind, semanticRole: args.semantic_role ?? (args.material_kind === 'decoration' ? undefined : args.material_kind), sourceHash: source.sha256, sourceSize,
    resumePhase: task.assembly ? 'assembly_planned' : task.decomposition ? 'layers_ready' : 'approved' };
  const instruction = args.material_kind === 'background'
    ? `仅修补参考定图的场景背景 保持构图与透视 输出${generationSize[0]}x${generationSize[1]}整幅完全不透明的干净背景 去除全部UI面板文字数值图标及独立前景 移除区域按邻近底色渐变纹理在背景素材内补齐 不留透明缺洞 不保留整张UI截图 不另叠色块遮字`
    : '仅输出指定的单个UI素材 保持参考定图的风格与轮廓 图标需透明背景 不拼整张界面或素材九宫格';
  return { context, prompt: `${instruction}\n${args.prompt}`, images: [...new Set([source.file, ...args.images || []])] };
}

// 补图属于原定图的修复素材 不进入候选定图状态机
export function materialResult(task, images, context) {
  if (approvedSource(task).sha256 !== context.sourceHash) throw new Error('补图所属定图已变化 请重新核对素材');
  const materials = images.map(image => {
    const warnings = [];
    if (context.kind === 'icon' && image.fullyOpaque) warnings.push('图标结果完全不透明 不能作为透明icon接受');
    if (context.requestedSize && image.size && context.requestedSize.some((value, index) => value !== image.size[index])) {
      warnings.push(`实际尺寸${image.size.join('x')}与请求${context.requestedSize.join('x')}不一致`);
    }
    return { ...image, sourceHash: context.sourceHash,
      kind: context.kind, semanticRole: context.semanticRole, referenceSize: context.sourceSize, requestedSize: context.requestedSize,
      preflightWarnings: warnings, state: 'awaiting_review', origin: image.origin === 'local_extract' ? image.origin : 'dxx_material' };
  });
  return { ...materialReviewState({ ...task, materials: [...task.materials || [], ...materials] }), files: materials.map(image => image.file),
    warnings: materials.flatMap(image => image.preflightWarnings.map(message => `${image.file} ${message}`)),
    phase: task.assembly ? 'assembly_planned' : task.decomposition ? 'layers_ready' : context.resumePhase };
}

export function acceptMaterial(task, args) {
  const issues = validateMaterialArgs(task, { ...args, action: 'accept' });
  if (issues.length) throw new MaterialError('MATERIAL_ARGUMENTS_INVALID', '素材验收参数不完整 未写入', { issues });
  const source = approvedSource(task);
  const matches = task.materials?.filter(item => args.review_id ? item.reviewId === args.review_id : item.id === args.material_id) || [];
  if (matches.length !== 1) throw new MaterialError('MATERIAL_REVIEW_ID_INVALID', '素材验收ID不存在或不唯一 请list读取当前任务编号', { field: 'review_id', reviewId: args.review_id });
  const material = matches[0];
  if (args.material_id && args.material_id !== material.id) throw new MaterialError('MATERIAL_REFERENCE_MISMATCH', 'review_id与material_id指向不同素材');
  if (material.sourceHash !== source.sha256) throw new MaterialError('MATERIAL_SOURCE_CHANGED', '补图不属于当前定图 请重新核对');
  if (fileDigest(material.file) !== material.sha256) throw new MaterialError('MATERIAL_CONTENT_CHANGED', '补图内容已变化 请重新导入并核对', { reviewId: material.reviewId });
  if (args.sha256 !== undefined && material.sha256 !== args.sha256) throw new MaterialError('MATERIAL_HASH_MISMATCH', '旧调用的sha256与素材不匹配 请改用review_id 不再抄写哈希', { field: 'sha256' });
  if (material.sizeAudit?.passed === false) throw new Error('服务返回补图尺寸不符合实际请求 不可接受 不自动重提收费任务');
  if (!Array.isArray(args.expected_size) || args.expected_size.length !== 2
    || !args.expected_size.every((value, index) => value === material.size[index])) throw new Error(`补图尺寸核对不一致 实际${material.size.join('x')} 请read_image并填写expected_size`);
  if (material.hasVisiblePixels === false) throw new Error('素材完全透明 没有可见像素 不可接受');
  assertCleanMaterial(task, material);
  if (material.origin === 'local_extract') {
    const derivation = material.derivation;
    if (!derivation?.sourceOverlay || !derivation.sourceOverlaySha256 || fileDigest(derivation.sourceOverlay) !== derivation.sourceOverlaySha256) {
      throw new MaterialError('MATERIAL_OVERLAY_CHANGED', '裁图缺少有效的原图裁框对照图 请重新生成素材预览', { reviewId: material.reviewId });
    }
    if (args.source_overlay_sha256 !== undefined && args.source_overlay_sha256 !== derivation.sourceOverlaySha256) {
      throw new MaterialError('MATERIAL_OVERLAY_HASH_MISMATCH', '旧调用的source overlay哈希不匹配 请改用review_id 不再抄写哈希', { field: 'source_overlay_sha256' });
    }
  }
  if (material.kind === 'icon' && material.fullyOpaque) throw new Error('图标仍为整幅不透明位图 不能把提示词中的透明当实际透明 请提取已有透明图层或明确修复背景');
  if (material.kind === 'background') {
    const document = task.decomposition?.document;
    const sizes = [material.requestedSize, material.referenceSize, document && [document.width, document.height]].filter(Boolean);
    if (!sizes.some(size => size.every((value, index) => value === material.size[index]))) throw new Error(`背景尺寸${material.size.join('x')}与定图及拆层坐标基准不匹配 请按目标尺寸补图`);
    if (!material.fullyOpaque) throw new Error('补图背景仍含透明像素 请修补完整背景 不用纯色垫底');
  }
  return { ...material, state: 'accepted', review: { reviewId: material.reviewId, reason: args.reason.trim(), expectedSize: args.expected_size,
    ...material.origin === 'local_extract' ? { sourceOverlaySha256: material.derivation.sourceOverlaySha256, cropReview: args.crop_review.trim() } : {}, at: now() } };
}
