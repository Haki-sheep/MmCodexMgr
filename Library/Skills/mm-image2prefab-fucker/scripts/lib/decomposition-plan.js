import { jsonDigest, makeId } from './core.js';
import { resourceContract } from './resource-review.js';

export const decompositionMaterialRules = [
  '按可独立隐藏和替换的游戏UI元素拆层 以下素材约束必须满足',
  '背景输出整幅画布完全不透明且完整覆盖四边的底板 背景不适用周围透明要求 去除全部界面文案数值及独立前景元素 文字和前景移除区域按邻近底色渐变纹理补齐 保持原构图 不保留原始整张UI截图作为底图',
  '按钮本体及攻击生命等数值底条必须为无字底板 保留完整边框和造型 从无文字无图标的干净区域取样或在本次拆层中补齐 不带文字数值图标箭头角标和邻近背景残片',
  '普通文案和等级数量等可变数值全部去字 后续每个字段只由一个TMP节点显示 不输出文字遮盖补丁 S SSR等品质徽标是独立图形素材 保留徽标字形不当普通文案去掉 不同时要求同一品质徽标用图片和TMP',
  '图标箭头及角标按已确认归属独立拆出 周围透明 不带底板旧文字或邻近控件残片 隐藏或替换元素后不得露出旧内容',
  '可复用装备格只需一个合格无字底板 固定边框底座装饰可并入底板 不为六个实例重复拆六张底板 不把功能原子化扩大为每个固定装饰单独拆 图标可分散在同一透明图层 后续工具按候选归属确定性分割 不得互相粘连',
  '素材资源与显示实例分开 同款箭头S标格底只需一个干净素材 位置不同不等于素材缺失 多个实例由Layout锚点和子节点表达 不要求每个实例都在拆层合成图出现 红点图片独立且可隐藏 可挂所属装备格或按钮下 不强制独立根层',
  '无法完整分离或补齐的素材必须明确标记缺失或缺陷 不以截图裁片遮盖叠图冒充干净素材',
].join('\n');

export const decompositionOutputBoundary = '最终输出边界 背景必须整屏完全不透明 前景独立图标周围透明 此规则优先于笼统的所有图片透明表述';

const promptLimit = 2000;
const count = text => Array.from(text).length;

function finalPrompt(instruction, resources, sourceSize) {
  const rules = decompositionMaterialRules.split('\n');
  const roles = new Set(resources.map(item => item.semanticRole));
  const selected = resources.length ? rules.filter((_, index) => [0, 3, 6, 7].includes(index) || index === 1 && roles.has('background')
    || index === 2 && roles.has('panel') || index === 4 && ['icon', 'indicator'].some(role => roles.has(role)) || index === 5 && roles.has('panel')).join('\n') : decompositionMaterialRules;
  const lines = resources.map(item => `素材${JSON.stringify(item.id)} ${item.name} 职责${item.semanticRole}${item.box ? ` 原图参考框${JSON.stringify(item.box)}` : ''}${item.requirements ? ` ${item.requirements}` : ''}${item.forbiddenContent?.length ? ` 禁止内容${item.forbiddenContent.join(' ')}` : ''}`);
  const boundary = !resources.length || roles.has('background') ? decompositionOutputBoundary : '仅生成清单素材 图标周围透明 不额外生成背景 底板或其他控件';
  return [selected, `参考原图${sourceSize.join('x')} 坐标为原图左上原点像素 仅输出本批列出的图片素材 不输出未列出的素材和TMP文案数值 同款素材仅一份 共享素材由所属批次生成 其他批次不得重复生成`,
    instruction?.trim(), ...lines, boundary].filter(Boolean).join('\n\n');
}

function lengthError(prompt, field, fixedLength) {
  throw new Error(`拆层提示词超限 ${field} 最终${count(prompt)}字符 上限${promptLimit} 固定约束${fixedLength}字符 未创建后台操作或收费请求 请提交去重后的elements按完整素材分批 不截断描述 不删除需求 不反复缩写无关区域分析`);
}

