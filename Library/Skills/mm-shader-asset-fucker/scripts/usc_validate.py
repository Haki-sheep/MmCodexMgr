import argparse
import concurrent.futures
import hashlib
import json
from pathlib import Path
import re
import socket
import struct
import subprocess
import sys
import time

import usc_compile as usc


PLATFORMS = {'d3d11': 4, 'gles20': 5, 'gles3': 9, 'openglcore': 15}
PROGRAM = re.compile(r'\b(CGPROGRAM|HLSLPROGRAM)\b(.*?)\b(ENDCG|ENDHLSL)\b', re.S)
VARIANT = re.compile(r'^\s*//\s*----\s+variant\s+\d+\s*(?:\(base\)|:\s*(.*?))?\s*----\s*$', re.M)
KEYWORD = re.compile(r'^[A-Za-z_][A-Za-z0-9_]*$')


def program_plans(source, explicit_keywords=None):
    plans = []
    pass_starts = [match.start() for match in re.finditer(r'\bPass\s*\{', source)]
    for index, match in enumerate(PROGRAM.finditer(source)):
        body = match[2]
        expected_end = 'ENDCG' if match[1] == 'CGPROGRAM' else 'ENDHLSL'
        if match[3] != expected_end:
            raise ValueError(f'Program {index} has mismatched delimiter {match[3]}')
        previous = max((position for position in pass_starts if position < match.start()), default=0)
        names = re.findall(r'\bName\s+"([^"]*)"', source[previous:match.start()])
        pass_name = names[-1] if names else f'program-{index}'
        variants = []
        for marker in VARIANT.finditer(body):
            values = tuple(sorted(set(part.strip() for part in (marker[1] or '').split('+') if part.strip())))
            if any(not KEYWORD.fullmatch(value) for value in values):
                raise ValueError(f'Program {index} has an invalid variant marker: {marker[0].strip()}')
            if values not in variants:
                variants.append(values)
        origin = 'emitted_variant_markers'
        if not variants and explicit_keywords is not None:
            variants = list(dict.fromkeys(explicit_keywords))
            origin = 'explicit_keywords'
        if not variants:
            if re.search(r'^\s*#\s*pragma\s+(?:multi_compile\w*|shader_feature\w*)\b', body, re.M):
                origin = 'unavailable'
            else:
                variants = [()]
                origin = 'single_program_without_variant_pragmas'
        unsupported = re.findall(r'^\s*#\s*pragma\s+(geometry|hull|domain|surface)\b', body, re.M)
        plans.append({'index': index, 'pass': pass_name, 'variants': variants,
                      'variant_source': origin, 'unsupported_stages': sorted(set(unsupported))})
    return plans


def diagnostic(value):
    level = value['lvl']
    return {'severity': 'error' if level >= 2 else 'warning' if level == 1 else 'info',
            'level': level, 'platform': value['plat'], 'line': value['line'],
            'file': value.get('file', ''), 'message': value['msg']}


def valid_dxbc(blob, stage):
    start = blob.find(b'DXBC')
    if start < 0 or start + 32 > len(blob):
        return False, 'missing or truncated DXBC header'
    size, count = struct.unpack_from('<II', blob, start + 24)
    if size < 32 or start + size > len(blob) or count == 0 or 32 + 4 * count > size:
        return False, 'invalid DXBC container size or chunk table'
    executable = False
    for index in range(count):
        offset = struct.unpack_from('<I', blob, start + 32 + index * 4)[0]
        if offset < 32 + 4 * count or offset + 8 > size:
            return False, 'invalid DXBC chunk offset'
        length = struct.unpack_from('<I', blob, start + offset + 4)[0]
        if offset + 8 + length > size:
            return False, 'truncated DXBC chunk'
        if blob[start + offset:start + offset + 4] in (b'SHDR', b'SHEX'):
            if length < 12 or length % 4:
                return False, 'empty DXBC shader program'
            token, tokens = struct.unpack_from('<II', blob, start + offset + 8)
            if tokens * 4 != length:
                return False, 'invalid DXBC instruction stream length'
            if token >> 16 != (1 if stage == 'vertex' else 0):
                return False, 'DXBC shader stage does not match the requested stage'
            executable = True
    return (True, None) if executable else (False, 'DXBC has no shader instruction chunk')


def valid_output(blob, stage, platform):
    if not blob:
        return False, 'compiler returned an empty program'
    if platform == 4:
        return valid_dxbc(blob, stage)
    try:
        text = blob.decode('utf-8')
    except UnicodeDecodeError:
        return False, 'compiler returned non-text GLSL'
    code = re.sub(r'//[^\n]*|/\*.*?\*/', '', text, flags=re.S)
    branches = all(re.search(r'^\s*#\s*if(?:def)?\b[^\n]*\b' + stage + r'\b', code, re.M) for stage in ('VERTEX', 'FRAGMENT'))
    if not branches or len(re.findall(r'\bvoid\s+main\s*\(', code)) < 2:
        return False, 'GLSL does not contain both vertex and fragment programs'
    return True, None


