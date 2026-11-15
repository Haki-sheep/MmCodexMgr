import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw
from material_extract import rectangle


def components(image):
    alpha = image.getchannel('A')
    labels, runs, previous = [], [], []

    def root(label):
        while labels[label] != label:
            labels[label] = labels[labels[label]]
            label = labels[label]
        return label

    for y in range(image.height):
        row = alpha.crop((0, y, image.width, y + 1)).tobytes()
        current, x = [], 0
        while x < image.width:
            if row[x] == 0:
                x += 1
                continue
            left = x
            while x < image.width and row[x] != 0:
                x += 1
            label = len(labels)
            labels.append(label)
            current.append((left, x, label))
            runs.append((y, left, x, label))
        index = 0
        for left, right, label in current:
            while index < len(previous) and previous[index][1] < left:
                index += 1
            j = index
            while j < len(previous) and previous[j][0] <= right:
                labels[root(previous[j][2])] = root(label)
                j += 1
        previous = current
    grouped = {}
    for y, left, right, label in runs:
        grouped.setdefault(root(label), []).append((y, left, right))
    if not grouped:
        raise ValueError('图层完全透明 没有可分离的像素')
    if len(grouped) > 256:
        raise ValueError(f'透明连通块过多 {len(grouped)} 无法可靠批量归属 停止并报告 不丢弃小块')
    result = []
    for entries in grouped.values():
        left = min(run[1] for run in entries)
        top = min(run[0] for run in entries)
        right = max(run[2] for run in entries)
        bottom = max(run[0] for run in entries) + 1
        result.append({'box': [left, top, right - left, bottom - top],
                       'pixels': sum(run[2] - run[1] for run in entries), 'runs': entries})
    result.sort(key=lambda item: (item['box'][1], item['box'][0]))
    return [dict(item, id=index + 1) for index, item in enumerate(result)]


def isolated(image, parts, padding=2):
    left = min(item['box'][0] for item in parts) - padding
    top = min(item['box'][1] for item in parts) - padding
    right = max(item['box'][0] + item['box'][2] for item in parts) + padding
    bottom = max(item['box'][1] + item['box'][3] for item in parts) + padding
    mask = Image.new('L', image.size)
    draw = ImageDraw.Draw(mask)
    for item in parts:
        for y, start, end in item['runs']:
            draw.line((start, y, end - 1, y), fill=255)
    result = Image.new('RGBA', image.size)
    result.paste(image, (0, 0), mask)
    return result.crop((left, top, right, bottom)), [left, top, right - left, bottom - top]


def contact_sheet(image, parts, output):
    columns = 4
    sheet = Image.new('RGB', (columns * 240, ((len(parts) + columns - 1) // columns) * 230), '#333333')
    draw = ImageDraw.Draw(sheet)
    for index, item in enumerate(parts):
        x, y = index % columns * 240, index // columns * 230
        tile = Image.new('RGBA', (224, 180), '#777777')
        td = ImageDraw.Draw(tile)
        for row in range(0, 180, 16):
            for col in range(0, 224, 16):
                if (row // 16 + col // 16) % 2:
                    td.rectangle((col, row, col + 15, row + 15), fill='#aaaaaa')
        crop, _ = isolated(image, [item])
        factor = min(4, 220 / crop.width, 176 / crop.height)
        crop = crop.resize((max(1, round(crop.width * factor)), max(1, round(crop.height * factor))), Image.Resampling.NEAREST)
        tile.alpha_composite(crop, ((224 - crop.width) // 2, (180 - crop.height) // 2))
        sheet.paste(tile.convert('RGB'), (x + 8, y + 8))
        draw.text((x + 8, y + 192), f"{item['id']} pixels={item['pixels']}", fill='white')
        draw.text((x + 8, y + 208), str(item['box']), fill='white')
    sheet.save(output)


def inspect(request):
    with Image.open(request['source']) as source:
        image = source.convert('RGBA')
    result = {'sourceSize': list(image.size), 'fullyOpaque': image.getchannel('A').getextrema()[0] == 255, 'components': [], 'scope': '透明连通块候选 不是语义元素 AI须合并同一图标的分离部分 不做去字或补画'}
    if request.get('cropBox') is not None:
        scale = request.get('scale', 2)
        if type(scale) is not int or not 1 <= scale <= 4:
            raise ValueError('局部查看scale须为1到4整数')
        box = rectangle(request['cropBox'], image.size)
        crop = image.crop(box)
        if crop.width * crop.height * scale * scale > 16777216:
            raise ValueError('局部放大超过1600万像素 请缩小crop_box 不静默缩图')
        native = str(Path(request['output']) / 'native.png')
        zoom = str(Path(request['output']) / 'zoom.png')
        crop.save(native)
        crop.resize((crop.width * scale, crop.height * scale), Image.Resampling.NEAREST).save(zoom)
        result.update(native=native, zoom=zoom, cropBox=request['cropBox'], scale=scale)
        return result
    parts = components(image)
    overview = str(Path(request['output']) / 'components.jpg')
    contact_sheet(image, parts, overview)
    result.update(overview=overview, components=[{key: value for key, value in item.items() if key != 'runs'} for item in parts])
    return result


def split(request):
    prepared = []
    for item in request['items']:
        with Image.open(item['source']) as source:
            image = source.convert('RGBA')
        if image.getchannel('A').getextrema()[0] == 255:
            raise ValueError('整幅不透明位图不能通过透明分割获取独立图标 不添加透明边框绕过检查')
        parts = components(image)
        snapshot = [{key: value for key, value in part.items() if key != 'runs'} for part in parts]
        if snapshot != item['components']:
            raise ValueError('候选块与查看快照不同 重新inspect 不猜分组')
        assigned = [value for group in item['groups'] for value in group['componentIds']]
        if any(type(value) is not int for value in assigned) or sorted(assigned) != list(range(1, len(parts) + 1)):
            raise ValueError('所有候选块须恰好归属一个分组 不遗漏 不重复 不丢弃碎片')
        for group in item['groups']:
            if not group['componentIds']:
                raise ValueError('分组不得为空')
            result, box = isolated(image, [parts[index - 1] for index in group['componentIds']])
            prepared.append((item, group, result, box, image))
    results = []
    for item, group, result, box, image in prepared:
        destination = Path(group['file'])
        result.save(destination)
        overlay = image.copy()
        draw = ImageDraw.Draw(overlay)
        left, top, width, height = box
        draw.rectangle((left, top, left + width - 1, top + height - 1), outline='#ff3030', width=3)
        overlay.save(group['auditOutput'])
        alpha = result.getchannel('A')
        results.append({'inspectionId': item['inspectionId'], 'file': str(destination), 'name': group['name'],
                        'kind': group['kind'], 'semanticRole': group['semanticRole'], 'size': list(result.size),
                        'fullyOpaque': alpha.getextrema()[0] == 255, 'hasVisiblePixels': True,
                        'sourceSize': list(image.size), 'sourceOverlay': group['auditOutput'],
                        'source': item['source'], 'cropBox': box, 'componentIds': group['componentIds']})
    return {'results': results}


if __name__ == '__main__':
    request = json.load(sys.stdin)
    print(json.dumps(inspect(request) if request['action'] == 'inspect' else split(request), ensure_ascii=False))
