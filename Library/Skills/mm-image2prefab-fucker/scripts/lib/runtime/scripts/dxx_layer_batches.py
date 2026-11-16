"""Execute complete material batches once and merge provider placements in source pixels."""
import copy
import hashlib
import json
import math
from pathlib import Path
import shutil

from PIL import Image

from dxx_image import MAX_UPLOAD, MIME, save
from dxx_layers import execute_layers


def read_plan(args):
    plan = json.loads(Path(args.batch_plan_file).read_text(encoding='utf-8-sig'))
    image = Path(args.file).expanduser().resolve()
    if not image.is_file() or image.suffix.lower() not in MIME or image.stat().st_size > MAX_UPLOAD or hashlib.sha256(image.read_bytes()).hexdigest() != plan.get('sourceHash'):
        raise ValueError('拆图计划定图哈希不符 未提交任何批次')
    with Image.open(image) as source:
        source_size = list(source.size)
    batches = plan.get('batches')
    if (plan.get('model') != 'builtin' or plan.get('sourceSize') != source_size
            or plan.get('layerSize') != args.size or args.size not in ('1K', '1.5K', '2K')
            or plan.get('coordinateOrigin') != 'provider_full_reference'
            or not isinstance(batches, list) or not batches or plan.get('requestCount') != len(batches)):
        raise ValueError('拆图计划模型尺寸或批次数量无效 未提交任何批次')
    ids, resources = set(), set()
    for index, batch in enumerate(batches):
        ident, prompt = batch.get('id'), batch.get('prompt')
        resource_ids = batch.get('resourceIds')
        if (not isinstance(ident, str) or not ident or ident in ids or not isinstance(prompt, str)
                or not prompt.strip() or len(prompt) > 2000 or not isinstance(resource_ids, list)
                or any(not isinstance(item, str) or not item for item in resource_ids)
                or len(resource_ids) != len(set(resource_ids)) or resources.intersection(resource_ids)):
            raise ValueError('拆图批次%s无效或超过2000字符 未提交任何批次' % (index + 1))
        ids.add(ident)
        resources.update(resource_ids)
    resource_map = plan.get('resourceMap')
    if not isinstance(resource_map, list):
        raise ValueError('拆图资源引用清单无效 未提交任何批次')
    mapped = {}
    for item in resource_map:
        if (not isinstance(item, dict) or not isinstance(item.get('id'), str) or not item['id']
                or item['id'] in mapped or item.get('resourceId') not in resources):
            raise ValueError('拆图资源重复或复用引用无效 未提交任何批次')
        mapped[item['id']] = item['resourceId']
    if any(mapped.get(ident) != ident for ident in resources) or len(batches) > 1 and not resources:
        raise ValueError('拆图素材归属不完整 未提交任何批次')
    return plan, image


