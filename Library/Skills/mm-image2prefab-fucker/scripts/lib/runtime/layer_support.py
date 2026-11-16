import base64
import gzip
import hashlib
import io
import json
import re
import struct
import sys
from pathlib import Path

from PIL import Image


MAX_RUNS = 262144


def encode(data):
    return base64.b64encode(gzip.compress(data, mtime=0)).decode('ascii')


def alpha_support(alpha):
    width, height = alpha.size
    histogram = alpha.histogram()
    visible = width * height - histogram[0]
    if visible == 0:
        return {'kind': 'empty', 'visiblePixels': 0}
    if histogram[255] == width * height:
        return {'kind': 'rect', 'visiblePixels': visible}
    if visible == width * height:
        return {'kind': 'rect', 'visiblePixels': visible}
    active = {}
    packed = bytearray()
    count = 0
    for y in range(height):
        row = alpha.crop((0, y, width, y + 1)).tobytes()
        following = {}
        for match in re.finditer(rb'[^\x00]+', row):
            key = (match.start(), match.end())
            start = active.pop(key, y)
            following[key] = start
        for (left, right), top in active.items():
            packed.extend(struct.pack('<IIII', left, top, right - left, y - top))
            count += 1
        active = following
        if count + len(active) > MAX_RUNS:
            bitmap = alpha.point(lambda value: 255 if value else 0).convert('1', dither=Image.Dither.NONE)
            return {'kind': 'bitmap', 'encoding': 'gzip-base64-msb1', 'rowBytes': (width + 7) // 8,
                    'data': encode(bitmap.tobytes()), 'visiblePixels': visible}
    for (left, right), top in active.items():
        packed.extend(struct.pack('<IIII', left, top, right - left, height - top))
        count += 1
    return {'kind': 'runs', 'encoding': 'gzip-base64-u32le-xywh', 'count': count,
            'data': encode(packed), 'visiblePixels': visible}


def extract_layer(layer):
    source = Path(layer['file'])
    try:
        data = source.read_bytes()
        with Image.open(io.BytesIO(data)) as image:
            image.load()
            size = list(image.size)
            if 'A' not in image.getbands() and 'transparency' not in image.info:
                support = {'kind': 'rect', 'visiblePixels': size[0] * size[1]}
            else:
                alpha = image.getchannel('A') if 'A' in image.getbands() else image.convert('RGBA').getchannel('A')
                support = alpha_support(alpha)
        return {'layerId': layer['id'], 'file': str(source.resolve()),
                'sha256': hashlib.sha256(data).hexdigest(), 'pixelSize': size, **support}
    except Exception as error:
        raise RuntimeError(f"原图层支撑集读取失败 layer={layer.get('id')} file={source} {error}") from error


def extract(request):
    document = request.get('document', request)
    result = {'version': 1, 'alphaThreshold': 0,
              'layers': [extract_layer(layer) for layer in document['layers']]}
    if request.get('output'):
        output = Path(request['output'])
        output.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    return result


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    print(json.dumps(extract(json.load(sys.stdin)), ensure_ascii=False, separators=(',', ':')))
