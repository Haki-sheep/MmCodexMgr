import { imageSizeConfig } from './image-size.js';

export function decompositionRequest(model, elements, task, sourceSize) {
  if (model === 'builtin') return { model };
  if (model !== 'image2.5') throw new Error(`不支持的拆图模型 ${model} 不自动换接口`);
  const input = elements ?? task.regionAnalyses?.elements?.map(item => ({ id: item.id, name: item.name, box: item.sourceBox,
    semanticRole: item.semanticRole, requirements: item.requirements }));
  if (!Array.isArray(input) || !input.length || input.length > 32) throw new Error('image2.5拆图须提供elements或已合并区域元素 每项为独立素材及原图参考box 不调用内置Seedream代替 不向人类索要坐标');
  const ids = new Set();
  const requests = input.map((item, index) => {
    if (!item || Object.keys(item).some(key => !['id', 'name', 'box', 'semanticRole', 'requirements', 'zIndex'].includes(key))
      || !item.id || ids.has(item.id) || typeof item.name !== 'string' || !item.name.trim()
      || !['background', 'panel', 'icon', 'indicator', 'decoration'].includes(item.semanticRole)
      || !Array.isArray(item.box) || item.box.length !== 4 || !item.box.every(Number.isFinite)
      || item.box[0] < 0 || item.box[1] < 0 || item.box[2] <= 0 || item.box[3] <= 0
      || item.box[0] + item.box[2] > sourceSize[0] || item.box[1] + item.box[3] > sourceSize[1]
      || item.zIndex !== undefined && !Number.isFinite(item.zIndex)) throw new Error(`elements[${index}]须有唯一id name semanticRole及原图内box 文案数值不拆图片 不猜缺失范围`);
    ids.add(item.id);
    const box = item.box.map((value, axis) => axis < 2 ? Math.floor(value) : Math.ceil(value + item.box[axis - 2]) - Math.floor(item.box[axis - 2]));
    if (item.semanticRole === 'background' && JSON.stringify(box) !== JSON.stringify([0, 0, ...sourceSize])) throw new Error('背景box须覆盖整幅原图 局部无字底板使用panel');
    const size = imageSizeConfig('image2.5', {}, box.slice(2));
    return { ...item, box, zIndex: item.zIndex ?? index + 1, requestedSize: size.requestedSize };
  });
  if (requests.filter(item => item.semanticRole === 'background').length > 1) throw new Error('整屏背景只需一张 不生成重复背景');
  return { model, sourceHash: task.approval?.sha256, sourceSize, requests, requestCount: requests.length,
    coordinateOrigin: 'analysis_reference', scope: '按参考框逐素材编辑 前景透明PNG 背景不透明 坐标来自分析参考范围 不是模型返回的精准坐标 每项一次收费请求 失败停止整批不重放' };
}
