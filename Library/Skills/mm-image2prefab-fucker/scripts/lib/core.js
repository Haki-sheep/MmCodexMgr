import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, realpathSync, existsSync, lstatSync } from 'node:fs';
import path from 'node:path';
import { textStyle } from './text-style.js';
import { normalizeLayoutElement, normalizeLayoutGroup, projectLayoutBounds } from './layout-config.js';
import { normalizePlacement, normalizeContent, referenceBoxes, placedBox, rectOf, scalePlacement, visualTolerance } from './placement.js';

export const PRESETS = ['ui-coordinator', 'ui-visual', 'ui-ugui', 'ui-preparation'];
export const NODE_FIELDS = new Set(['id', 'name', 'parent', 'kind', 'layerId', 'materialId', 'box', 'bounds', 'order', 'zIndex', 'active', 'sprite', 'sliced', 'color', 'text', 'font', 'fontId', 'fontSize', 'textKey', 'prefab', 'componentId', 'overrides', 'semanticRole', 'repeatKey', 'bindKey', 'layout', 'layoutElement', 'placement', 'content', 'fontStyle', 'alignment', 'wordWrap', 'overflow', 'autoSize']);
export const now = () => new Date().toISOString();
export const digest = value => createHash('sha256').update(value).digest('hex');
export const fileDigest = file => digest(readFileSync(file));
export const jsonDigest = value => digest(JSON.stringify(value));
export const makeId = prefix => `${prefix}-${randomUUID()}`;

export function layerAssetStem(id) {
  return /^[a-zA-Z0-9_-]+$/.test(id) ? id : `layer~${jsonDigest(id)}`;
}

function defaultVisualOrder(source, layer) {
  if (source.kind === 'text') return 100;
  const roles = { background: 0, panel: 0, button: 0, icon: 10, decoration: 20, indicator: 30 };
  return roles[source.semanticRole] ?? (source.kind === 'button' ? 0 : layer?.zIndex ?? 0);
}

export function fontReference(task, node) {
  if (node.fontId && node.font) throw new Error(`nodes[${node.id}].fontId与font不能同时指定 清除旧字段请patch传null`);
  const font = node.fontId ? task.fontCatalog?.fonts.find(item => item.id === node.fontId)?.path : node.font;
  if (!font) throw new Error(`nodes[${node.id}].fontId不存在 ${node.fontId || ''} 请使用本任务preflight返回的fontId或Assets字体路径`);
  try { return assetPath(font, '.asset'); }
  catch (error) { throw new Error(`nodes[${node.id}].font无效 实际值=${JSON.stringify(font)} 要求Assets/...asset 不接受字体名称`, { cause: error }); }
}

export function assertCleanMaterial(task, material, role = material.semanticRole) {
  if ((role === 'background' || material.kind === 'background') && material.sha256 === task.approval?.sha256) throw new Error('原始整张UI定图不能作为干净背景 复制改名仍拒绝 请提供去除独立前景后的底板');
  if (['icon', 'indicator'].includes(role) && material.fullyOpaque) throw new Error(`独立${role}素材完全不透明 不能通过decoration分类绕过透明要求 请提供干净透明素材`);
}

export function assertInside(root, target) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error('路径越界');
  return path.resolve(target);
}

export function regularFile(file) {
  if (!path.isAbsolute(file)) throw new Error('文件必须使用绝对路径');
  if (!lstatSync(file).isFile() || lstatSync(file).isSymbolicLink()) throw new Error('需要真实文件 禁止链接');
  if (path.resolve(realpathSync(file)).toLowerCase() !== path.resolve(file).toLowerCase()) throw new Error('文件位于链接目录');
  return file;
}

