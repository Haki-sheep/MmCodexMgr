import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { approvedSource, assertInside, fileDigest, jsonDigest, makeId } from './core.js';
import { parseProcess, runProcess } from './process.js';

function rectangle(value, label) {
  if (!Array.isArray(value) || value.length !== 4 || !value.every(Number.isFinite) || value[2] <= 0 || value[3] <= 0) throw new Error(`${label}须为[left,top,width,height]有限像素范围`);
  return value;
}

export function registerRegions(sourceSize, regions, sourceHash) {
  const byId = new Map([['root', { id: 'root', name: '整张定图', sourceBox: [0, 0, ...sourceSize], parent: null }]]);
  if (!Array.isArray(regions) || !regions.length) throw new Error('regions须为非空容器数组');
  const pending = new Map();
  for (const region of regions) {
    if (!region || Object.keys(region).some(key => !['id', 'name', 'parent', 'box'].includes(key))) throw new Error('regions仅支持id name parent box 不静默忽略字段');
    if (!region.id || region.id === 'root' || pending.has(region.id)) throw new Error(`区域ID缺失或重复 ${region.id}`);
    pending.set(region.id, region);
  }
  const visiting = new Set();
  const resolve = id => {
    if (byId.has(id)) return byId.get(id);
    const region = pending.get(id);
    if (!region || visiting.has(id)) throw new Error(`区域父级不存在或循环 ${id}`);
    visiting.add(id);
    const parent = resolve(region.parent || 'root');
    const box = rectangle(region.box, `regions[${id}].box`);
    if (box[0] < 0 || box[1] < 0 || box[0] + box[2] > parent.sourceBox[2] || box[1] + box[3] > parent.sourceBox[3]) throw new Error(`区域超出父容器 ${id}`);
    const result = { id, name: region.name || id, parent: parent.id, parentBox: [...box], sourceBox: [parent.sourceBox[0] + box[0], parent.sourceBox[1] + box[1], box[2], box[3]] };
    byId.set(id, result); visiting.delete(id); return result;
  };
  for (const id of pending.keys()) resolve(id);
  return { sourceHash, sourceSize, regions: [...byId.values()] };
}

