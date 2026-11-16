"""Built-in layer decomposition, separate from module task execution."""
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import sys
import time
import uuid
import zipfile

from dxx_image import ID, MIME, MAX_UPLOAD, save, task_id

ENDPOINT = '/api/v1/layer-decomposition/jobs'


def layer_task(response):
    if isinstance(response, dict):
        for candidate in (response.get('job'), response.get('task'), response.get('data'), response):
            if isinstance(candidate, dict) and isinstance(candidate.get('status'), str) and isinstance(candidate.get('done'), bool):
                return candidate
    raise ValueError('未知拆层响应结构：需要 status 和 done；已保存响应，不重新生成。')


def own_url(client, url):
    if not isinstance(url, str) or not url:
        raise ValueError('拆层结果缺少有效下载/查询 URL。')
    return client.own_url(url)


def write_private(path, value):
    # Persist exact retry body, not a redacted reconstruction. No API key included.
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'w', encoding='utf-8') as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2)


def remember_submission(client, directory, response):
    save(directory / 'layer-created.json', response, client.key)
    value = response.get('job', response) if isinstance(response, dict) else response
    ident = task_id(value)
    # 先保留任务 ID，后续 URL 校验失败仍可只读恢复，避免重复提交。
    (directory / 'layer-task-id.txt').write_text(ident, encoding='utf-8')
    poll_url = None
    for candidate in (value, response):
        if isinstance(candidate, dict) and candidate.get('pollUrl'):
            poll_url = own_url(client, candidate['pollUrl'])
            break
    if not poll_url:
        poll_url = own_url(client, ENDPOINT + '/' + ident)
    save(directory / 'layer-state.json', {'taskId': ident, 'pollUrl': poll_url, 'baseUrl': client.base}, client.key)
    print(json.dumps({'taskId': ident, 'status': 'submitted', 'type': 'layer-decomposition'}), file=sys.stderr, flush=True)
    return ident


def safe_extract(archive_path, output):
    output.mkdir(exist_ok=True)
    root = output.resolve()
    files, seen = [], set()
    with zipfile.ZipFile(archive_path) as archive:
        # Validate all members before writing any entry.
        members = []
        for entry in archive.infolist():
            name = entry.filename
            parts = PurePosixPath(name).parts
            if '\\' in name or ':' in name or name.startswith('/') or '..' in parts or not parts or stat.S_ISLNK(entry.external_attr >> 16):
                raise ValueError('ZIP 包含不安全路径/符号链接，未解包。')
            target = (root / Path(*parts)).resolve()
            if root not in target.parents or str(target).casefold() in seen:
                raise ValueError('ZIP 包含越界或重复路径，未解包。')
            seen.add(str(target).casefold())
            members.append((entry, target))
        for entry, target in members:
            if entry.is_dir():
                target.mkdir(parents=True, exist_ok=True)
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(entry) as source, target.open('wb') as sink:
                while True:
                    chunk = source.read(1024 * 1024)
                    if not chunk:
                        break
                    sink.write(chunk)
            files.append(str(target))
    return files


def download_result(client, directory, task):
    result = task.get('result')
    if not isinstance(result, dict):
        raise ValueError('completed 拆层任务缺少 result。')
    targets = [('zipUrl', 'layers.zip'), ('manifestUrl', 'manifest.json'), ('upstreamResponseUrl', 'upstream-response.json')]
    resolved = [(key, name, own_url(client, result.get(key))) for key, name in targets]
    started = time.perf_counter()
    for _, name, url in resolved:
        client.http('GET', url, destination=directory / name, artifact=True)
    manifest = json.loads((directory / 'manifest.json').read_text(encoding='utf-8-sig'))
    if not isinstance(manifest, dict):
        raise ValueError('manifest.json 不是对象，保留原文件供检查。')
    json.loads((directory / 'upstream-response.json').read_text(encoding='utf-8-sig'))
    files = safe_extract(directory / 'layers.zip', directory / 'layers')
    if not any(Path(path).suffix.lower() in MIME for path in files):
        raise ValueError('ZIP 中没有底图或图层图片，不能宣称拆层成功。')
    client.timings['download_and_extract_seconds'] = time.perf_counter() - started
    return {
        'zip': str(directory / 'layers.zip'), 'manifest': str(directory / 'manifest.json'),
        'upstreamResponse': str(directory / 'upstream-response.json'), 'layerDirectory': str(directory / 'layers'),
        'files': files,
    }


