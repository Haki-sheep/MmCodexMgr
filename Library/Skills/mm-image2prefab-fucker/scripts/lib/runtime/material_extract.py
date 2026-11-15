import json
import sys
from PIL import Image, ImageDraw


def rectangle(value, size):
    if len(value) != 4 or any(type(number) is not int for number in value):
        raise ValueError('裁剪与清除范围必须为整数像素 left top width height')
    left, top, width, height = value
    if left < 0 or top < 0 or width <= 0 or height <= 0 or left + width > size[0] or top + height > size[1]:
        raise ValueError('裁剪或清除范围超出实际位图尺寸')
    return left, top, left + width, top + height


def extract(request):
    with Image.open(request['source']) as original:
        image = original.convert('RGBA')
    source_size = list(image.size)
    draw = ImageDraw.Draw(image)
    for box in request.get('clearBoxes') or []:
        left, top, right, bottom = rectangle(box, image.size)
        draw.rectangle((left, top, right - 1, bottom - 1), fill=(0, 0, 0, 0))
    crop = request.get('cropBox')
    if crop is not None:
        image = image.crop(rectangle(crop, image.size))
    key = request.get('chromaKey')
    if key is not None:
        color = key['color']
        tolerance = key['tolerance']
        feather = key['feather']
        if len(color) != 3 or any(type(number) is not int or number < 0 or number > 255 for number in color):
            raise ValueError('色键color必须是三个0到255整数')
        if not 0 <= tolerance <= 255 or not 1 <= feather <= 255:
            raise ValueError('色键tolerance须为0到255 feather须为1到255')
        pixels = []
        for red, green, blue, alpha in image.getdata():
            distance = max(abs(red - color[0]), abs(green - color[1]), abs(blue - color[2]))
            factor = min(1, max(0, (distance - tolerance) / feather))
            pixels.append((red, green, blue, round(alpha * factor)))
        image.putdata(pixels)
    alpha = image.getchannel('A')
    if alpha.getbbox() is None:
        raise ValueError('提取范围没有可见像素')
    image.save(request['output'], 'PNG')
    audit_output = request.get('auditOutput')
    edge_contact = []
    bounds = alpha.getbbox()
    if crop is not None and bounds is not None:
        left, top, right, bottom = bounds
        if left == 0: edge_contact.append('left')
        if top == 0: edge_contact.append('top')
        if right == image.width: edge_contact.append('right')
        if bottom == image.height: edge_contact.append('bottom')
    if audit_output:
        with Image.open(request['source']) as source:
            preview = source.convert('RGBA')
        scale = min(1, 1280 / preview.width, 800 / preview.height)
        if scale < 1:
            preview = preview.resize((round(preview.width * scale), round(preview.height * scale)), Image.Resampling.LANCZOS)
        overlay = ImageDraw.Draw(preview)
        if crop is not None:
            left, top, right, bottom = rectangle(crop, source_size)
            bounds = tuple(round(value * scale) for value in (left, top, right - 1, bottom - 1))
            overlay.rectangle(bounds, outline=(255, 45, 45, 255), width=max(2, round(4 * scale)))
        for box in request.get('clearBoxes') or []:
            left, top, right, bottom = rectangle(box, source_size)
            bounds = tuple(round(value * scale) for value in (left, top, right - 1, bottom - 1))
            overlay.rectangle(bounds, outline=(255, 220, 30, 255), width=max(2, round(3 * scale)))
        preview.save(audit_output, 'PNG')
    return {'sourceSize': source_size, 'size': list(image.size), 'fullyOpaque': alpha.getextrema()[0] == 255,
            'auditPreview': audit_output, 'edgeContact': edge_contact,
            'edgeReview': '裁剪结果触及输出边缘 请在原图框选对照中确认轮廓未被截断' if edge_contact else None}


if __name__ == '__main__':
    print(json.dumps(extract(json.load(sys.stdin)), ensure_ascii=False))
