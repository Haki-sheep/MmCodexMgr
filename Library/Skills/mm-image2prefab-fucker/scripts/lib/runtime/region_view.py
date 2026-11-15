import json
from pathlib import Path
import sys
from PIL import Image, ImageDraw


def view(request):
    scale = request.get('scale', 2)
    grid = request.get('grid', False)
    if type(scale) is not int or not 1 <= scale <= 4:
        raise ValueError('scale须为1到4整数')
    if grid is True:
        grid = [8, 8]
    if grid is not False and (not isinstance(grid, list) or len(grid) != 2 or any(type(value) is not int or not 1 <= value <= 64 for value in grid)):
        raise ValueError('grid须为false true或[列数,行数] 每轴1到64')
    left, top, width, height = request['box']
    output = Path(request['output'])
    with Image.open(request['source']) as source:
        if left < 0 or top < 0 or left + width > source.width or top + height > source.height:
            raise ValueError('观察范围超出原图')
        if width * height * scale * scale > 16777216:
            raise ValueError('局部放大超过1600万像素 请缩小范围')
        native = source.convert('RGBA').crop((left, top, left + width, top + height))
    native.save(output / 'native.png')
    zoom = native.resize((width * scale, height * scale), Image.Resampling.NEAREST)
    zoom.save(output / 'zoom.png')
    result = {'native': str(output / 'native.png'), 'zoom': str(output / 'zoom.png'), 'scale': scale, 'grid': grid, 'displaySize': list(zoom.size)}
    if grid:
        annotated = zoom.copy()
        draw = ImageDraw.Draw(annotated)
        for index in range(1, grid[0]):
            x = round(index * annotated.width / grid[0])
            draw.line((x, 0, x, annotated.height), fill=(255, 70, 70, 255), width=1)
        for index in range(1, grid[1]):
            y = round(index * annotated.height / grid[1])
            draw.line((0, y, annotated.width, y), fill=(255, 70, 70, 255), width=1)
        draw.text((3, 3), f'origin({left},{top}) scale={scale} grid={grid[0]}x{grid[1]}', fill='white', stroke_width=1, stroke_fill='black')
        annotated.save(output / 'grid.png')
        result['annotated'] = str(output / 'grid.png')
        result['sourceCellSize'] = [width / grid[0], height / grid[1]]
    return result


if __name__ == '__main__':
    print(json.dumps(view(json.load(sys.stdin)), ensure_ascii=False))
