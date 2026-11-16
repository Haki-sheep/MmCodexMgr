import { gunzipSync } from 'node:zlib';

const decodedSupports = new WeakMap();
const tolerance = 0.5;

function decode(support) {
  if (decodedSupports.has(support)) return decodedSupports.get(support);
  const [width, height] = support.pixelSize || [];
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) throw new Error('支撑集pixelSize无效');
  if (!['rect', 'empty', 'runs', 'bitmap'].includes(support.kind)) throw new Error(`支撑集kind无效 ${support.kind}`);
  let bytes;
  if (support.kind === 'runs' || support.kind === 'bitmap') {
    bytes = gunzipSync(Buffer.from(support.data, 'base64'), { maxOutputLength: support.kind === 'runs' ? support.count * 16 : support.rowBytes * height });
    if (support.kind === 'runs' && (support.encoding !== 'gzip-base64-u32le-xywh' || bytes.length !== support.count * 16)) throw new Error('支撑集runs编码无效');
    if (support.kind === 'bitmap' && (support.encoding !== 'gzip-base64-msb1' || support.rowBytes !== Math.ceil(width / 8) || bytes.length !== support.rowBytes * height)) throw new Error('支撑集bitmap编码无效');
  }
  const result = { width, height, bytes };
  decodedSupports.set(support, result);
  return result;
}

function intersect(first, second) {
  const left = Math.max(first.left, second.left);
  const top = Math.max(first.top, second.top);
  const right = Math.min(first.left + first.width, second.left + second.width);
  const bottom = Math.min(first.top + first.height, second.top + second.height);
  return right > left && bottom > top ? { left, top, width: right - left, height: bottom - top } : null;
}

function* gaps(target, boxes) {
  const right = target.left + target.width;
  const bottom = target.top + target.height;
  const clipped = boxes.map(box => intersect(target, box)).filter(Boolean)
    .map(box => ({ ...box, right: box.left + box.width, bottom: box.top + box.height }));
  const columns = [...new Set([target.left, right, ...clipped.flatMap(box => [box.left, box.right])])].sort((a, b) => a - b);
  for (let index = 0; index < columns.length - 1; index++) {
    const left = columns[index];
    const columnRight = columns[index + 1];
    if (columnRight - left <= tolerance) continue;
    const intervals = clipped.filter(box => box.left <= left + tolerance && box.right >= columnRight - tolerance)
      .map(box => [box.top, box.bottom]).sort((a, b) => a[0] - b[0]);
    let top = target.top;
    for (const interval of intervals) {
      if (interval[0] > top + tolerance) yield { left, top, width: columnRight - left, height: interval[0] - top };
      top = Math.max(top, interval[1]);
    }
    if (top < bottom - tolerance) yield { left, top, width: columnRight - left, height: bottom - top };
  }
}

function firstVisible(support, region) {
  const { width, height, bytes } = decode(support);
  const left = Math.max(0, Math.floor(region.left));
  const top = Math.max(0, Math.floor(region.top));
  const right = Math.min(width, Math.ceil(region.left + region.width));
  const bottom = Math.min(height, Math.ceil(region.top + region.height));
  if (right <= left || bottom <= top || support.kind === 'empty') return null;
  if (support.kind === 'rect') return { left, top, width: 1, height: 1 };
  if (support.kind === 'runs') {
    for (let offset = 0; offset < bytes.length; offset += 16) {
      const run = { left: bytes.readUInt32LE(offset), top: bytes.readUInt32LE(offset + 4), width: bytes.readUInt32LE(offset + 8), height: bytes.readUInt32LE(offset + 12) };
      const overlap = intersect(run, { left, top, width: right - left, height: bottom - top });
      if (overlap) return { left: overlap.left, top: overlap.top, width: 1, height: 1 };
    }
    return null;
  }
  const firstByte = left >>> 3;
  const lastByte = (right - 1) >>> 3;
  for (let y = top; y < bottom; y++) {
    const row = y * support.rowBytes;
    for (let index = firstByte; index <= lastByte; index++) {
      let value = bytes[row + index];
      if (index === firstByte) value &= 255 >>> (left & 7);
      if (index === lastByte && (right & 7)) value &= (255 << (8 - (right & 7))) & 255;
      if (value) {
        const bit = 31 - Math.clz32(value);
        return { left: index * 8 + 7 - bit, top: y, width: 1, height: 1 };
      }
    }
  }
  return null;
}

export function layerCoverage(layer, documentSize, targetSize, boxes, support) {
  if (!support || support.layerId !== layer.id) throw new Error(`缺少原图层支撑集 ${layer.id}`);
  const decoded = decode(support);
  if (support.kind === 'empty') return { covered: true, empty: true, supportKind: 'empty', visiblePixels: 0, gap: null };
  const target = { left: layer.placement.left * targetSize[0] / documentSize[0], top: layer.placement.top * targetSize[1] / documentSize[1],
    width: layer.placement.width * targetSize[0] / documentSize[0], height: layer.placement.height * targetSize[1] / documentSize[1] };
  if (Object.values(target).some(value => !Number.isFinite(value)) || target.width <= 0 || target.height <= 0) throw new Error(`原图层映射无效 ${layer.id}`);
  const validBoxes = boxes.map(box => Array.isArray(box) ? { left: box[0], top: box[1], width: box[2], height: box[3] } : box);
  if (validBoxes.some(box => !box || ['left', 'top', 'width', 'height'].some(key => !Number.isFinite(box[key])) || box.width <= 0 || box.height <= 0)) throw new Error(`替换视觉box无效 ${layer.id}`);
  const scaleX = target.width / decoded.width;
  const scaleY = target.height / decoded.height;
  for (const gap of gaps(target, validBoxes)) {
    const region = { left: (gap.left - target.left) / scaleX, top: (gap.top - target.top) / scaleY,
      width: gap.width / scaleX, height: gap.height / scaleY };
    const pixel = firstVisible(support, region);
    if (!pixel) continue;
    const pixelBox = { left: target.left + pixel.left * scaleX, top: target.top + pixel.top * scaleY, width: scaleX, height: scaleY };
    const visibleGap = intersect(gap, pixelBox);
    if (!visibleGap) throw new Error(`支撑集浮点映射失败 ${layer.id}`);
    return { covered: false, empty: false, supportKind: support.kind, visiblePixels: support.visiblePixels, gap, visibleGap,
      visiblePixel: { x: pixel.left, y: pixel.top, alpha: '>0' } };
  }
  return { covered: true, empty: false, supportKind: support.kind, visiblePixels: support.visiblePixels, gap: null };
}