export function mergeRegionAnalyses(registry, analyses, views = {}) {
  if (!Array.isArray(analyses) || !analyses.length) throw new Error('analyses须为非空区域识别结果');
  const seen = new Set();
  const elements = [];
  const questions = [];
  for (const analysis of analyses) {
    if (!analysis || Object.keys(analysis).some(key => !['region_id', 'view_id', 'elements', 'questions'].includes(key)) || !Array.isArray(analysis.elements)
      || analysis.questions !== undefined && (!Array.isArray(analysis.questions) || analysis.questions.some(item => typeof item !== 'string' || !item.trim()))) throw new Error('区域分析须含region_id elements及questions数组 不支持其他字段');
    const region = registry.regions.find(item => item.id === analysis.region_id);
    if (!region || seen.has(region.id)) throw new Error(`区域不存在或重复提交 ${analysis.region_id}`);
    seen.add(region.id);
    const view = analysis.view_id ? views[analysis.view_id] : null;
    if (analysis.view_id && (!view || view.regionId !== region.id || view.sourceHash !== registry.sourceHash)) throw new Error(`查看快照不属于当前区域 ${analysis.view_id}`);
    const localIds = new Set();
    for (const element of analysis.elements || []) {
      if (!element || Object.keys(element).some(key => !['id', 'name', 'requirements', 'box', 'semanticRole', 'kind'].includes(key))
        || element.requirements !== undefined && typeof element.requirements !== 'string'
        || element.kind !== undefined && !['image', 'text', 'container'].includes(element.kind)
        || element.semanticRole !== undefined && !['background', 'panel', 'icon', 'indicator', 'decoration', 'text'].includes(element.semanticRole)) throw new Error(`区域${region.id}元素字段不支持 kind仅为image text container semanticRole须为明确职责`);
      if (!element.id || !element.name || localIds.has(element.id)) throw new Error(`区域元素缺少ID名称或重复 ${region.id}/${element.id}`);
      localIds.add(element.id);
      let sourceBox;
      if (element.box) {
        const box = rectangle(element.box, `${region.id}/${element.id}.box`);
        const origin = view?.sourceBox || region.sourceBox;
        const scale = view?.scale || 1;
        if (box[0] < 0 || box[1] < 0 || box[0] + box[2] > origin[2] * scale || box[1] + box[3] > origin[3] * scale) throw new Error(`元素超出观察区域 ${region.id}/${element.id}`);
        sourceBox = [origin[0] + box[0] / scale, origin[1] + box[1] / scale, box[2] / scale, box[3] / scale];
      }
      elements.push({ id: `${region.id}/${element.id}`, parent: region.id, name: element.name, requirements: element.requirements || '',
        ...element.kind ? { kind: element.kind } : {},
        ...element.semanticRole ? { semanticRole: element.semanticRole } : {},
        ...sourceBox ? { sourceBox, parentBox: [sourceBox[0] - region.sourceBox[0], sourceBox[1] - region.sourceBox[1], ...sourceBox.slice(2)], precision: 'visual_estimate' } : {} });
    }
    questions.push(...(analysis.questions || []).map(question => `${region.name}：${question}`));
  }
  const missing = registry.regions.filter(region => region.id !== 'root' && !seen.has(region.id) && !registry.regions.some(child => child.parent === region.id));
  if (missing.length) throw new Error(`叶级区域尚未识别 ${missing.map(item => item.id).join(' ')}`);
  const prompt = [`原图尺寸${registry.sourceSize.join('x')} 以下sourceBox均为原图左上原点像素范围 不使用裁图显示坐标`,
    ...registry.regions.filter(region => seen.has(region.id)).map(region => `容器${region.id} ${region.name} 原图范围${JSON.stringify(region.sourceBox)}`),
    ...elements.map(element => `${element.id} ${element.name}${element.sourceBox ? ` 原图参考范围${JSON.stringify(element.sourceBox)}` : ''} ${element.requirements}`)].join('\n');
  return { sourceHash: registry.sourceHash, elements, questions, prompt, state: questions.length ? 'needs_clarification' : 'ready' };
}

