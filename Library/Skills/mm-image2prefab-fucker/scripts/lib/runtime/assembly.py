import argparse
import base64
from contextlib import contextmanager
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import time
from material_audit import audit_material

ROOT = Path(__file__).resolve().parent


@contextmanager
def external_import_source(source, project, expected_hash):
    content = source.read_bytes()
    if hashlib.sha256(content).hexdigest() != expected_hash:
        raise RuntimeError('素材 hash 已变化 ' + str(source))
    if not source.is_relative_to(project):
        yield source
        return
    # CLI只接受工程外源图 临时副本保持字节一致且不改变正式素材路径
    temporary_root = Path(tempfile.gettempdir()).resolve()
    if temporary_root.is_relative_to(project):
        raise RuntimeError('系统临时目录位于Unity工程内 无法准备工程外导入源 ' + str(temporary_root))
    with tempfile.TemporaryDirectory(prefix='dsh-ui-import-', dir=temporary_root) as directory:
        staged = Path(directory) / ('source' + source.suffix)
        staged.write_bytes(content)
        yield staged


def initializer(value, kind):
    fields = {
        'Input': {'plan': 'Plan', 'baseline': 'AssetState', 'removedIds': 'string[]'},
        'Plan': {'nodes': 'Node[]', 'imports': 'Import[]', 'components': 'ComponentPlan[]'},
        'ComponentPlan': {'plan': 'Plan'},
        'LayoutConfig': {'spacing': 'float[]', 'padding': 'int[]', 'cellSize': 'float[]'},
        'LayoutElement': {'minSize': 'float[]', 'preferredSize': 'float[]', 'flexibleSize': 'float[]'},
        'AssetState': {'nodeBindings': 'Binding[]', 'dependencies': 'Dependency[]'},
        'Node': {'rect': 'RectData', 'color': 'float[]', 'fontSize': 'float', 'overrides': 'Override[]', 'layout': 'LayoutConfig', 'layoutElement': 'LayoutElement', 'fields': 'string[]'},
        'Override': {'color': 'float[]', 'fontSize': 'float', 'path': 'int[]', 'fields': 'string[]'},
        'RectData': {key: 'float[]' for key in ['anchorMin', 'anchorMax', 'pivot', 'position', 'size']},
    }
    allowed = {
        'Input': {'action', 'plan', 'baseline', 'removedIds'},
        'Plan': {'prefabPath', 'adaptation', 'nodes', 'imports', 'components'},
        'ComponentPlan': {'id', 'plan'},
        'LayoutConfig': {'type', 'constraint', 'constraintCount', 'cellSize', 'spacing', 'padding', 'childAlignment', 'startCorner', 'startAxis', 'childControlWidth', 'childControlHeight', 'childForceExpandWidth', 'childForceExpandHeight'},
        'LayoutElement': {'minSize', 'preferredSize', 'flexibleSize', 'ignoreLayout'},
        'AssetState': {'path', 'guid', 'sha256', 'nodeBindings', 'dependencies'},
        'Binding': {'id', 'gameObjectFileId', 'rectTransformFileId', 'textFileId', 'imageFileId', 'layoutGroupFileId', 'layoutElementFileId'},
        'Dependency': {'path', 'guid', 'sha256'},
        'Node': {'id', 'name', 'parent', 'kind', 'rect', 'sprite', 'text', 'font', 'fontSize', 'fontStyle', 'alignment', 'wordWrap', 'overflow', 'autoSize', 'prefab', 'active', 'sliced', 'preserveAspect', 'siblingIndex', 'color', 'componentId', 'overrides', 'layout', 'layoutElement', 'fields'},
        'LayoutConfig': {'type', 'constraint', 'constraintCount', 'cellSize', 'spacing', 'padding', 'childAlignment', 'startCorner', 'startAxis', 'childControlWidth', 'childControlHeight', 'childForceExpandWidth', 'childForceExpandHeight'},
        'LayoutElement': {'minSize', 'preferredSize', 'flexibleSize', 'ignoreLayout'},
        'Override': {'targetId', 'path', 'text', 'font', 'fontSize', 'sprite', 'color', 'active', 'fields'},
        'Import': {'source', 'destination', 'sha256', 'reuse'},
        'RectData': {'anchorMin', 'anchorMax', 'pivot', 'position', 'size'},
    }
    if value is None:
        return 'null'
    if kind == 'float' and (not isinstance(value, (float, int)) or isinstance(value, bool)):
        raise ValueError('float参数必须是数值 ' + repr(value))
    if kind.endswith('[]') and not isinstance(value, list):
        raise ValueError(kind + '参数必须是数组 ' + repr(value))
    if isinstance(value, dict):
        if kind == 'Override':
            value = dict(value, fields=[key for key in value if key not in ('targetId', 'path', 'fields')])
        parts = [key + '=' + initializer(entry, fields.get(kind, {}).get(key, 'value')) for key, entry in value.items() if key in allowed[kind]]
        return 'new DxxUiModel.' + kind + '{' + ','.join(parts) + '}'
    if isinstance(value, list):
        item_type = kind[:-2]
        array_type = 'DxxUiModel.' + item_type if item_type in allowed else item_type
        return 'new ' + array_type + '[]{' + ','.join(initializer(entry, item_type) for entry in value) + '}'
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False)
    if isinstance(value, bool):
        return str(value).lower()
    if isinstance(value, (float, int)):
        return repr(value) + ('f' if kind == 'float' else '')
    raise ValueError('未知装配参数类型')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cli', required=True)
    parser.add_argument('--request-id', required=True)
    args = parser.parse_args()
    payload = json.load(sys.stdin)
    project = Path(payload['project']).resolve()
    output = Path(payload['output']).resolve()
    output.mkdir(parents=True, exist_ok=True)
    journal = []
    (output / 'input-plan.json').write_text(json.dumps(payload['plan'], ensure_ascii=False), encoding='utf-8')

    if payload['action'] in ('assemble', 'update'):
        material = audit_material(payload['plan'], payload['source'], project, output)
        if not material['backgroundComplete']:
            raise ValueError('素材存在透明缺洞 不能用纯色底垫冒充还原 先补齐完整背景 保留拆层无需重新收费拆图 ' + json.dumps(material, ensure_ascii=False))

    def invoke(arguments, code=None, suffix=''):
        started = time.perf_counter()
        command = [args.cli] + arguments + ['--project', str(project), '--json']
        if code is not None:
            command += ['--request-id', args.request_id + suffix, '--timeout', '60']
        request_id = command[command.index('--request-id') + 1] if '--request-id' in command else None
        (output / 'pending-request.json').write_text(json.dumps({'requestId': request_id, 'arguments': arguments}, ensure_ascii=False), encoding='utf-8')
        result = subprocess.run(command, input=code, text=True, encoding='utf-8', capture_output=True, timeout=90, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        try:
            receipt = json.loads(result.stdout)
        except ValueError as error:
            raise RuntimeError('CLI 未返回 JSON ' + result.stderr[-1500:]) from error
        record = {'arguments': arguments, 'requestId': request_id, 'seconds': time.perf_counter() - started, 'receipt': receipt}
        journal.append(record)
        (output / 'receipts.json').write_text(json.dumps(journal, ensure_ascii=False, indent=2), encoding='utf-8')
        if result.returncode != 0 or not receipt.get('ok'):
            raise RuntimeError(json.dumps(receipt, ensure_ascii=False))
        if code is not None:
            data = receipt.get('data', {})
            value = data.get('result')
            if value is None:
                value = (data.get('operation') or {}).get('result')
            if value is None:
                raise RuntimeError('Unity 尚未返回终态 保留原 request ID ' + args.request_id + suffix)
            return value
        return receipt

    def execute(action, suffix, plan=None, update=False):
        unit = {'action': action, 'plan': plan or payload['plan']}
        if update:
            unit['baseline'] = payload['baseline']
            changes = {item['id']: item['fields'] for item in payload['changes']}
            unit['removedIds'] = [key for key, fields in changes.items() if 'remove' in fields]
            unit['plan'] = dict(unit['plan'], nodes=[dict(node, fields=changes.get(node['id'], [])) for node in unit['plan']['nodes']])
        code = (ROOT / ('update.cs.txt' if update else 'assemble.cs.txt')).read_text(encoding='utf-8').replace('__INPUT__', initializer(unit, 'Input'))
        code += '\n' + (ROOT / 'asset-state.cs.txt').read_text(encoding='utf-8')
        code += '\n' + (ROOT / 'font-glyphs.cs.txt').read_text(encoding='utf-8')
        return invoke(['editor', 'exec', '--code-file', '-'], code, suffix)

    guard = invoke(['editor', 'guard-check'])
    if not guard.get('data', {}).get('allowed'):
        raise RuntimeError('Unity 现场保护或状态不允许执行')
    if payload['action'] in ('assemble', 'update'):
        updating = payload['action'] == 'update'
        # 更新的新Sprite先导入后再检查资源 原基准在写入前由JS及Unity双重核对
        for index, component in enumerate(payload['plan'].get('components', [])):
            if not component.get('reuse'):
                execute('validate', '-component-' + str(index) + '-validate', component['plan'])
        validated = execute('validate', '-validate', update=updating) if not updating else {'passed': True}
        if not validated.get('passed'):
            raise RuntimeError('装配预检未通过')
        if not updating:
            execute('folders', '-folders')
        elif any(not item.get('reuse') for item in payload['plan']['imports']):
            execute('folders', '-folders', update=True)
        for index, item in enumerate(payload['plan']['imports']):
            source = Path(item['source']).resolve()
            if hashlib.sha256(source.read_bytes()).hexdigest() != item['sha256']:
                raise RuntimeError('素材 hash 已变化 ' + str(source))
            if item.get('reuse'):
                destination = project / item['destination']
                if hashlib.sha256(destination.read_bytes()).hexdigest() != item['sha256']:
                    raise RuntimeError('复用素材 hash 已变化 拒绝写入 ' + str(destination))
                continue
            with external_import_source(source, project, item['sha256']) as import_source:
                arguments = ['asset', 'import-file', str(import_source), item['destination'], '--expected-source-sha256', item['sha256']]
                invoke(arguments + ['--dry-run'])
                invoke(arguments + ['--request-id', args.request_id + '-import-' + str(index)])
        for index, component in enumerate(payload['plan'].get('components', [])):
            if not component.get('reuse'):
                execute('folders', '-component-' + str(index) + '-folders', component['plan'])
                execute('assemble', '-component-' + str(index) + '-apply', component['plan'])
        if updating:
            if any(not item.get('reuse') for item in payload['plan']['imports']):
                execute('imports', '-imports', update=True)
            execute('validate', '-validate', update=True)
        result = execute('update' if updating else 'assemble', '-apply', update=updating)
        (output / 'applied.json').write_text(json.dumps({'plan': payload['plan'], 'assetState': result['asset_state']}, ensure_ascii=False, indent=2), encoding='utf-8')
    preview = output / 'preview.png'
    config = {'prefab': payload['plan']['prefabPath'], 'width': payload['plan']['width'], 'height': payload['plan']['height'], 'render': True, 'output': str(preview), 'toleranceX': payload['plan'].get('visualTolerance', [0.5, 0.5])[0], 'toleranceY': payload['plan'].get('visualTolerance', [0.5, 0.5])[1]}
    code = (ROOT / 'inspect.cs.txt').read_text(encoding='utf-8')
    code += '\n' + (ROOT / 'font-glyphs.cs.txt').read_text(encoding='utf-8')
    original = 'JsonUtility.FromJson<Config>(System.Text.Encoding.UTF8.GetString(Convert.FromBase64String("__PAYLOAD_BASE64__")))'
    expression = 'new Config{' + ','.join(key + '=' + initializer(value, 'float' if key in ('toleranceX', 'toleranceY') else 'value') for key, value in config.items()) + '}'
    if original not in code:
        raise RuntimeError('检查模板契约变化')
    code = code.replace(original, expression)
    inspected = invoke(['editor', 'exec', '--code-file', '-'], code, '-inspect')
    inspected['passed'] = (inspected.get('structural_passed') is True
                           and inspected.get('layout_validation') == 'passed'
                           and inspected.get('render_state') == 'captured_requires_visual_review'
                           and not inspected.get('errors') and not inspected.get('geometry')
                           and inspected.get('scene_unchanged') is True
                           and not any(item.get('missing_glyphs') for item in inspected.get('texts', []))
                           and isinstance(inspected.get('hit_targets'), list)
                           and all(item.get('correct_target') is True and item.get('interactable') is True for item in inspected['hit_targets']))
    inspected['preview'] = inspected.get('screenshot')
    result = {**(result if payload['action'] in ('assemble', 'update') else {}), **inspected, 'prefab_created': True}
    result['receiptDirectory'] = str(output)
    result['receiptTimings'] = [{'requestId': item['requestId'], 'command': item['arguments'], 'seconds': item['seconds']} for item in journal]
    (output / 'result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
