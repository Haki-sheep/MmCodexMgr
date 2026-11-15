#!/usr/bin/env python3
"""Portable DXX image CLI. Python 3.9+, standard library only."""
import argparse
import copy
import json
import os
from pathlib import Path
import re
import sys
import time
import uuid
import socket
from urllib.error import URLError
from urllib.error import HTTPError
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, HTTPRedirectHandler, build_opener

ROOT = Path(__file__).resolve().parent.parent
ID = re.compile(r'[A-Za-z0-9_-]{1,200}')
MIME = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp'}
EXT = {'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif'}
MAX_UPLOAD = 52428800


class ApiError(RuntimeError):
    def __init__(self, status, response_body='', method='', url=''):
        self.status = status
        # 保存服务端诊断；调用方落盘和输出时统一脱敏。
        self.response_body = response_body
        self.method = method
        self.url = url
        super().__init__('HTTP %s：%s%s' % (status, response_body, '；POST 未自动重试。' if method == 'POST' else ''))


def env_value(name, default=''):
    value = os.environ.get(name, '')
    if not value and sys.platform == 'win32':
        import winreg
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, 'Environment') as key:
                value = winreg.QueryValueEx(key, name)[0]
        except OSError:
            pass
    return value or default


def local_modules():
    return json.loads((ROOT / 'references/modules.json').read_text(encoding='utf-8-sig'))


def make_previews(files):
    # Optional convenience: never install a dependency or fail a completed job.
    try:
        from PIL import Image
    except ImportError:
        return []
    previews = []
    for file in files:
        try:
            with Image.open(file) as image:
                image.thumbnail((720, 1280))
                preview = Path(file).with_name(Path(file).stem + '-preview.jpg')
                if image.mode == 'RGBA':
                    canvas = Image.new('RGB', image.size, 'white')
                    canvas.paste(image, mask=image.getchannel('A'))
                    image = canvas
                else:
                    image = image.convert('RGB')
                image.save(preview, quality=85)
                previews.append(str(preview))
        except Exception:
            continue
    return previews


def protect(text, key=''):
    if key:
        text = text.replace(key, '[REDACTED]')
    text = re.sub(r'(?i)Bearer\s+[^\s"\\]+', 'Bearer [REDACTED]', text)
    text = re.sub(r'eyJ[\w-]+\.[\w-]+\.[\w-]+', '[REDACTED-JWT]', text)
    return re.sub(r'(https?://[^\s"?]+)\?[^\s"]+', r'\1?[REDACTED]', text)


def save(path, value, key=''):
    Path(path).write_text(protect(json.dumps(value, ensure_ascii=False, indent=2), key), encoding='utf-8')


