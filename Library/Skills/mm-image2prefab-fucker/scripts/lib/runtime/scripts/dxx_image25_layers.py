import copy
import json
from pathlib import Path
import time

from PIL import Image, ImageOps
from dxx_image import execute, local_modules, read_request, save


def execute_image25_layers(args, client):
    directory = Path(args.out_dir).resolve()
    plan = json.loads(Path(args.elements_file).read_text(encoding='utf-8-sig'))
    requests = plan.get('requests')
    if plan.get('model') != 'image2.5' or not isinstance(requests, list) or not requests:
        raise ValueError('image2.5拆图缺少原子素材计划 未提交')
    if (directory / 'batch-state.json').exists() or (directory / 'submission-started.json').exists():
        raise ValueError('本批次已执行 不重放收费请求 原请求及部分结果保留')
    directory.mkdir(parents=True, exist_ok=True)
    layers = directory / 'layers'
    layers.mkdir()
    prepared = []
    with Image.open(args.file) as source:
        source.load()
        if list(source.size) != plan.get('sourceSize'):
            raise ValueError('原图尺寸与拆图计划不符 未提交')
        for index, item in enumerate(requests):
            left, top, width, height = item['box']
            if min(width, height) <= 0 or min(left, top) < 0 or left + width > source.width or top + height > source.height:
                raise ValueError('素材参考框越界 未提交 ' + item['id'])
            child = directory / ('asset-%03d' % index)
            child.mkdir()
            crop = child / 'reference.png'
            source.crop((left, top, left + width, top + height)).save(crop)
            background = item['semanticRole'] == 'background'
            instruction = ('仅输出整幅干净背景 完全不透明 去除所有独立前景控件角色文字数字和红点 补齐遮挡纹理 不用色块遮盖'
                           if background else '从图1局部中只分离指定素材 去除其他控件邻近背景普通文字数值 不增加新元素 保持轮廓和比例 完整居中且周围真正透明 不画棋盘格 不裁断 S等品质徽标保留字形')
            request = {'function': 'image2.5生图', 'images': [str(crop), str(Path(args.file).resolve())],
                       'prompt': instruction + '\n图2为整体风格参考 不输出整屏界面\n指定素材：' + item['name'] + '\n' + item.get('requirements', '') + '\n' + (args.prompt or ''),
                       'config': {'image25Size': '%dx%d' % tuple(item['requestedSize']), 'image25Background': 'opaque' if background else 'transparent', 'image25OutputFormat': 'png'}}
            request_file = child / 'input.json'
            save(request_file, request, client.key)
            read_request(str(request_file), local_modules())
            prepared.append((item, child, request_file))
    state = {'model': 'image2.5', 'state': 'prepared', 'requestCount': len(prepared), 'completed': []}
    save(directory / 'batch-state.json', state, client.key)
    items = []
    for item, child, request_file in prepared:
        state.update(state='running', pending=item['id'], directory=str(child))
        save(directory / 'batch-state.json', state, client.key)
        run = copy.copy(args)
        run.action, run.out_dir, run.request_file, run.task_id, run.no_preview = 'Run', str(child), str(request_file), None, True
        run.submission_journal = str(directory / 'submission-started.json')
        try:
            result = execute(run, client)
        except Exception:
            if (child / 'submission-started.json').exists():
                save(directory / 'submission-started.json', {'child': str(child), 'elementId': item['id'], 'startedAt': time.time()}, client.key)
            state['state'] = 'stopped'
            save(directory / 'batch-state.json', state, client.key)
            raise
        if len(result['files']) != 1:
            raise ValueError('image2.5每素材须返回一张图 不猜测选择 ' + item['id'])
        with Image.open(result['files'][0]) as raw:
            image = raw.convert('RGBA')
        if list(image.size) != item['requestedSize']:
            raise ValueError('image2.5返回尺寸与请求不符 保留结果不重提 ' + item['id'])
        alpha = image.getchannel('A')
        if item['semanticRole'] == 'background':
            if alpha.getextrema()[0] != 255:
                raise ValueError('背景存在透明缺洞 保留结果不自动补救 ' + item['id'])
            image = image.resize(tuple(item['box'][2:]), Image.Resampling.LANCZOS)
        else:
            bounds = alpha.getbbox()
            if bounds is None or alpha.getextrema()[0] == 255:
                raise ValueError('前景为空或没有透明通道 保留结果不自动重提 ' + item['id'])
            image = ImageOps.contain(image.crop(bounds), tuple(item['box'][2:]), Image.Resampling.LANCZOS)
            canvas = Image.new('RGBA', tuple(item['box'][2:]))
            canvas.alpha_composite(image, ((canvas.width - image.width) // 2, (canvas.height - image.height) // 2))
            image = canvas
        filename = '%03d.png' % len(items)
        image.save(layers / filename)
        items.append({'id': item['id'], 'name': item['name'], 'file': filename, 'role': 'layer', 'semanticRole': item['semanticRole'],
                      'placement': dict(zip(('left', 'top', 'width', 'height'), item['box'])), 'zIndex': item['zIndex'], 'visible': True})
        state['completed'].append({'id': item['id'], 'taskId': result['taskId'], 'directory': str(child)})
        save(directory / 'batch-state.json', state, client.key)
    manifest = directory / 'manifest.json'
    save(manifest, {'documentWidth': plan['sourceSize'][0], 'documentHeight': plan['sourceSize'][1], 'items': items,
                    'model': 'image2.5', 'coordinateOrigin': 'analysis_reference'}, client.key)
    state.update(state='completed', pending=None)
    save(directory / 'batch-state.json', state, client.key)
    return {'status': 'completed', 'manifest': str(manifest), 'model': 'image2.5', 'requestCount': len(items)}