export async function regionOperation(service, task, args) {
  const source = approvedSource(task);
  if (args.action === 'register') {
    const registry = registerRegions(await service.sourceDimensions(task), args.regions, source.sha256);
    if (task.regionRegistry?.sourceHash === source.sha256 && jsonDigest(task.regionRegistry) === jsonDigest(registry)) return { taskId: task.id, ...registry, state: 'registered', next: '已登记同一范围 直接使用现有区域 不重复识别' };
    if (task.regionAnalyses || Object.keys(task.regionSubmissions || {}).length) throw new Error('当前定图已有区域分析 不自行重划范围或重估坐标');
    await service.patchTask(task.id, { regionRegistry: registry, regionAnalyses: null, regionViews: {}, regionSubmissions: {} });
    return { taskId: task.id, ...registry, next: '工具已固定原图坐标 分析代理按叶级区域只读识别并submit保存单区结果 不装配 总控齐全后merge不传analyses 不重写坐标' };
  }
  const registry = task.regionRegistry;
  if (!registry || registry.sourceHash !== source.sha256) throw new Error('尚未登记当前定图区域 请先register');
  const missingRegions = submissions => registry.regions.filter(region => region.id !== 'root' && !registry.regions.some(child => child.parent === region.id) && !submissions[region.id]).map(item => item.id);
  if (args.action === 'get') return { ...registry, analyses: task.regionAnalyses, submittedRegions: Object.keys(task.regionSubmissions || {}), missingRegions: missingRegions(task.regionSubmissions || {}) };
  if (args.action === 'submit') {
    const analysis = args.analysis;
    const region = registry.regions.find(item => item.id === analysis?.region_id);
    if (!region || region.id === 'root' || registry.regions.some(child => child.parent === region.id)) throw new Error('analysis.region_id须使用已登记叶级区域ID');
    mergeRegionAnalyses({ ...registry, regions: [registry.regions[0], region] }, [analysis], task.regionViews);
    const updated = await service.patchTask(task.id, current => ({ regionSubmissions: { ...current.regionSubmissions, [region.id]: analysis } }));
    return { taskId: task.id, regionId: region.id, state: 'submitted', missingRegions: missingRegions(updated.regionSubmissions), next: '分析已保存 不重写坐标 不再观察 已齐后总控merge不传analyses' };
  }
  if (args.action === 'merge') {
    if (task.workflowContractVersion === 2 && args.analyses !== undefined) throw new Error('新任务由各分析代理submit 总控merge不重抄analyses 使用已保存结果');
    const analyses = args.analyses || Object.values(task.regionSubmissions || {});
    const missing = missingRegions(Object.fromEntries(analyses.map(item => [item.region_id, item])));
    if (missing.length) return { taskId: task.id, state: 'collecting', missingRegions: missing, nextAction: 'wait_for_regions', next: '区域尚未齐全 等待原分析代理submit 不试调用合并 不重读原图' };
    const merged = mergeRegionAnalyses(registry, analyses, task.regionViews);
    await service.patchTask(task.id, { regionAnalyses: merged });
    return { taskId: task.id, ...merged, next: merged.questions.length ? '语义归属有疑点 等待人类补充 不开始拆层' : '分析已保存本地 执行者归并去重图片资源 不附加完整分析 不重写坐标 拆层结果位置优先于视觉估计' };
  }
  if (args.action !== 'view') throw new Error('不支持的区域操作');
  const region = registry.regions.find(item => item.id === args.region_id);
  if (!region) throw new Error(`区域不存在 ${args.region_id}`);
  const local = args.crop_box ? rectangle(args.crop_box, 'crop_box') : [0, 0, ...region.sourceBox.slice(2)];
  if (local[0] < 0 || local[1] < 0 || local[0] + local[2] > region.sourceBox[2] || local[1] + local[3] > region.sourceBox[3]) throw new Error('crop_box超出当前容器');
  const left = Math.floor(region.sourceBox[0] + local[0]);
  const top = Math.floor(region.sourceBox[1] + local[1]);
  const sourceBox = [left, top, Math.ceil(region.sourceBox[0] + local[0] + local[2]) - left, Math.ceil(region.sourceBox[1] + local[1] + local[3]) - top];
  const signature = jsonDigest({ sourceHash: source.sha256, regionId: region.id, sourceBox, scale: args.scale ?? 2, grid: args.grid ?? false });
  const views = Object.values(task.regionViews || {}).filter(item => item.regionId === region.id && item.sourceHash === source.sha256);
  const cached = views.find(item => item.signature === signature);
  if (cached) return { taskId: task.id, ...cached, cached: true, next: '使用同一观察快照 不重复看图或估算坐标' };
  if (views.length && !args.question?.trim()) throw new Error('再次局部观察须提供具体question 不为几像素差异反复放大');
  if (views.length >= 2 || task.decomposition) throw new Error('该区域观察预算已结束 使用已有快照和拆层坐标 仍有语义疑点则上报');
  const id = makeId('view');
  const directory = assertInside(task.directory, path.join(task.directory, id));
  await mkdir(directory);
  const result = parseProcess(await runProcess(service.options.pythonPath, ['-B', '-X', 'utf8', fileURLToPath(new URL('./runtime/region_view.py', import.meta.url))], {
    input: JSON.stringify({ source: source.file, output: directory, box: sourceBox, scale: args.scale ?? 2, grid: args.grid ?? false }), timeoutMs: 30000 }));
  if (fileDigest(source.file) !== source.sha256) throw new Error('查看期间定图变化 不使用旧坐标');
  const view = { id, regionId: region.id, sourceHash: source.sha256, sourceBox, signature, question: args.question, ...result };
  await service.patchTask(task.id, current => ({ regionViews: { ...current.regionViews, [id]: view } }));
  return { taskId: task.id, ...view, coordinateRule: '本图坐标除以scale再加sourceBox左上角 得到原图坐标 merge传view_id由工具换算 不自行回填两套坐标 网格只辅助观察不吸附布局' };
}