def origin(url):
    parsed = urlsplit(url)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError('仅支持无用户名密码的 HTTPS 地址。')
    return parsed.scheme, parsed.hostname.lower(), parsed.port or 443


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class Client:
    def __init__(self):
        self.key = env_value('GORILLA_API_KEY')
        if not self.key.strip():
            raise ValueError('当前进程缺少 GORILLA_API_KEY；请在实际运行 CLI 的终端设置，或将其传入启动 Codex 的进程。')
        self.base = env_value('GORILLA_API_BASE', 'https://canvas.dxx.cn').rstrip('/')
        self.source = origin(self.base)
        parsed = urlsplit(self.base)
        if parsed.path or parsed.query or parsed.fragment:
            raise ValueError('GORILLA_API_BASE 必须为无路径和查询参数的 HTTPS 源站。')
        self.opener = build_opener(NoRedirect())
        self.timings = {}

    def measured(self, stage, function, *args, **kwargs):
        started = time.perf_counter()
        try:
            return function(*args, **kwargs)
        finally:
            self.timings[stage] = self.timings.get(stage, 0) + time.perf_counter() - started

    def own_url(self, url):
        # 仅兼容同一 HTTPS 主机遗漏端口，不接受外站或不同的显式端口。
        if not isinstance(url, str) or not url:
            raise ValueError('缺少有效的 API 资源地址。')
        absolute = urljoin(self.base + '/', url)
        target = origin(absolute)
        parsed = urlsplit(absolute)
        if target != self.source and target[:2] == self.source[:2] and parsed.port is None:
            absolute = parsed._replace(netloc=urlsplit(self.base).netloc).geturl()
        if origin(absolute) != self.source:
            raise ValueError('查询和下载必须指向配置的 API 源站。')
        return absolute

    def http(self, method, url, body=None, destination=None, extra_headers=None, raw=None, content_type=None, artifact=False):
        for hop in range(6):
            target = origin(url)
            headers = {}
            if extra_headers and target == self.source:
                headers.update(extra_headers)
            if target == self.source:
                headers['Authorization'] = 'Bearer ' + self.key
            data = None
            if body is not None:
                data = json.dumps(body, ensure_ascii=False).encode('utf-8')
                headers['Content-Type'] = 'application/json; charset=utf-8'
            if raw is not None:
                data = raw
                headers['Content-Type'] = content_type or 'application/octet-stream'
            request = Request(url, data=data, headers=headers, method=method)
            try:
                response = self.opener.open(request, timeout=120)
            except HTTPError as error:
                with error:
                    if 300 <= error.code < 400 and destination and error.headers.get('Location') and hop < 5:
                        url = urljoin(url, error.headers['Location'])
                        continue
                    # 限制异常响应大小，保留 JSON 或文本原因，不重复提交 POST。
                    response_body = error.read(1024 * 1024 + 1)
                    truncated = len(response_body) > 1024 * 1024
                    detail = response_body[:1024 * 1024].decode('utf-8-sig', errors='replace')
                    if truncated:
                        detail += '\n[响应超过 1 MiB，已截断]'
                    raise ApiError(error.code, protect(detail, self.key), method, protect(url, self.key)) from None
            with response:
                if destination:
                    mime = response.headers.get_content_type()
                    if not artifact and not mime.startswith('image/'):
                        return None
                    if not artifact and mime not in EXT:
                        raise ValueError('不支持保存的图片类型：' + mime)
                    path = Path(destination) if artifact else Path(str(destination) + EXT[mime])
                    partial = Path(str(path) + '.partial')
                    with partial.open('wb') as output:
                        while True:
                            chunk = response.read(1024 * 1024)
                            if not chunk:
                                break
                            output.write(chunk)
                    partial.replace(path)
                    return str(path.resolve())
                try:
                    return json.loads(response.read().decode('utf-8-sig'))
                except (ValueError, UnicodeError):
                    raise ValueError('服务器返回非 JSON 响应；未自动重试。') from None
        raise ValueError('下载重定向次数超过限制。')

    def api(self, method, path, body=None, **kwargs):
        stage = 'discovery_http_seconds' if path == '/api/mcp/modules' else ('upload_http_seconds' if path.startswith('/api/media/upload') else ('submit_http_seconds' if method == 'POST' else 'poll_http_seconds'))
        for attempt in range(3):
            try:
                return self.measured(stage, self.http, method, urljoin(self.base + '/', path), body, **kwargs)
            except (ApiError, URLError, TimeoutError, socket.timeout) as error:
                temporary = not isinstance(error, ApiError) or error.status in (429, 500, 502, 503, 504)
                if method != 'GET' or not temporary or attempt == 2:
                    raise
                time.sleep(2 ** attempt)

    def upload(self, image, relative=False):
        if isinstance(image, Path):
            if image.stat().st_size > MAX_UPLOAD:
                raise ValueError('图片超过新版接口 50 MiB 上传限制；未压缩或上传。')
            boundary = 'dxx-' + uuid.uuid4().hex
            # UTF-8 filenames are sent as bytes, without control/header characters.
            filename = image.name.replace('"', '_').replace('\\', '_').replace('\r', '_').replace('\n', '_')
            head = ('--%s\r\nContent-Disposition: form-data; name="file"; filename="%s"\r\nContent-Type: %s\r\n\r\n' % (boundary, filename, MIME[image.suffix.lower()])).encode('utf-8')
            raw = head + image.read_bytes() + ('\r\n--%s--\r\n' % boundary).encode('ascii')
            response = self.api('POST', '/api/media/upload', raw=raw, content_type='multipart/form-data; boundary=' + boundary)
            field = 'url'
        else:
            response = self.api('POST', '/api/media/upload-json', {'remoteUrl': image, 'purpose': 'reference_image'})
            field = 'assetUrl'
        file = response.get('file') if isinstance(response, dict) else None
        asset = file.get(field) if isinstance(file, dict) else None
        if not isinstance(asset, str) or not asset:
            raise ValueError('上传返回缺少 file.%s，停止提交。' % field)
        result = self.own_url(asset)
        if relative:
            # 拆层接口只接收已上传资源的相对路径，普通模块保持完整 URL。
            parsed = urlsplit(result)
            if not parsed.path.startswith('/assets/') or parsed.query or parsed.fragment:
                raise ValueError('拆层上传结果必须是无查询参数的 /assets/ 资源路径。')
            return parsed.path
        return result

    def modules(self):
        response = self.api('GET', '/api/mcp/modules')
        if not isinstance(response, dict) or not isinstance(response.get('modules'), list):
            raise ValueError('未知模块目录结构。')
        known = local_modules()
        result = []
        for item in known:
            matches = [m for m in response['modules'] if m.get('id') == item['id'] and m.get('name') == item['name']]
            if len(matches) != 1:
                raise ValueError('模块缺失或 ID/名称变化：' + item['name'])
            result.extend(matches)
        return result


