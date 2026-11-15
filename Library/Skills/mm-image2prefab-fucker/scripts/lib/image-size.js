function validSize(width, height) {
  return width > 0 && height > 0 && width % 16 === 0 && height % 16 === 0 && Math.max(width, height) <= 3840
    && Math.max(width, height) <= 3 * Math.min(width, height) && width * height >= 655360 && width * height <= 8294400;
}

// 拆层坐标与生图尺寸分开 原图不满足接口约束时保持比例选取最接近的合法请求
function sourceRequestSize(size) {
  const [width, height] = size;
  if (!(Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0)) throw new Error('原图尺寸无效');
  if (validSize(width, height)) return size;
  let best;
  for (let w = 16; w <= 3840; w += 16) {
    for (let h = 16; h <= 3840; h += 16) {
      if (!validSize(w, h)) continue;
      const score = Math.abs(Math.log(w / h / (width / height))) * 100 + Math.abs(Math.log(w * h / (width * height)));
      if (!best || score < best.score) best = { size: [w, h], score };
    }
  }
  return best.size;
}

export function imageSizeConfig(model, args, sourceSize) {
  const config = { ...args.config };
  if (model !== 'image2.5') {
    if (args.image_size) throw new Error('image_size仅支持image2.5 其他模型请使用对应config字段 不自动切换模型');
    return { config, requestedSize: null, sourceSize: sourceSize || null };
  }
  if (args.image_size && config.image25Size && args.image_size !== config.image25Size) throw new Error('image_size与config.image25Size冲突 请统一实际请求尺寸');
  const explicit = args.image_size || config.image25Size;
  const automatic = sourceSize && (!explicit || args.purpose === 'material' && args.material_kind === 'background');
  const size = automatic ? sourceRequestSize(sourceSize).join('x') : explicit;
  if (automatic && explicit && explicit !== size) throw new Error(`背景补图由原定图确定请求尺寸${size} 不能使用拆层尺寸${explicit} 请省略image_size与config.image25Size 后端自动选取并映射布局`);
  if (!size || !/^\d{1,4}x\d{1,4}$/.test(size)) throw new Error('image2.5新图必须指定image_size 如1920x1088 不能只在prompt写尺寸 已定图补图可省略由后端读取原图 不使用默认竖屏尺寸');
  const requestedSize = size.split('x').map(Number);
  if (!validSize(...requestedSize)) throw new Error(`生图请求尺寸${size}不符合image2.5约束 宽高须为16倍数 最长边3840 比例不超过3:1 总像素655360到8294400 这不限制拆层坐标或UGUI尺寸`);
  config.image25Size = size;
  return { config, requestedSize, sourceSize: sourceSize || null };
}

export function imageSizeAudit(expected, actual) {
  const passed = !expected || expected.every((value, index) => value === actual[index]);
  return { passed, expected, actual, next: passed ? 'read_image核对构图 清晰度和UI残留 尺寸通过不代表视觉通过'
    : '服务返回尺寸与请求不符 保留原产物和请求 不自动重提收费任务 不可按尺寸合格交付' };
}
