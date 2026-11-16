import json
import hashlib
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw


def audit_material(plan, source_file, project, output):
    size = (round(plan['width']), round(plan['height']))
    canvas = Image.new('RGBA', size)
    imported = {item['destination']: Path(item['source']) for item in plan['imports']}
    source_hash = hashlib.sha256(Path(source_file).read_bytes()).digest()
    active = {}
    nodes = list(plan['nodes'])
    components = {item['id']: item['plan'] for item in plan.get('components', [])}
    for instance in plan['nodes']:
        if not instance.get('componentId'):
            continue
        template = components[instance['componentId']]
        for source in template['nodes']:
            if source['id'] == 'root':
                continue
            node = dict(source)
            node.update(next((item for item in instance.get('overrides', []) if item.get('targetId') == source['id']), {}))
            node['id'] = instance['id'] + '/' + source['id']
            node['parent'] = instance['id'] if source['parent'] == 'root' else instance['id'] + '/' + source['parent']
            node['box'] = dict(source['box'], left=instance['box']['left'] + source['box']['left'], top=instance['box']['top'] + source['box']['top'])
            nodes.append(node)
    for node in nodes:
        active[node['id']] = node.get('active', True) and active.get(node.get('parent'), True)
        if not active[node['id']] or not node.get('sprite') or node.get('color', [1, 1, 1, 1])[3] <= 0:
            continue
        file = imported.get(node['sprite'], Path(project) / node['sprite'])
        if file.suffix.lower() not in ('.png', '.jpg', '.jpeg', '.webp'):
            raise ValueError(f"素材覆盖检查需要独立位图 无法确认 {node['id']} {file}")
        box = node['box']
        with Image.open(file) as image:
            image = image.convert('RGBA')
            role = node.get('semanticRole')
            if role == 'background' and hashlib.sha256(file.read_bytes()).digest() == source_hash:
                raise ValueError(f"原始整张UI定图不能作为干净背景 {node['id']}")
            if role in ('icon', 'indicator') and image.getchannel('A').getextrema()[0] == 255:
                raise ValueError(f"独立{role}素材完全不透明 不因decoration分类放行 {node['id']} {file}")
            target_size = (max(1, round(box['width'])), max(1, round(box['height'])))
            position = (round(box['left']), round(box['top']))
            if node.get('preserveAspect'):
                scale = min(target_size[0] / image.width, target_size[1] / image.height)
                fitted_size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
                position = (position[0] + round((target_size[0] - fitted_size[0]) / 2), position[1] + round((target_size[1] - fitted_size[1]) / 2))
                target_size = fitted_size
            image = image.resize(target_size, Image.Resampling.LANCZOS)
            alpha = image.getchannel('A').point(lambda value: round(value * node.get('color', [1, 1, 1, 1])[3]))
            image.putalpha(alpha)
            canvas.alpha_composite(image, position)
    with Image.open(source_file) as reference:
        source_size = reference.size
        required = reference.convert('RGBA').resize(size, Image.Resampling.LANCZOS).getchannel('A').point(lambda value: 255 if value > 0 else 0)
    missing = ImageChops.multiply(required, canvas.getchannel('A').point(lambda value: 255 if value == 0 else 0))
    raw_missing_pixels = missing.histogram()[255]
    tolerance = plan.get('visualTolerance', [0, 0])
    tolerance_x, tolerance_y = (min((size[0] - 1) // 2, max(0, int(tolerance[0]))), min((size[1] - 1) // 2, max(0, int(tolerance[1]))))
    if tolerance_x or tolerance_y:
        interior = Image.new('L', size)
        ImageDraw.Draw(interior).rectangle((tolerance_x, tolerance_y, size[0] - tolerance_x - 1, size[1] - tolerance_y - 1), fill=255)
        missing = ImageChops.multiply(missing, interior)
    missing_pixels = missing.histogram()[255]
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    preview = output / 'material-preview.png'
    canvas.save(preview)
    report = {'sourceSize': list(source_size), 'documentSize': list(size), 'uncoveredPixels': missing_pixels,
              'uncoveredBounds': missing.getbbox(), 'backgroundComplete': missing_pixels == 0, 'preview': str(preview),
              'rawUncoveredPixels': raw_missing_pixels, 'toleratedEdgePixels': raw_missing_pixels - missing_pixels,
              'scope': 'visible raster alpha coverage only; excludes solid fills and text; not a visual fidelity pass'}
    (output / 'material-audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    return report