def read_request(path, modules):
    if str(path) == '-':
        path = Path.cwd() / 'stdin.json'
        request = json.loads(sys.stdin.read().lstrip('\ufeff'))
    else:
        path = Path(path).expanduser().resolve()
        request = json.loads(path.read_text(encoding='utf-8-sig'))
    if not isinstance(request, dict) or set(request) - {'function', 'prompt', 'images', 'config'}:
        raise ValueError('请求必须是对象且只能包含 function/prompt/images/config。')
    if not isinstance(request.get('prompt'), str) or not request['prompt'].strip():
        raise ValueError('prompt 必须是非空字符串。')
    aliases = {'dxx_image2.5': 'image2.5生图', 'dxx_banana': 'banana', 'dxx_banana2': 'banana', 'dxx_seedream5': 'seedream5.0'}
    chosen = aliases.get(request.get('function'), request.get('function'))
    if chosen in ('banana', 'seedream5.0'):
        chosen = ('图像编辑' if request.get('images') else '文生图') + '(' + chosen + ')'
    request['function'] = chosen
    matches = [m for m in modules if m['name'] == request.get('function')]
    if len(matches) != 1:
        raise ValueError('function 必须明确选择六个支持功能之一。')
    module = matches[0]
    images = request.get('images', [])
    fields = [f for f in module['exposedInputs'] if f['dataType'] == 'image']
    if not isinstance(images, list) or not sum(bool(f.get('required')) for f in fields) <= len(images) <= len(fields):
        raise ValueError('images 类型或图片数量不符合模块要求。')
    normalized = []
    for entry in images:
        if not isinstance(entry, str) or not entry.strip():
            raise ValueError('图片输入必须是路径或 HTTPS URL。')
        if entry.lower().startswith('https://'):
            origin(entry)
            normalized.append(entry)
        else:
            local = Path(entry).expanduser()
            if not local.is_absolute():
                local = path.parent / local
            if not local.is_file() or local.suffix.lower() not in MIME:
                raise ValueError('本地图片必须是存在的 PNG/JPEG/WebP 文件：' + entry)
            if local.stat().st_size > MAX_UPLOAD:
                raise ValueError('本地图片超过 50 MiB，未上传或提交。')
            normalized.append(local.resolve())
    config = request.get('config', {})
    if not isinstance(config, dict):
        raise ValueError('config 必须是对象。')
    options = {f['key']: f for f in module['configurableFields']}
    for key, value in config.items():
        if key not in options or not isinstance(value, str):
            raise ValueError('未知配置字段或非字符串配置：' + key)
        if options[key]['type'] == 'enum' and value not in options[key]['options']:
            raise ValueError('配置值不在允许枚举中：' + key)
    if module['name'] == 'image2.5生图':
        size = config.get('image25Size', 'auto')
        if size != 'auto':
            if not re.fullmatch(r'[0-9]{1,4}x[0-9]{1,4}', size):
                raise ValueError('image25Size 必须是 auto 或 宽x高。')
            width, height = map(int, size.split('x'))
            if min(width, height) <= 0 or width % 16 or height % 16 or max(width, height) > 3840 or max(width, height) > 3 * min(width, height) or not 655360 <= width * height <= 8294400:
                raise ValueError('image25Size 不符合尺寸、比例或总像素限制。')
        effective = {key: f.get('defaultValue') for key, f in options.items()}
        effective.update(config)
        if effective.get('image25Background') == 'transparent' and effective.get('image25OutputFormat') != 'png':
            raise ValueError('image2.5 透明背景仅支持 PNG。')
    return module, request['prompt'], normalized, config


def body_for(client, request):
    module, prompt, images, config = request
    inputs = {'文本输入': prompt}
    for index, image in enumerate(images, 1):
        inputs['图像输入%d' % index] = client.upload(image)
    return dict(moduleId=module['id'], moduleName=module['name'], inputs=inputs, config=config)


def candidates(response):
    if not isinstance(response, dict):
        return []
    data = response.get('data')
    return [response.get('task'), data.get('task') if isinstance(data, dict) else None, data, response]