class DeadlineReader(usc.Reader):
    def begin(self, timeout):
        self.deadline = time.monotonic() + timeout

    def read(self, label='', timeout=20.0):
        remaining = self.deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError(f'UnityShaderCompiler command timed out at {label}')
        return super().read(label, min(timeout, remaining))


class CompilerSession:
    def __init__(self, data, logfile, timeout):
        self.data = data
        self.logfile = logfile
        self.timeout = timeout
        self.server = None
        self.connection = None
        self.process = None
        self.client = None

    def __enter__(self):
        try:
            self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server.bind(('127.0.0.1', 0))
            self.server.listen(1)
            self.server.settimeout(self.timeout)
            self.process = subprocess.Popen(
                [str(self.data / 'Tools/UnityShaderCompiler.exe'), str(self.data),
                 str(self.logfile), str(self.server.getsockname()[1])],
                cwd=usc.SCRIPT_DIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
            self.connection, _ = self.server.accept()
            self.client = usc.Client(self.connection)
            self.client.r = DeadlineReader(self.connection)
            self.client.r.begin(self.timeout)
            self.client.r.read('hello')
            return self
        except Exception:
            self.close(False)
            raise

    def begin(self):
        self.client.r.begin(self.timeout)
        return self.client

    def close(self, graceful):
        if self.connection is not None:
            if graceful:
                try:
                    self.connection.settimeout(1)
                    self.client.send(usc.pack_cmd('shutdown'))
                except OSError:
                    pass
            self.connection.close()
        if self.server is not None:
            self.server.close()
        if self.process is not None:
            try:
                self.process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait(timeout=3)

    def __exit__(self, error_type, error, traceback):
        self.close(error_type is None)


def validate_file(path, data, platform, output, timeout, keywords):
    identity = hashlib.sha256(str(path).encode('utf-8')).hexdigest()[:16]
    logfile = output / 'compiler-logs' / f'{identity}.log'
    logfile.parent.mkdir(parents=True, exist_ok=True)
    result = {'path': str(path), 'status': 'not_run', 'compiler_log': str(logfile),
              'diagnostics': [], 'programs': []}
    try:
        source = path.read_text(encoding='utf-8-sig')
        plans = program_plans(source, keywords)
        if not plans:
            result['reason'] = 'shader contains no CGPROGRAM or HLSLPROGRAM blocks'
            return result
        if re.search(r'/\*\s*TODO\s*\[', source):
            result['status'] = 'failed'
            result['reason'] = 'source contains untranslated instruction markers'
            return result
        for plan in plans:
            program = {key: value for key, value in plan.items() if key != 'variants'}
            program['status'] = 'not_run'
            program['variants'] = [{'keywords': list(variant), 'stages': []} for variant in plan['variants']]
            result['programs'].append(program)
        with CompilerSession(data, logfile, timeout) as session:
            snippets, messages, ok, _ = session.begin().preprocess(source, str(data / 'Resources/CGIncludes'), platform)
            result['diagnostics'] = [diagnostic(message) for message in messages]
            if not ok or any(message['severity'] == 'error' for message in result['diagnostics']):
                result.update(status='failed', reason='Unity shader preprocessing failed')
                return result
            if len(snippets) != len(plans):
                result.update(status='failed', reason=f'Program/snippet count mismatch: {len(plans)} source programs, {len(snippets)} compiler snippets')
                return result
            for plan, program, snippet in zip(plans, result['programs'], snippets):
                program['snippet_id'] = snippet['id']
                program['requirements'] = snippet['requirements']
                program['keyword_requirements'] = snippet['keyword_requirements']
                program['requirement_source'] = 'UnityShaderCompiler.preprocess'
                if plan['unsupported_stages']:
                    program['reason'] = 'stage validation not implemented: ' + ', '.join(plan['unsupported_stages'])
                    continue
                if not plan['variants']:
                    program['reason'] = 'compiled keyword sets unavailable; use emitted variant markers or explicit --keywords'
                    continue
                for variant in program['variants']:
                    variant['requirements'] = usc.requirements_for(snippet, variant['keywords'])
                    stages = [(0, 'vertex'), (1, 'fragment')] if platform == 4 else [(0, 'vertex+fragment')]
                    for function, stage in stages:
                        client = session.begin()
                        success, blob, _, bindings = client.compile_snippet(
                            snippet['text'], str(data / 'Resources/CGIncludes'), function, variant['keywords'], platform,
                            variant['requirements'])
                        diagnostics = [diagnostic(message) for message in client.last_compile_diagnostics]
                        valid, reason = valid_output(blob, stage, platform)
                        success = success and valid and not any(message['severity'] == 'error' for message in diagnostics)
                        entry = {'stage': stage, 'status': 'passed' if success else 'failed',
                                 'bytes': len(blob), 'binding_lines': len(bindings), 'diagnostics': diagnostics}
                        if success:
                            entry['sha256'] = hashlib.sha256(blob).hexdigest()
                        else:
                            entry['reason'] = reason or 'Unity compiler rejected the program'
                            print(f"FAIL {path} pass={program['pass']} stage={stage} keywords={variant['keywords']}: "
                                  + next((message['message'] for message in diagnostics if message['severity'] == 'error'), entry['reason']), file=sys.stderr)
                        variant['stages'].append(entry)
                entries = [stage for variant in program['variants'] for stage in variant['stages']]
                program['status'] = 'passed' if entries and all(entry['status'] == 'passed' for entry in entries) else 'failed'
        result['status'] = 'passed' if all(program['status'] == 'passed' for program in result['programs']) else 'failed' if any(program['status'] == 'failed' for program in result['programs']) else 'not_run'
    except Exception as error:
        result.update(status='failed', reason=f'{type(error).__name__}: {error}')
        print(f'FAIL {path}: {result["reason"]}', file=sys.stderr)
    return result


def collect_inputs(inputs):
    paths = set()
    for value in inputs:
        path = Path(value).resolve()
        if path.is_dir():
            paths.update(candidate.resolve() for candidate in path.rglob('*.shader') if candidate.is_file())
        elif path.is_file():
            paths.add(path)
        else:
            raise FileNotFoundError(f'Input does not exist: {path}')
    return sorted(paths, key=lambda path: str(path).casefold())


def summarize(files):
    stages = [stage for file in files for program in file['programs'] for variant in program['variants'] for stage in variant['stages']]
    return {'shaders': len(files), 'shader_passed': sum(file['status'] == 'passed' for file in files),
            'shader_failed': sum(file['status'] == 'failed' for file in files),
            'shader_not_run': sum(file['status'] == 'not_run' for file in files),
            'stage_attempts': len(stages), 'stage_passed': sum(stage['status'] == 'passed' for stage in stages),
            'stage_failed': sum(stage['status'] == 'failed' for stage in stages),
            'program_not_run': sum(program['status'] == 'not_run' for file in files for program in file['programs'])}


def main(argv=None):
    parser = argparse.ArgumentParser(description='Compile each emitted ShaderRipper keyword variant with the selected UnityShaderCompiler')
    parser.add_argument('inputs', nargs='+', help='Shader files or directories searched recursively')
    parser.add_argument('-u', '--unity', required=True, type=Path, help='Exact Unity installation directory or its Editor/Data directory')
    parser.add_argument('-p', '--platform', choices=PLATFORMS, default='d3d11')
    parser.add_argument('--report', required=True, type=Path)
    parser.add_argument('--workers', type=int, default=1)
    parser.add_argument('--timeout', type=float, default=30, help='Startup or per-command timeout in seconds')
    parser.add_argument('--keywords', action='append', help='Explicit keyword set for unmarked programs; use base or A+B; repeat for several sets')
    args = parser.parse_args(argv)
    report = {'schema_version': 1, 'status': 'failed', 'scope': 'UnityShaderCompiler compilation only; material binding coverage and visual equivalence are not validated', 'files': []}
    args.report = args.report.resolve()
    try:
        if args.workers < 1 or args.timeout <= 0:
            raise ValueError('--workers and --timeout must be positive')
        data = args.unity.resolve()
        if (data / 'Editor/Data').is_dir():
            data = data / 'Editor/Data'
        compiler = data / 'Tools/UnityShaderCompiler.exe'
        if not compiler.is_file() or not (data / 'Resources/CGIncludes').is_dir():
            raise FileNotFoundError(f'Exact Unity compiler or CGIncludes directory unavailable: {data}')
        paths = collect_inputs(args.inputs)
        if not paths:
            raise ValueError('Inputs contain no shader files')
        keywords = None
        if args.keywords is not None:
            keywords = []
            for value in args.keywords:
                parts = () if value == 'base' else tuple(sorted(set(value.split('+'))))
                if any(not KEYWORD.fullmatch(part) for part in parts):
                    raise ValueError(f'Invalid --keywords value: {value}')
                keywords.append(parts)
        report['compiler'] = {'path': str(compiler), 'sha256': hashlib.sha256(compiler.read_bytes()).hexdigest(), 'platform': args.platform}
        usc.log = lambda message: print(message, file=sys.stderr, flush=True)
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
            report['files'] = list(executor.map(lambda path: validate_file(path, data, PLATFORMS[args.platform], args.report.parent, args.timeout, keywords), paths))
        report['summary'] = summarize(report['files'])
        report['status'] = 'passed' if all(file['status'] == 'passed' for file in report['files']) else 'failed'
        exit_code = 0 if report['status'] == 'passed' else 1
    except Exception as error:
        report['error'] = f'{type(error).__name__}: {error}'
        print(report['error'], file=sys.stderr)
        exit_code = 2
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'status': report['status'], 'summary': report.get('summary'), 'report': str(args.report)}, ensure_ascii=False))
    return exit_code


if __name__ == '__main__':
    raise SystemExit(main())
