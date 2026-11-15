import argparse
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw


def build_overview(document, output):
    layers = [item for item in document['layers'] if item.get('role') != 'base' and item.get('visible') is not False]
    cell_width, cell_height, columns = 240, 230, 4
    sheet = Image.new('RGB', (columns * cell_width, max(1, (len(layers) + columns - 1) // columns) * cell_height), '#242424')
    draw = ImageDraw.Draw(sheet)
    for index, item in enumerate(layers):
        x, y = index % columns * cell_width, index // columns * cell_height
        tile = Image.new('RGBA', (224, 182), '#535353')
        td = ImageDraw.Draw(tile)
        for row in range(0, 182, 16):
            for col in range(0, 224, 16):
                if (row // 16 + col // 16) % 2:
                    td.rectangle((col, row, col + 15, row + 15), fill='#777777')
        with Image.open(item['file']) as source:
            image = source.convert('RGBA')
            image.thumbnail((220, 178))
            tile.alpha_composite(image, ((224 - image.width) // 2, (182 - image.height) // 2))
        sheet.paste(tile.convert('RGB'), (x + 8, y + 8))
        box = item['placement']
        draw.text((x + 8, y + 192), f"{index + 1}. {item['id']}", fill='white')
        draw.text((x + 8, y + 208), f"{box['left']},{box['top']} {box['width']}x{box['height']}", fill='white')
    sheet.save(output)
    result = {'overview': str(output)}
    if 'width' in document and 'height' in document:
        result.update(build_decomposition_preview(document, output))
    return result


def build_decomposition_preview(document, output):
    size = (document['width'], document['height'])
    if any(not isinstance(value, int) or value <= 0 for value in size):
        raise ValueError('拆层画布尺寸无效 停止并上报')
    canvas = Image.new('RGBA', size)
    records, issues = [], []
    for item in document['layers']:
        try:
            with Image.open(item['file']) as source:
                image = source.convert('RGBA')
                alpha = image.getchannel('A')
                bounds = alpha.getbbox()
                records.append({'layerId': item['id'], 'pixelSize': list(image.size),
                                'visibleBounds': bounds, 'fullyOpaque': alpha.getextrema()[0] == 255})
        except Exception as error:
            raise RuntimeError(f"拆层文件检查失败 layer={item['id']} file={item['file']} {error}") from error
        if item.get('visible') is False or item.get('role') == 'base':
            continue
        if bounds is None:
            issues.append({'layerId': item['id'], 'problem': '图层完全透明 无可见像素'})
            continue
        box = item['placement']
        values = [box[key] for key in ('left', 'top', 'width', 'height')]
        if any(not isinstance(value, (int, float)) or not math.isfinite(value) for value in values) or min(values[2:]) <= 0:
            raise ValueError(f"拆层坐标无效 layer={item['id']} 停止并上报")
        target_size = (max(1, round(box['width'])), max(1, round(box['height'])))
        canvas.alpha_composite(image.resize(target_size, Image.Resampling.LANCZOS), (round(box['left']), round(box['top'])))
    preview = Path(output).with_name('layer-composite.png')
    audit_file = Path(output).with_name('layer-data-check.json')
    canvas.save(preview)
    audit = {'passed': not issues, 'checkedLayers': len(records), 'layers': records, 'issues': issues,
             'scope': '文件解码 尺寸 可见像素与透明范围检查 非视觉还原通过 合成按拆层坐标与原始顺序 不含base及隐藏图层 不补文字 不代表复用后的最终布局'}
    audit_file.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding='utf-8')
    if issues:
        raise ValueError('拆层数据检查失败 停止并上报 ' + json.dumps(issues, ensure_ascii=False))
    return {'composite': str(preview), 'dataChecks': {'passed': True, 'checkedLayers': len(records), 'report': str(audit_file), 'scope': audit['scope']}}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    import sys
    print(json.dumps(build_overview(json.load(sys.stdin), Path(args.output)), ensure_ascii=False))