def task_id(response):
    for value in candidates(response):
        if isinstance(value, dict):
            for key in ('taskId', 'id'):
                if isinstance(value.get(key), str) and ID.fullmatch(value[key]):
                    return value[key]
    raise ValueError('提交响应缺少可识别 taskId/id。不要重新提交；请检查 created.json。')


def task_from(response):
    for value in candidates(response):
        if isinstance(value, dict) and isinstance(value.get('status'), str):
            return value
    raise ValueError('未知任务响应结构；已保存脱敏响应。')


def urls(value):
    if isinstance(value, str) and value.startswith(('https://', '/assets/')):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from urls(item)
    elif isinstance(value, dict):
        for key, item in value.items():
            if key not in ('prompt', 'text', 'description', 'mimeType', 'nodeLogs', 'upstreamResponseUrl', 'manifestUrl'):
                yield from urls(item)


def execute(args, client):
    if args.action == 'List':
        return client.modules()
    if args.action == 'Run':
        submit_args = copy.copy(args)
        submit_args.action = 'Submit'
        submitted = execute(submit_args, client)
        print(json.dumps({'taskId': submitted['taskId'], 'status': 'submitted'}, ensure_ascii=False), file=sys.stderr, flush=True)
        wait_args = copy.copy(args)
        wait_args.action = 'Wait'
        wait_args.task_id = submitted['taskId']
        return execute(wait_args, client)
    if not args.out_dir:
        raise ValueError('必须指定 --out-dir。')
    directory = Path(args.out_dir).expanduser().resolve()
    if args.action == 'Submit':
        if not args.request_file:
            raise ValueError('Submit 必须指定 --request-file。')
        marker = directory / 'submission-started.json'
        if marker.exists():
            raise ValueError('此目录已有提交记录；请用任务 ID 恢复查询，新生成需新目录。')
        modules = client.modules() if getattr(args, 'refresh_modules', False) else local_modules()
        request = read_request(args.request_file, modules)
        directory.mkdir(parents=True, exist_ok=True)
        with marker.open('x', encoding='utf-8') as handle:
            json.dump({'startedAt': time.time(), 'function': request[0]['name']}, handle, ensure_ascii=False)
        body = body_for(client, request)
        save(directory / 'request.json', body, client.key)
        if getattr(args, 'submission_journal', None):
            save(Path(args.submission_journal), {'child': str(directory), 'startedAt': time.time()}, client.key)
        response = client.api('POST', '/api/execute/playground-tasks', body)
        save(directory / 'created.json', response, client.key)
        ident = task_id(response)
        (directory / 'task-id.txt').write_text(ident, encoding='utf-8')
        return dict(taskId=ident, outDir=str(directory), next='Wait')
    if not args.task_id or not ID.fullmatch(args.task_id):
        raise ValueError('必须指定有效的 --task-id。')
    directory.mkdir(parents=True, exist_ok=True)
    id_file = directory / 'task-id.txt'
    if id_file.exists() and id_file.read_text(encoding='utf-8-sig').strip() != args.task_id:
        raise ValueError('输出目录属于另一个任务。')
    id_file.write_text(args.task_id, encoding='utf-8')
    started = time.monotonic()
    last_status, last_report = None, started
    while True:
        response = client.api('GET', '/api/execute/playground-tasks/' + args.task_id)
        save(directory / 'task.json', response, client.key)
        task = task_from(response)
        if args.action == 'Status':
            return response
        status = task['status']
        if status == 'completed':
            if isinstance(client, Client):
                client.timings['wait_wall_seconds'] = time.monotonic() - started
                client.timings['server_execution_ms'] = task.get('executionTime')
                client.timings['server_created_at'] = task.get('createdAt')
                client.timings['server_updated_at'] = task.get('updatedAt')
            result = task.get('result')
            if not isinstance(result, dict) or 'outputs' not in result:
                raise ValueError('completed 任务没有 result.outputs；请检查 task.json。')
            files = []
            download_started = time.perf_counter()
            for index, url in enumerate(dict.fromkeys(urls(result['outputs'])), 1):
                file = client.http('GET', urljoin(client.base + '/', url), destination=directory / ('image-%02d' % index))
                if file:
                    files.append(file)
            if not files:
                raise ValueError('未识别或下载到受支持图片；请检查 task.json。')
            if isinstance(client, Client):
                client.timings['download_seconds'] = time.perf_counter() - download_started
            preview_started = time.perf_counter()
            previews = [] if getattr(args, 'no_preview', False) else make_previews(files)
            if isinstance(client, Client):
                client.timings['preview_seconds'] = time.perf_counter() - preview_started
            save(directory / 'files.json', {'files': files}, client.key)
            return dict(taskId=args.task_id, status=status, files=files, previews=previews)
        if status == 'error':
            raise ValueError('生成失败：%s。详情见 task.json。' % task.get('errorMsg', 'unknown'))
        if status not in ('queued', 'pending', 'running', 'submitting', 'saving'):
            raise ValueError('未知任务状态：' + status)
        if status != last_status or time.monotonic() - last_report >= 30:
            print('任务 %s：%s' % (args.task_id, status), file=sys.stderr, flush=True)
            last_status, last_report = status, time.monotonic()
        remaining = args.timeout_seconds - (time.monotonic() - started)
        if remaining <= 0:
            raise TimeoutError('等待超时；使用相同 TaskId 恢复 Wait，不要再次 Submit。')
        time.sleep(min(args.poll_seconds, remaining))


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['Run', 'List', 'Submit', 'Status', 'Wait', 'Decompose', 'Layerwait', 'Layerstatus', 'Layerresume'], type=str.title)
    parser.add_argument('--request-file')
    parser.add_argument('--task-id')
    parser.add_argument('--out-dir')
    parser.add_argument('--timeout-seconds', type=int, default=1800)
    parser.add_argument('--poll-seconds', type=int, default=4)
    parser.add_argument('--file', help='One local PNG/JPEG/WebP for layer decomposition')
    parser.add_argument('--prompt', default=None, help='Optional layer separation description, max 2000 characters')
    parser.add_argument('--size', choices=['1K', '1.5K', '2K'], default='1K')
    parser.add_argument('--project-group-id', help='Only when user explicitly selected a billing group')
    parser.add_argument('--decompose-model', choices=['builtin', 'image2.5'], default='builtin')
    parser.add_argument('--elements-file', help='Validated image2.5 atomic material plan')
    parser.add_argument('--batch-plan-file', help='Validated built-in decomposition batches')
    parser.add_argument('--refresh-modules', action='store_true', help='Refresh metadata before submitting; default uses bundled verified snapshot')
    parser.add_argument('--no-preview', action='store_true', help='Skip optional Pillow thumbnail')
    args = parser.parse_args(argv)
    if not 1 <= args.timeout_seconds <= 86400 or not 2 <= args.poll_seconds <= 60:
        parser.error('timeout-seconds 须为 1–86400，poll-seconds 须为 2–60。')
    key = env_value('GORILLA_API_KEY')
    client = None
    started = time.perf_counter()
    try:
        client = Client()
        if args.action == 'Decompose' and args.decompose_model == 'builtin' and args.batch_plan_file:
            from dxx_layer_batches import execute_layer_batches
            result = execute_layer_batches(args, client)
        elif args.action == 'Decompose' and args.decompose_model == 'image2.5':
            from dxx_image25_layers import execute_image25_layers
            result = execute_image25_layers(args, client)
        elif args.action in ('Decompose', 'Layerwait', 'Layerstatus', 'Layerresume'):
            from dxx_layers import execute_layers
            result = execute_layers(args, client)
        else:
            result = execute(args, client)
        if isinstance(result, dict):
            result['timing'] = dict(client.timings, cli_total_seconds=time.perf_counter() - started)
        print(protect(json.dumps(result, ensure_ascii=False, indent=2), key))
        return 0
    except Exception as error:
        message = protect(str(error), key)
        if args.out_dir:
            directory = Path(args.out_dir).expanduser()
            if directory.is_dir():
                try:
                    diagnostic = dict(error=message, action=args.action, taskId=args.task_id)
                    if isinstance(error, ApiError):
                        diagnostic.update(status=error.status, method=error.method, url=error.url, responseBody=error.response_body)
                    save(directory / 'error.json', diagnostic, key)
                except OSError:
                    pass
        print(message, file=sys.stderr)
        return 2 if isinstance(error, TimeoutError) else 1
    finally:
        if client and args.out_dir and Path(args.out_dir).expanduser().is_dir():
            try:
                save(Path(args.out_dir).expanduser() / 'timing.json', dict(client.timings, cli_total_seconds=time.perf_counter() - started), key)
            except OSError:
                pass


if __name__ == '__main__':
    if sys.version_info < (3, 9):
        sys.exit('Python 3.9+ required')
    for stream in (sys.stdin, sys.stdout, sys.stderr):
        if hasattr(stream, 'reconfigure'):
            stream.reconfigure(encoding='utf-8')
    sys.exit(main())