def merge_batch(directory, child, batch, ordinal, source_size, offset):
    manifest = json.loads((child / 'manifest.json').read_text(encoding='utf-8-sig'))
    dimensions = [manifest.get('documentWidth'), manifest.get('documentHeight')]
    if any(not isinstance(value, (int, float)) or not math.isfinite(value) or value <= 0 for value in dimensions) or not isinstance(manifest.get('items'), list):
        raise ValueError('批次%s缺少有效服务端画布尺寸或图层' % batch['id'])
    scale_x, scale_y = source_size[0] / dimensions[0], source_size[1] / dimensions[1]
    prepared, ids = [], set()
    layer_root = (child / 'layers').resolve()
    for item in manifest['items']:
        if item.get('role') == 'base':
            continue
        ident, placement, z_index = item.get('id'), item.get('placement'), item.get('zIndex')
        if not isinstance(ident, str) or not ident or ident in ids or not isinstance(placement, dict):
            raise ValueError('批次%s图层ID或坐标无效' % batch['id'])
        ids.add(ident)
        if any(not isinstance(placement.get(key), (int, float)) or not math.isfinite(placement[key]) for key in ('left', 'top', 'width', 'height')) or placement['width'] <= 0 or placement['height'] <= 0 or not isinstance(z_index, (int, float)) or not math.isfinite(z_index):
            raise ValueError('批次%s图层%s坐标或排序无效' % (batch['id'], ident))
        filename = item.get('file')
        if not isinstance(filename, str) or not filename:
            raise ValueError('批次%s图层文件缺失' % batch['id'])
        source = layer_root / filename
        resolved = source.resolve()
        if layer_root not in resolved.parents or source.is_symlink() or resolved != source.absolute() or not source.is_file() or source.suffix.lower() not in MIME:
            raise ValueError('批次%s图层路径无效或越界' % batch['id'])
        with Image.open(source) as decoded:
            decoded.load()
            if item.get('visible') is not False and decoded.convert('RGBA').getchannel('A').getbbox() is None:
                raise ValueError('批次%s图层%s完全透明' % (batch['id'], ident))
        prepared.append((item, source))
    if not any(item.get('visible') is not False for item, _ in prepared):
        raise ValueError('批次%s没有可用独立素材 原图base不作为素材' % batch['id'])
    output = directory / 'layers'
    output.mkdir(exist_ok=True)
    layers = []
    for index, (item, source) in enumerate(sorted(prepared, key=lambda pair: pair[0]['zIndex'])):
        filename = '%03d-%03d%s' % (ordinal, index, source.suffix.lower())
        target = output / filename
        if target.exists():
            raise ValueError('合并目标已存在 不覆盖已有批次素材')
        shutil.copyfile(source, target)
        placement = item['placement']
        layers.append(dict(item, id='%s:%s' % (batch['id'], item['id']), file=filename,
                           placement={key: placement[key] * (scale_x if key in ('left', 'width') else scale_y) for key in ('left', 'top', 'width', 'height')},
                           zIndex=offset + index, providerZIndex=item['zIndex'], providerLayerId=item['id'],
                           batchId=batch['id'], resourceIds=batch['resourceIds']))
    return layers, dimensions


def execute_layer_batches(args, client):
    if args.task_id or not args.out_dir or not args.file:
        raise ValueError('分批拆图须指定原图和输出目录 不接受已有taskId')
    plan, image = read_plan(args)
    directory = Path(args.out_dir).expanduser().resolve()
    directory.mkdir(parents=True, exist_ok=True)
    if any(item.name != 'decomposition-plan.json' for item in directory.iterdir()):
        raise ValueError('拆图目录已有执行记录 不重放批次 保留成功结果及原请求')
    state = dict(model='builtin', planId=plan['id'], state='prepared', requestCount=plan['requestCount'], completed=[])
    manifest = dict(documentWidth=plan['sourceSize'][0], documentHeight=plan['sourceSize'][1], model='builtin',
                    coordinateOrigin='provider_full_reference', zIndexOrigin='stable_batch_order_layout_controls_final_order',
                    resourceMap=plan['resourceMap'], resourceCatalog=plan.get('resourceCatalog', []), batches=[], items=[])
    save(directory / 'batch-state.json', state, client.key)
    try:
        for ordinal, batch in enumerate(plan['batches'], 1):
            child = directory / ('batch-%03d' % ordinal)
            state.update(state='running', pending=batch['id'], directory=str(child))
            save(directory / 'batch-state.json', state, client.key)
            request = copy.copy(args)
            request.file, request.prompt, request.out_dir = str(image), batch['prompt'], str(child)
            request.submission_journal = str(directory / 'submission-started.json')
            result = execute_layers(request, client)
            layers, dimensions = merge_batch(directory, child, batch, ordinal, plan['sourceSize'], len(manifest['items']))
            completed = dict(id=batch['id'], directory=str(child), taskId=result['taskId'], resourceIds=batch['resourceIds'],
                             documentSize=dimensions, manifest=str(child / 'manifest.json'))
            manifest['items'].extend(layers)
            manifest['batches'].append(completed)
            save(directory / 'partial-manifest.json', manifest, client.key)
            state['completed'].append(completed)
            save(directory / 'batch-state.json', state, client.key)
        save(directory / 'manifest.json', manifest, client.key)
        state.update(state='completed', pending=None)
        save(directory / 'batch-state.json', state, client.key)
        result = dict(status='completed', model='builtin', requestCount=plan['requestCount'], manifest=str(directory / 'manifest.json'),
                      layerDirectory=str(directory / 'layers'), files=[str(directory / 'layers' / item['file']) for item in manifest['items']], batches=state['completed'])
        save(directory / 'layer-files.json', result, client.key)
        return result
    except Exception as error:
        state.update(state='stopped', error=str(error))
        save(directory / 'batch-state.json', state, client.key)
        raise