export function assetPath(value, extension) {
  if (typeof value !== 'string' || !value.startsWith('Assets/') || value.includes('\\') || value.split('/').some(x => !x || x === '.' || x === '..') || /[<>:"|?*\x00-\x1f]/.test(value)) throw new Error('无效 Unity 资产路径');
  if (extension && !value.toLowerCase().endsWith(extension)) throw new Error(`资产必须是 ${extension}`);
  return value;
}

export function normalizeManifest(raw, directory) {
  const width = raw.documentWidth;
  const height = raw.documentHeight;
  if (!(width > 0 && height > 0) || !Array.isArray(raw.items)) throw new Error('拆层清单缺少 documentWidth documentHeight items');
  const ids = new Set();
  const layers = raw.items.map(item => {
    if (!item.id || ids.has(item.id)) throw new Error('拆层 ID 缺失或重复');
    ids.add(item.id);
    const placement = item.placement;
    if (!placement || !['left', 'top', 'width', 'height'].every(k => Number.isFinite(placement[k])) || placement.width <= 0 || placement.height <= 0 || !Number.isFinite(item.zIndex)) throw new Error(`图层坐标无效 ${item.id}`);
    const file = assertInside(path.join(directory, 'layers'), path.resolve(directory, 'layers', item.file));
    regularFile(file);
    return { id: item.id, name: item.name || item.id, role: item.role, ...item.semanticRole ? { semanticRole: item.semanticRole } : {}, file, placement, zIndex: item.zIndex, visible: item.visible !== false, opacity: item.opacity ?? 100,
      ...item.batchId ? { batchId: item.batchId, providerLayerId: item.providerLayerId, providerZIndex: item.providerZIndex, resourceIds: item.resourceIds } : {} };
  });
  return { width, height, ...raw.model ? { model: raw.model } : {}, ...raw.coordinateOrigin ? { coordinateOrigin: raw.coordinateOrigin } : {},
    ...raw.batches ? { batches: raw.batches, resourceMap: raw.resourceMap, resourceCatalog: raw.resourceCatalog || [], zIndexOrigin: raw.zIndexOrigin } : {}, layers: layers.sort((a, b) => a.zIndex - b.zIndex) };
}

export function approveCandidate(task, candidateId, expectedHash, approver = 'user') {
  if (approver !== 'user') throw new Error('只有用户能确认定图');
  const candidate = task.candidates.find(x => x.id === candidateId);
  if (candidate?.sizeAudit?.passed === false) throw new Error('候选图片实际尺寸与请求不符 不可确认 请核对原请求与产物 不自动重提');
  if (!candidate || candidate.sha256 !== expectedHash || fileDigest(candidate.file) !== expectedHash) throw new Error('图片已变化 请重新查看并确认');
  return { ...task, approval: { candidateId, sha256: expectedHash, at: now(), by: 'user' }, phase: 'approved', updatedAt: now() };
}

export function approvedSource(task) {
  const candidate = task.candidates.find(x => x.id === task.approval?.candidateId);
  if (candidate?.sizeAudit?.passed === false) throw new Error('定图尺寸校验未通过');
  if (!candidate || task.approval.by !== 'user' || candidate.sha256 !== task.approval.sha256 || fileDigest(candidate.file) !== candidate.sha256) throw new Error('等待用户在会话中确认当前图片版本');
  return candidate;
}

function legacyConversationReview(task, candidateId, expectedHash, agent) {
  if (task.phase !== 'awaiting_approval' || task.candidates.length !== 1) return;
  const candidate = task.candidates[0];
  if (candidate.id !== candidateId || candidate.sha256 !== expectedHash) return;
  const file = candidate.file.replaceAll('\\', '/').toLowerCase();
  for (let seq = agent.session.seq - 1; seq >= 0; seq--) {
    const event = agent.session.eventAt(seq);
    if (event?.type !== 'assistant/message') continue;
    const message = event.data.message || event.data;
    const displayed = (message.content || []).filter(block => block.type === 'text').some(block => {
      const text = block.text.replaceAll('\\', '/').toLowerCase();
      return text.includes('![') && (text.includes(`](${file})`) || text.includes(`](<${file}>)`));
    });
    if (displayed) return { agentId: agent.id, candidateId, sha256: expectedHash,
      candidatesHash: jsonDigest(task.candidates.map(item => [item.id, item.sha256])), afterSeq: seq + 1, recoveredFromHistory: true };
  }
}

export function conversationApproval(task, candidateId, expectedHash, agent, confirmation, confirmationMessageId) {
  if (task.ownerAgentId !== agent.id) throw new Error('请在任务所属的总控会话中确认定图');
  const review = task.conversationReview || legacyConversationReview(task, candidateId, expectedHash, agent);
  if (!review || review.agentId !== agent.id || review.candidateId !== candidateId || review.sha256 !== expectedHash) throw new Error('先在会话中展示需要确认的图片');
  if (review.candidatesHash !== jsonDigest(task.candidates.map(candidate => [candidate.id, candidate.sha256]))) throw new Error('候选版本已更新 请重新展示图片后等待用户定图');
  let message;
  for (let seq = agent.session.seq - 1; seq >= review.afterSeq; seq--) {
    const event = agent.session.eventAt(seq);
    if (event?.type === 'user/message' && event.data.source?.kind === 'user') { message = event.data; break; }
  }
  const text = message?.content.filter(block => block.type === 'text').map(block => block.text).join('\n') || '';
  if (confirmationMessageId !== undefined && confirmationMessageId !== message?.id) throw new Error('确认消息ID必须是展示后最新真实用户消息ID');
  const quote = confirmation === undefined ? text.trim() : confirmation.trim();
  const affirmative = /^(?:我(?:确认|同意)(?:这张|这版|当前版本)?|确认(?:定图|这张|这版|此图|此版本|当前版本)?|同意(?:这张|这版|此版本)?|这(?:张|版)(?:可以了?|没问题|通过|就用它)|就用这(?:张|版)|可以了?|没问题|通过|ok|yes|approve(?:d)?)(?:[\s，,。.!！:：]|$)/iu;
  const namedFinal = /^(?:我)?确认(?:这张|这版|此图|当前版本).{1,80}(?:为|作为)(?:最终)?定图/u;
  const refusal = /(?:不(?:要|能|用)?确认|不(?:同意|通过|可以|满意)|暂不|别确认|先别|需要修改|打回|重做|重新生成|是否|能否|[?？])/u;
  if (!message || !quote || text.trim() !== quote || !affirmative.test(quote) && !namedFinal.test(quote) || refusal.test(text)) throw new Error('尚未收到展示图片后的明确用户定图回复 confirmation须逐字引用用户完整消息 请继续等待 不可代替用户确认');
  const next = approveCandidate(task, candidateId, expectedHash);
  next.conversationReview = review;
  next.approval = { ...next.approval, via: 'conversation', agentId: agent.id, messageId: message.id, confirmation: quote };
  return next;
}

function rectangle(value, label) {
  if (Array.isArray(value) && value.length === 4) value = Object.fromEntries(['left', 'top', 'width', 'height'].map((key, index) => [key, value[index]]));
  if (!value || !['left', 'top', 'width', 'height'].every(k => Number.isFinite(value[k])) || value.width <= 0 || value.height <= 0) throw new Error(`无效矩形 ${label}`);
  return value;
}

function rgba(value, label) {
  if (typeof value === 'string' && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value)) {
    const hex = value.slice(1);
    value = [0, 2, 4, 6].map(index => index === 6 && hex.length === 6 ? 1 : parseInt(hex.slice(index, index + 2), 16) / 255);
  }
  if (!Array.isArray(value) || value.length !== 4 || !value.every(item => Number.isFinite(item) && item >= 0 && item <= 1)) throw new Error(`${label} RGBA须为0到1的四数数组 或#RRGGBB #RRGGBBAA`);
  return value;
}

function orderedNodes(nodes) {
  const result = [];
  const pending = new Map(nodes.map(node => [node.id, node]));
  if (pending.size !== nodes.length || pending.has('root')) throw new Error('节点ID重复或占用root');
  const visited = new Set(['root']);
  while (pending.size) {
    const ready = [...pending.values()].filter(node => visited.has(node.parent || 'root'));
    if (!ready.length) throw new Error(`父节点缺失或层级循环 ${[...pending.keys()].join(' ')}`);
    for (const node of ready) { result.push(node); pending.delete(node.id); visited.add(node.id); }
  }
  return result;
}

export function canvasSize(task, input = {}) {
  const document = task.decomposition?.document;
  if (!document) throw new Error('先完成拆层');
  const source = task.candidates.find(item => item.id === task.approval?.candidateId);
  const size = input.canvasSize ?? document.sourceSize ?? (source?.width > 0 && source?.height > 0 ? [source.width, source.height] : [document.width, document.height]);
  if (!Array.isArray(size) || size.length !== 2 || !size.every(value => Number.isFinite(value) && value > 0)) throw new Error('canvas_size 须为正数宽高数组');
  return size;
}

// 显式矩形映射至目标设计尺寸 图层 placement 另从 document 坐标转换
export function normalizeCoordinates(task, input) {
  const targetSize = canvasSize(task, input);
  const size = input.coordinateSize ?? targetSize;
  if (!Array.isArray(size) || size.length !== 2 || !size.every(value => Number.isFinite(value) && value > 0)) throw new Error('coordinate_size 须为正数宽高数组');
  const scaleX = targetSize[0] / size[0];
  const scaleY = targetSize[1] / size[1];
  const layout = value => typeof value === 'string' ? { type: value } : value && { ...value,
    ...value.cellSize ? { cellSize: value.cellSize.map((item, index) => item * [scaleX, scaleY][index]) } : {},
    ...value.spacing !== undefined ? { spacing: Array.isArray(value.spacing) ? value.spacing.map((item, index) => item * [scaleX, scaleY][index]) : value.spacing * (value.type === 'vertical' ? scaleY : scaleX) } : {},
    ...value.padding ? { padding: value.padding.map((item, index) => Math.round(item * [scaleX, scaleY, scaleX, scaleY][index])) } : {} };
  return { ...input, canvasSize: targetSize, coordinateSize: targetSize, ...input.rootLayout ? { rootLayout: layout(input.rootLayout) } : {}, nodes: input.nodes?.map(node => {
    const box = node.box ? rectangle(node.box, node.id) : null;
    return { ...node, ...box ? { box: { left: box.left * scaleX, top: box.top * scaleY, width: box.width * scaleX, height: box.height * scaleY } } : {},
      ...node.placement != null ? { placement: scalePlacement(node.placement, scaleX, scaleY, node.id) } : {},
      ...node.fontSize !== undefined ? { fontSize: node.fontSize * scaleY } : {},
      ...node.layout ? { layout: layout(node.layout) } : {},
      ...node.layoutElement ? { layoutElement: { ...node.layoutElement, ...Object.fromEntries(['minSize', 'preferredSize'].filter(key => node.layoutElement[key]).map(key => [key, node.layoutElement[key].map((item, index) => item < 0 ? item : item * [scaleX, scaleY][index])])) } } : {} };
  }) };
}

export function assertPlanBounds(plan) {
  const invalid = plan.nodes.filter(node => ['left', 'top', 'width', 'height'].some(key => !Number.isFinite(node.box[key])) || node.box.width <= 0 || node.box.height <= 0);
  if (invalid.length) throw new Error(`布局产生无效尺寸 ${invalid.map(node => node.id).join(' ')}`);
  const [toleranceX, toleranceY] = plan.visualTolerance || [0.5, 0.5];
  const errors = plan.nodes.filter(node => node.active !== false && (node.box.left < -toleranceX || node.box.top < -toleranceY
    || node.box.left + node.box.width > plan.width + toleranceX || node.box.top + node.box.height > plan.height + toleranceY))
    .map(node => `${node.id} box=${JSON.stringify(node.box)}`);
  if (errors.length) throw new Error(`布局超出画布 ${plan.width}x${plan.height} 请统一 coordinate_size 禁止部分节点单独缩放\n${errors.join('\n')}`);
}

// AI提交语义与布局规则 工具统一转换为父节点局部坐标
export function compileAssembly(task, input) {
  approvedSource(task);
  const document = task.decomposition?.document;
  if (!document || task.decomposition.sourceHash !== task.approval.sha256) throw new Error('缺少与定图匹配的拆层结果');
  input = normalizeCoordinates(task, input);
  assetPath(input.prefabPath, '.prefab');
  if (!Array.isArray(input.nodes) || !input.nodes.length) throw new Error('装配计划需要 nodes');
  const layerMap = new Map(document.layers.map(x => [x.id, x]));
  const nodeMap = new Map();
  const [width, height] = input.canvasSize;
  const rootBox = { left: 0, top: 0, width, height };
  const references = referenceBoxes(input, document, task.materials);
  const root = { id: 'root', name: input.name || 'UIRoot', parent: '', kind: 'group', box: rootBox, rect: { anchorMin: [0.5, 0.5], anchorMax: [0.5, 0.5], pivot: [0.5, 0.5], position: [0, 0], size: [width, height] }, zIndex: -1, active: true };
  nodeMap.set('root', root);
  if (input.rootLayout) root.layout = normalizeLayoutGroup(input.rootLayout, 'root');
  const imports = new Map();
  const folder = input.prefabPath.slice(0, input.prefabPath.lastIndexOf('/'));
  for (const source of orderedNodes(input.nodes)) {
    const unknown = Object.keys(source).filter(key => !NODE_FIELDS.has(key));
    if (unknown.length) throw new Error(`节点${source.id}包含不支持的字段 ${unknown.join(' ')} 请使用已公布字段 文字颜色使用color 当前不支持outline及shadow 旧计划可patch将这些未知字段传null清除`);
    if (!/^[a-zA-Z0-9_-]+$/.test(source.id) || nodeMap.has(source.id)) throw new Error(`节点ID无效或重复 ${source.id}`);
    if (!['group', 'image', 'button', 'text', 'prefab'].includes(source.kind)) throw new Error(`不支持控件 ${source.kind}`);
    const parent = nodeMap.get(source.parent || 'root');
    if (!parent || parent.kind === 'text') throw new Error('父节点必须先于子节点定义且不能是文字');
    if (source.layout !== undefined && source.kind !== 'group') throw new Error(`布局组件只能挂在group节点 ${source.id}`);
    const layout = source.layout === undefined ? undefined : normalizeLayoutGroup(source.layout, source.id);
    let layoutElement = source.layoutElement === undefined ? undefined : normalizeLayoutElement(source.layoutElement, source.id);
    const placementRule = source.placement == null ? undefined : normalizePlacement(source.placement, source.id);
    const content = source.content == null ? undefined : normalizeContent(source.content, source.id);
    if (content && !['image', 'button'].includes(source.kind)) throw new Error(`${source.id}.content仅支持image或button`);
    if (content?.fit === 'contain' && source.sliced) throw new Error(`${source.id}九宫格不能与contain并用`);
    if (placementRule && parent.layout && parent.layout.type !== 'overlay' && !layoutElement?.ignoreLayout) throw new Error(`${source.id}父容器已管理排列 不能同时设置placement 装饰请设置layoutElement.ignoreLayout或放入overlay容器`);
    if (parent.layout?.type === 'grid' && layoutElement && [layoutElement.minSize, layoutElement.preferredSize, layoutElement.flexibleSize].some(size => size.some(value => value >= 0))) {
      throw new Error(`Grid子节点不支持LayoutElement尺寸提示 ${source.id}`);
    }
    const layer = source.layerId ? layerMap.get(source.layerId) : null;
    const material = source.materialId ? task.materials?.find(item => item.id === source.materialId) : null;
    if (source.materialId && (source.layerId || source.sprite || !['image', 'button'].includes(source.kind))) throw new Error('materialId仅用于图片或按钮 且不可同时指定layerId或sprite');
    if (source.materialId && (!material || material.state !== 'accepted' || material.sourceHash !== task.approval.sha256)) throw new Error(`素材未经核对或定图已变化 ${source.materialId} 请先ui_material accept`);
    if (material && fileDigest(material.file) !== material.sha256) throw new Error(`补图内容已变化 ${material.id}`);
    if (material) assertCleanMaterial(task, material, source.semanticRole);
    if (layer && source.semanticRole === 'background') assertCleanMaterial(task, { sha256: fileDigest(layer.file) }, 'background');
    if (source.layerId && !layer) throw new Error(`图层不存在 ${source.layerId}`);
    if (layer?.role === 'base' && source.kind !== 'group') throw new Error('base 可能是原图预览 不可直接当作去字背景 请选择经检查的干净背景层');
    const box = placedBox(references.get(source.id), parent.box, placementRule, source.id);
    if (parent.layout && ['horizontal', 'vertical'].includes(parent.layout.type) && !layoutElement?.ignoreLayout && (parent.layout.childControlWidth || parent.layout.childControlHeight)) {
      layoutElement = normalizeLayoutElement(layoutElement || {}, source.id);
      layoutElement.preferredSize = layoutElement.preferredSize.map((value, axis) => value >= 0 ? value : axis === 0 ? box.width : box.height);
      layoutElement.flexibleSize = layoutElement.flexibleSize.map(value => Math.max(0, value));
      layoutElement.minSize = layoutElement.minSize.map(value => Math.max(0, value));
    }
    const node = { id: source.id, name: source.name || source.id, parent: parent.id, kind: source.kind, box, zIndex: source.zIndex ?? defaultVisualOrder(source, layer), active: source.active !== false, rect: { anchorMin: [0, 1], anchorMax: [0, 1], pivot: [0.5, 0.5], position: [box.left - parent.box.left + box.width / 2, -(box.top - parent.box.top) - box.height / 2], size: [box.width, box.height] },
      ...source.semanticRole ? { semanticRole: source.semanticRole } : {},
      ...source.repeatKey ? { repeatKey: source.repeatKey } : {},
      ...source.bindKey ? { bindKey: source.bindKey } : {},
      ...source.order !== undefined ? { order: source.order } : {},
      ...placementRule ? { placement: placementRule } : {},
      ...content ? { content, preserveAspect: content.fit === 'contain' } : {},
      ...layout ? { layout } : {},
      ...layoutElement ? { layoutElement } : {} };
    if (source.kind === 'image' || source.kind === 'button') {
      if (material) {
        const destination = assetPath(`${folder}/Sprites/${material.id}${path.extname(material.file).toLowerCase()}`);
        imports.set(material.id, { source: material.file, destination, sha256: material.sha256 });
        node.sprite = destination;
        node.materialId = material.id;
      }
      else if (source.sprite) node.sprite = assetPath(source.sprite);
      else if (layer) {
        const extension = path.extname(layer.file).toLowerCase();
        const destination = assetPath(`${folder}/Sprites/${layerAssetStem(layer.id)}${extension}`);
        imports.set(layer.id, { source: layer.file, destination, sha256: fileDigest(layer.file) });
        node.sprite = destination;
      }
      else if (source.kind !== 'button' && source.color === undefined) throw new Error(`图片节点需要layerId sprite或纯色color ${source.id}`);
      node.color = rgba(source.color ?? [1, 1, 1, node.sprite ? (layer?.opacity ?? 100) / 100 : 0], source.id);
      node.sliced = source.sliced === true;
      node.raycast = source.kind === 'button';
    }
    if (source.kind === 'text') {
      if (typeof source.text !== 'string' || !(source.font || source.fontId) || !(source.fontSize > 0)) throw new Error(`nodes[${source.id}]文字需要text fontId或font及fontSize`);
      if (/^\s/.test(source.text)) throw new Error(`文字${source.id}禁止使用前导空白定位 请调整box或alignment`);
      node.text = source.text;
      node.font = fontReference(task, source);
      node.fontSize = source.fontSize;
      Object.assign(node, textStyle(source));
      node.textKey = source.textKey || source.id;
      node.color = rgba(source.color ?? [1, 1, 1, 1], source.id);
    }
    if (source.kind === 'prefab') {
      const component = input.components?.find(item => item.id === source.componentId);
      if (source.componentId && !component) throw new Error(`组件定义不存在 ${source.componentId}`);
      node.prefab = assetPath(component?.prefabPath || source.prefab, '.prefab');
      if (source.componentId) node.componentId = source.componentId;
      const overrides = (source.overrides || []).map(override => {
        if (override.fontId) {
          const font = fontReference(task, { ...override, id: `${source.id}/${override.targetId ?? JSON.stringify(override.path)}` });
          const { fontId, ...fields } = override;
          override = { ...fields, font };
        }
        if (!override.materialId) return override;
        if (override.sprite) throw new Error('实例覆盖materialId与sprite不可同时指定');
        const material = task.materials?.find(item => item.id === override.materialId);
        if (!material || material.state !== 'accepted' || material.sourceHash !== task.approval.sha256) throw new Error(`实例覆盖素材未经核对 ${override.materialId}`);
        if (fileDigest(material.file) !== material.sha256) throw new Error(`实例覆盖素材内容已变化 ${material.id}`);
        const target = component?.nodes.find(node => node.id === override.targetId);
        assertCleanMaterial(task, material, target?.semanticRole);
        const destination = assetPath(`${folder}/Sprites/${material.id}${path.extname(material.file).toLowerCase()}`);
        imports.set(material.id, { source: material.file, destination, sha256: material.sha256 });
        const { materialId, ...fields } = override;
        return { ...fields, sprite: destination };
      });
      node.overrides = normalizeOverrides(overrides, component);
    }
    nodeMap.set(node.id, node);
  }
  const nodes = [...nodeMap.values()];
  const sourceMap = new Map(input.nodes.map(node => [node.id, node]));
  // 分组优先继承非文字内容层级 避免局部文字描边排序改变整个分组的遮挡关系
  for (const node of [...nodes].reverse()) {
    const source = sourceMap.get(node.id);
    if (node.kind !== 'group' || !source || source.zIndex !== undefined || source.layerId) continue;
    const children = nodes.filter(child => child.parent === node.id && child.active);
    const artwork = children.filter(child => child.kind !== 'text');
    if (children.length) node.zIndex = Math.min(...(artwork.length ? artwork : children).map(child => child.zIndex));
  }
  for (const parent of nodes) {
    const siblings = nodes.filter(n => n.parent === parent.id).sort((a, b) =>
      Number(b.semanticRole === 'background') - Number(a.semanticRole === 'background') || (parent.layout && parent.layout.type !== 'overlay'
        ? (a.order ?? input.nodes.findIndex(node => node.id === a.id)) - (b.order ?? input.nodes.findIndex(node => node.id === b.id)) : a.zIndex - b.zIndex));
    siblings.forEach((n, i) => { n.siblingIndex = i; });
  }
  const plan = { version: 1, prefabPath: input.prefabPath, width, height, sourceHash: task.approval.sha256, nodes, imports: [...imports.values()], businessEvents: 'not_bound', adaptation: 'reference_size_top_left' };
  plan.textPolicy = { fontSizeTolerance: 15, ignoreOutline: true, reviewBy: 'restoration_agent' };
  if (input.layoutPolicy) plan.layoutPolicy = input.layoutPolicy;
  if (nodes.some(node => node.placement || node.content || node.layout?.type === 'overlay') || input.nodes.some(node => node.bounds)) plan.adaptation = 'declarative_layout';
  if (input.layoutPolicy === 'components') plan.adaptation = 'component_layout';
  plan.visualTolerance = visualTolerance(task, [width, height]);
  if (input.components?.length) {
    const componentIds = new Set();
    const paths = new Set([input.prefabPath]);
    plan.components = input.components.map(component => {
      if (!/^[a-zA-Z0-9_-]+$/.test(component.id) || componentIds.has(component.id) || paths.has(component.prefabPath)) throw new Error('组件ID或Prefab路径重复');
      componentIds.add(component.id); paths.add(component.prefabPath);
      if (!Array.isArray(component.nodes) || component.nodes.some(node => !node.box && !node.bounds && !node.layerId && node.placement?.mode !== 'stretch' || node.kind === 'prefab')) throw new Error('组件节点须给局部box或参考范围 首版不支持组件内嵌Prefab');
      const componentPlan = compileAssembly(task, { ...component, layoutPolicy: input.layoutPolicy, components: undefined, coordinateSize: component.canvasSize });
      return { id: component.id, plan: componentPlan };
    });
    plan.imports = [...new Map([...plan.imports, ...plan.components.flatMap(item => item.plan.imports)].map(item => [item.destination, item])).values()];
    for (const instance of plan.nodes.filter(node => node.componentId)) {
      const template = plan.components.find(item => item.id === instance.componentId).plan;
      if (instance.box.width !== template.width || instance.box.height !== template.height) throw new Error(`组件实例须使用模板尺寸 ${instance.id} ${template.width}x${template.height}`);
    }
  }
  const projected = projectLayoutBounds(plan);
  const projectedById = new Map(projected.map(node => [node.id, node]));
  for (const node of nodes) {
    if (node.id === 'root') continue;
    const next = projectedById.get(node.id);
    if (!next) continue;
    node.box = next.box;
    const parentBox = projectedById.get(node.parent || 'root').box;
    node.rect = rectOf(node.box, parentBox, node.placement);
  }
  assertPlanBounds(plan);
  return plan;
}

// 实例覆盖只接受显示字段 不开放任意组件或序列化属性路径
export function normalizeOverrides(overrides, component) {
  if (!Array.isArray(overrides)) throw new Error('overrides须为数组');
  const allowed = new Set(['targetId', 'path', 'text', 'font', 'fontSize', 'color', 'sprite', 'active']);
  const seen = new Set();
  return overrides.map(item => {
    if (!item || Object.keys(item).some(key => !allowed.has(key))) throw new Error('实例覆盖包含不支持的字段');
    if (component ? !component.nodes?.some(node => node.id === item.targetId) || item.path !== undefined
      : item.targetId !== undefined || !Array.isArray(item.path) || item.path.some(index => !Number.isInteger(index) || index < 0)) throw new Error('组件覆盖用targetId 已有Prefab覆盖用整数子节点索引path');
    const key = JSON.stringify(item.targetId ?? item.path);
    if (seen.has(key)) throw new Error('实例覆盖目标重复');
    seen.add(key);
    const result = { ...item };
    if (item.text !== undefined && typeof item.text !== 'string') throw new Error('覆盖text须为字符串');
    if (item.text !== undefined && /^\s/.test(item.text)) throw new Error('覆盖text禁止使用前导空白定位 请调整box或alignment');
    if (item.active !== undefined && typeof item.active !== 'boolean') throw new Error('覆盖active须为布尔值');
    if (item.fontSize !== undefined && !(Number.isFinite(item.fontSize) && item.fontSize > 0)) throw new Error('覆盖fontSize须大于0');
    if (item.font !== undefined) assetPath(item.font, '.asset');
    if (item.sprite !== undefined) assetPath(item.sprite);
    if (item.color !== undefined) result.color = rgba(item.color, 'override');
    if (component) {
      const target = component.nodes.find(node => node.id === item.targetId);
      if (['text', 'font', 'fontSize'].some(key => item[key] !== undefined) && target.kind !== 'text') throw new Error('文字覆盖目标须为text');
      if (item.sprite !== undefined && !['image', 'button'].includes(target.kind)) throw new Error('Sprite覆盖目标须为image或button');
    }
    return result;
  });
}

// 展开已知组件供素材及图层替换审计使用 不把未知Prefab当完整背景
export function expandedNodes(plan) {
  const result = [...plan.nodes];
  for (const instance of plan.nodes.filter(node => node.componentId)) {
    const component = plan.components.find(item => item.id === instance.componentId).plan;
    const scaleX = instance.box.width / component.width;
    const scaleY = instance.box.height / component.height;
    for (const source of component.nodes.filter(node => node.id !== 'root')) {
      const override = instance.overrides.find(item => item.targetId === source.id) || {};
      result.push({ ...source, ...override, id: `${instance.id}/${source.id}`, parent: source.parent === 'root' ? instance.id : `${instance.id}/${source.parent}`,
        box: { left: instance.box.left + source.box.left * scaleX, top: instance.box.top + source.box.top * scaleY,
          width: source.box.width * scaleX, height: source.box.height * scaleY } });
    }
  }
  return result;
}

// 保留既有对象身份 只传本次字段变化和明确增删的节点
export function assemblyDelta(previous, next) {
  if (previous.prefabPath !== next.prefabPath || previous.sourceHash !== next.sourceHash) throw new Error('原位更新须沿用原Prefab及定图');
  for (const component of previous.components || []) {
    const current = next.components?.find(item => item.id === component.id);
    if (!current || JSON.stringify(component) !== JSON.stringify(current)) throw new Error(`已有组件模板变更尚不支持 请保留模板并修改页面实例 ${component.id}`);
  }
  const oldNodes = new Map(previous.nodes.map(node => [node.id, node]));
  if (oldNodes.has('root') && !next.nodes.some(node => node.id === 'root')) throw new Error('不能删除根节点');
  const mutable = new Set(['name', 'parent', 'box', 'rect', 'text', 'font', 'fontSize', 'color', 'sprite', 'active', 'fontStyle', 'alignment', 'wordWrap', 'overflow', 'autoSize', 'overrides', 'siblingIndex', 'layout', 'layoutElement', 'preserveAspect']);
  const metadata = new Set(['semanticRole', 'repeatKey', 'bindKey', 'textKey', 'materialId', 'zIndex', 'order', 'placement', 'content']);
  const changes = [];
  for (const node of next.nodes) {
    const old = oldNodes.get(node.id);
    if (!old) { changes.push({ id: node.id, fields: ['create'] }); continue; }
    const fields = [...new Set([...Object.keys(old), ...Object.keys(node)])].filter(key => JSON.stringify(old[key]) !== JSON.stringify(node[key]));
    const forbidden = fields.filter(key => !mutable.has(key) && !metadata.has(key));
    if (forbidden.length) throw new Error(`原位更新不支持结构或类型变化 ${node.id} ${forbidden.join(' ')}`);
    if (node.kind === 'prefab') {
      const component = node.componentId ? next.components?.find(item => item.id === node.componentId)?.plan : undefined;
      const overrides = normalizeOverrides(node.overrides || [], component);
      const byTarget = new Map(overrides.map(item => [JSON.stringify(item.targetId ?? item.path), item]));
      // 新覆盖写入既有对象 删除旧字段不会自动还原模板 因此只允许保留或扩展
      for (const previous of old.overrides || []) {
        const current = byTarget.get(JSON.stringify(previous.targetId ?? previous.path));
        if (!current || Object.keys(previous).some(key => !['targetId', 'path'].includes(key) && current[key] === undefined)) throw new Error(`原位更新不可移除已有实例覆盖目标或字段 ${node.id}`);
      }
    }
    if (fields.some(key => mutable.has(key))) changes.push({ id: node.id, fields: fields.filter(key => mutable.has(key)) });
  }
  for (const node of previous.nodes) if (!next.nodes.some(item => item.id === node.id)) changes.push({ id: node.id, fields: ['remove'] });
  return changes;
}

export function assertUpdateFresh(task, plan, project) {
  approvedSource(task);
  const applied = task.appliedAssembly;
  if (!applied?.assetState?.nodeBindings?.length) throw new Error('缺少真实apply基准及节点绑定 旧任务不能直接原位更新');
  const changes = assemblyDelta(applied.plan, plan);
  const file = assertInside(project, path.join(project, assetPath(plan.prefabPath, '.prefab')));
  regularFile(file);
  prepareAssemblyImports(plan, project, applied.plan);
  return changes;
}

export function prepareAssemblyImports(plan, project, previous) {
  return { ...plan, components: (plan.components || []).map(component => {
    const file = assertInside(project, path.join(project, assetPath(component.plan.prefabPath, '.prefab')));
    const exists = existsSync(file);
    const owned = previous?.components?.find(item => item.id === component.id);
    if ((exists || existsSync(`${file}.meta`)) && (!owned || JSON.stringify(owned) !== JSON.stringify(component))) throw new Error(`组件Prefab已存在但不属于当前已应用模板 ${component.plan.prefabPath}`);
    return { ...component, reuse: exists };
  }), imports: plan.imports.map(item => {
    regularFile(item.source);
    if (fileDigest(item.source) !== item.sha256) throw new Error('图层文件已变化 请重新规划');
    const destination = assertInside(project, path.join(project, assetPath(item.destination)));
    if (!existsSync(destination) && !existsSync(`${destination}.meta`)) return { ...item, reuse: false };
    if (!existsSync(destination) || !existsSync(`${destination}.meta`)) throw new Error(`目标素材或导入信息不完整 ${item.destination}`);
    regularFile(destination);
    if (fileDigest(destination) !== item.sha256) throw new Error(`目标素材内容已变化 拒绝覆盖 ${item.destination}`);
    return { ...item, reuse: true };
  }) };
}

export function assertAssemblyFresh(task, plan, project) {
  const source = approvedSource(task);
  if (source.sha256 !== plan.sourceHash) throw new Error('装配计划已过期');
  assertPlanBounds(plan);
  const target = assertInside(project, path.join(project, assetPath(plan.prefabPath, '.prefab')));
  if (existsSync(target) || (existsSync(`${target}.meta`) && !task.appliedAssembly)) throw new Error(task.appliedAssembly
    ? 'Prefab已存在且有appliedAssembly真实基准 请调用ui_unity update原位修复 不再assemble'
    : '第一版批量新建不覆盖已有 Prefab 当前任务缺少appliedAssembly真实基准 请保留现有资产并核对来源');
  for (const component of plan.components || []) {
    const file = assertInside(project, path.join(project, assetPath(component.plan.prefabPath, '.prefab')));
    if ((existsSync(file) || existsSync(`${file}.meta`)) && !task.appliedAssembly?.plan.components?.some(item => item.id === component.id && JSON.stringify(item) === JSON.stringify(component))) throw new Error(`拒绝覆盖已有组件Prefab ${component.plan.prefabPath}`);
  }
  prepareAssemblyImports(plan, project, task.appliedAssembly?.plan);
  return target;
}