export function builtinDecompositionPlan(task, instruction, elements, sourceSize, layerSize) {
  if (instruction !== undefined && typeof instruction !== 'string') throw new Error('prompt须为字符串');
  const fixedLength = count(finalPrompt('', [], sourceSize));
  const batches = [];
  const resourceMap = [];
  const resourceCatalog = [];
  if (elements !== undefined) {
    if (!Array.isArray(elements) || !elements.length) throw new Error('elements须为去重后的独立图片素材清单 TMP不列入 不直接传完整区域分析');
    const ids = new Set();
    const resources = [];
    for (const [index, item] of elements.entries()) {
      if (!item || typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id)) throw new Error(`elements[${index}].id缺失或重复`);
      ids.add(item.id);
      if (item.reuseOf !== undefined) {
        if (typeof item.reuseOf !== 'string' || !item.reuseOf || Object.keys(item).some(key => !['id', 'reuseOf'].includes(key))) throw new Error(`elements[${index}]复用实例只填id reuseOf 不生成第二份素材`);
        resourceMap.push({ id: item.id, resourceId: item.reuseOf });
        continue;
      }
      if (Object.keys(item).some(key => !['id', 'name', 'semanticRole', 'box', 'regionId', 'requirements', 'forbiddenContent'].includes(key))
        || typeof item.name !== 'string' || !item.name.trim() || !['background', 'panel', 'icon', 'indicator', 'decoration'].includes(item.semanticRole)
        || item.requirements !== undefined && typeof item.requirements !== 'string'
        || item.regionId !== undefined && (typeof item.regionId !== 'string' || !item.regionId.trim())) throw new Error(`elements[${index}]须有name和图片semanticRole 不支持TMP或其他字段`);
      if (item.box !== undefined && (!Array.isArray(item.box) || item.box.length !== 4 || !item.box.every(Number.isFinite)
        || item.box[0] < 0 || item.box[1] < 0 || item.box[2] <= 0 || item.box[3] <= 0
        || item.box[0] + item.box[2] > sourceSize[0] || item.box[1] + item.box[3] > sourceSize[1])) throw new Error(`elements[${index}].box须为原图范围 不使用Layout或放大坐标`);
      if (item.regionId && !task.regionRegistry?.regions.some(region => region.id === item.regionId)) throw new Error(`elements[${index}].regionId未登记 ${item.regionId}`);
      const resource = { ...item, name: item.name.trim() };
      resourceCatalog.push(resourceContract(resource));
      resources.push(resource); resourceMap.push({ id: item.id, resourceId: item.id });
    }
    const resourcesById = new Map(resources.map(item => [item.id, item]));
    for (const reference of resourceMap) if (!resourcesById.has(reference.resourceId)) throw new Error(`reuseOf须直接引用唯一真实素材 不允许悬空或链式复用 ${reference.id}`);
    if (!resources.length || resources.filter(item => item.semanticRole === 'background').length > 1) throw new Error('图片素材清单为空或重复声明整屏背景');
    const all = finalPrompt(instruction, resources, sourceSize);
    const append = group => batches.push({ id: `batch-${batches.length + 1}`, resourceIds: group.map(item => item.id),
      regionIds: [...new Set(group.map(item => item.regionId || 'shared'))], prompt: finalPrompt(instruction, group, sourceSize) });
    if (count(all) <= promptLimit) append(resources);
    else {
      for (const item of resources) {
        const single = finalPrompt(instruction, [item], sourceSize);
        if (count(single) > promptLimit) lengthError(single, `elements[${item.id}]单个素材不可分`, fixedLength);
      }
      const groups = [];
      const ordered = resources.map((item, index) => ({ item, index, length: count(finalPrompt(instruction, [item], sourceSize)) }))
        .sort((a, b) => b.length - a.length || a.index - b.index);
      for (const { item } of ordered) {
        const fits = groups.map((group, index) => ({ index, length: count(finalPrompt(instruction, [...group, item], sourceSize)) }))
          .filter(candidate => candidate.length <= promptLimit).sort((a, b) => b.length - a.length || a.index - b.index);
        if (fits.length) groups[fits[0].index].push(item);
        else groups.push([item]);
      }
      for (const group of groups) group.sort((a, b) => resources.indexOf(a) - resources.indexOf(b));
      groups.sort((a, b) => resources.indexOf(a[0]) - resources.indexOf(b[0]));
      groups.forEach(append);
    }
  } else {
    const prompt = finalPrompt(instruction, [], sourceSize);
    if (!instruction?.trim()) throw new Error('拆图须有prompt或elements独立素材清单 不自动把完整区域分析发送上游');
    if (count(prompt) > promptLimit) lengthError(prompt, 'prompt不可按字符截断', fixedLength);
    batches.push({ id: 'batch-1', resourceIds: [], regionIds: [], prompt });
  }
  const value = { model: 'builtin', sourceHash: task.approval.sha256, sourceSize, layerSize, batches, resourceMap, resourceCatalog,
    coordinateOrigin: 'provider_full_reference', requestCount: batches.length };
  return { ...value, id: makeId('decomposition-plan'), hash: jsonDigest(value) };
}

export function decompositionPlanSummary(plan) {
  return { planId: plan.id, model: plan.model, sourceSize: plan.sourceSize, requestCount: plan.requestCount,
    independentResources: new Set(plan.resourceMap.map(item => item.resourceId)).size,
    batches: plan.batches.map(item => ({ id: item.id, resourceIds: item.resourceIds, regionIds: item.regionIds, promptCharacters: count(item.prompt), limit: promptLimit })),
    coordinateRule: '各批使用同一原图 工具按服务端document尺寸换算至原图 不读取PNG尺寸猜位置 不按批次各建Prefab',
    feedback: `已规划${plan.requestCount}个拆图请求 每批含完整约束且不超过2000字符 每份素材只属于一个批次 每批分别收费 成功结果保留 失败或未知停止 不自动重试` };
}

export function validateDecompositionPlan(plan) {
  const { id, hash, ...value } = plan;
  if (!id || hash !== jsonDigest(value)) throw new Error('拆图计划内容已变化 请重新plan 不执行未回显的批次');
  return plan;
}