def wait_layers(args, client, directory, ident):
    state_path = directory / 'layer-state.json'
    state = json.loads(state_path.read_text(encoding='utf-8')) if state_path.exists() else {}
    if state and (state.get('taskId') != ident or state.get('baseUrl') != client.base):
        raise ValueError('输出目录属于另一任务或 API 源站。')
    poll_url = own_url(client, state.get('pollUrl') or ENDPOINT + '/' + ident)
    if not state:
        save(state_path, {'taskId': ident, 'pollUrl': poll_url, 'baseUrl': client.base}, client.key)
    (directory / 'layer-task-id.txt').write_text(ident, encoding='utf-8')
    started = time.monotonic()
    last_status, last_report = None, started
    while True:
        response = client.api('GET', poll_url)
        save(directory / 'layer-task.json', response, client.key)
        task = layer_task(response)
        if args.action == 'Layerstatus':
            return response
        status, done = task['status'], task['done']
        if done:
            client.timings['wait_wall_seconds'] = time.monotonic() - started
            if status != 'completed':
                error = task.get('error')
                message = error.get('message') if isinstance(error, dict) else str(error or status)
                raise ValueError('拆层已终止（%s）：%s；保留 taskId/requestId，不创建新任务。' % (status, message))
            paths = download_result(client, directory, task)
            result = dict(taskId=ident, status=status, **paths)
            save(directory / 'layer-files.json', result, client.key)
            return result
        if status not in ('queued', 'submitting', 'running', 'saving'):
            raise ValueError('未知拆层状态组合；停止查询，保留任务 ID。')
        if status != last_status or time.monotonic() - last_report >= 30:
            print('拆层任务 %s：%s' % (ident, status), file=sys.stderr, flush=True)
            last_status, last_report = status, time.monotonic()
        remaining = args.timeout_seconds - (time.monotonic() - started)
        if remaining <= 0:
            raise TimeoutError('等待已停止，服务端任务未必失败；使用 Layerwait 和相同 taskId 恢复。')
        time.sleep(min(args.poll_seconds, remaining))


def execute_layers(args, client):
    if not args.out_dir:
        raise ValueError('拆层必须指定 --out-dir。')
    directory = Path(args.out_dir).expanduser().resolve()
    record_path = directory / 'layer-request.json'
    ident = args.task_id
    if args.action == 'Decompose':
        if ident:
            raise ValueError('恢复已有拆层任务请使用 Layerwait，不要 Decompose。')
        if not args.file:
            raise ValueError('Decompose 需要 --file 本地 PNG/JPEG/WebP。')
        image = Path(args.file).expanduser().resolve()
        if not image.is_file() or image.suffix.lower() not in MIME or image.stat().st_size > MAX_UPLOAD:
            raise ValueError('图片必须是存在且不超过 50 MiB 的 PNG/JPEG/WebP 文件。')
        if args.prompt is not None and (not isinstance(args.prompt, str) or len(args.prompt) > 2000):
            raise ValueError('拆层 prompt 最多 2000 字符。')
        if args.size not in ('1K', '1.5K', '2K'):
            raise ValueError('拆层 size 仅支持 1K / 1.5K / 2K。')
        directory.mkdir(parents=True, exist_ok=True)
        if any(directory.iterdir()):
            raise ValueError('新拆层任务需要空输出目录；已有任务请 Layerwait/Layerresume。')
        write_private(directory / 'layer-started.json', {'requestId': str(uuid.uuid4()), 'startedAt': time.time()})
        request_id = json.loads((directory / 'layer-started.json').read_text(encoding='utf-8'))['requestId']
        body = {'image': client.upload(image, relative=True), 'size': args.size}
        if args.prompt is not None:
            body['prompt'] = args.prompt
        if args.project_group_id:
            body['projectGroupId'] = args.project_group_id
        write_private(record_path, {'requestId': request_id, 'baseUrl': client.base, 'body': body})
        if getattr(args, 'submission_journal', None):
            save(Path(args.submission_journal), {'child': str(directory), 'requestId': request_id, 'startedAt': time.time()}, client.key)
        response = client.api('POST', ENDPOINT, body, extra_headers={'Idempotency-Key': request_id})
        ident = remember_submission(client, directory, response)
    elif args.action == 'Layerresume':
        if not record_path.exists():
            raise ValueError('缺少原始 layer-request.json，不能安全重放提交。')
        record = json.loads(record_path.read_text(encoding='utf-8'))
        if record.get('baseUrl') != client.base:
            raise ValueError('原始拆层请求的 API 源站不同。')
        id_path = directory / 'layer-task-id.txt'
        if id_path.exists():
            saved_id = id_path.read_text(encoding='utf-8').strip()
            if ident and ident != saved_id:
                raise ValueError('提供的 taskId 与保存的拆层任务不一致。')
            ident = saved_id
        else:
            if ident:
                raise ValueError('已知 taskId 时请直接 Layerwait，避免重放提交。')
            request_id = record.get('requestId')
            uuid.UUID(request_id)
            response = client.api('POST', ENDPOINT, record['body'], extra_headers={'Idempotency-Key': request_id})
            ident = remember_submission(client, directory, response)
    if not isinstance(ident, str) or not ID.fullmatch(ident):
        raise ValueError('必须提供有效 --task-id。')
    directory.mkdir(parents=True, exist_ok=True)
    return wait_layers(args, client, directory, ident)
