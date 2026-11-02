import argparse
import glob
import hashlib
import json
import platform
import struct
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


# region FileEvidence

def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def write_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')


def digest(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest() if hasattr(hashlib, 'file_digest') else hashlib.sha256(stream.read()).hexdigest()


def key(path):
    return str(Path(path).resolve()).casefold()


def fingerprints(paths):
    return {str(Path(path).resolve()): digest(path) for path in paths}


def check_fingerprints(values):
    for path, expected in values.items():
        if digest(path) != expected:
            raise ValueError(f'File changed since the recorded operation: {path}')


def package_check():
    manifest = read_json(ROOT / 'runtime/manifest.json')
    if sys.platform != 'win32' or struct.calcsize('P') != 8 or platform.machine().casefold() not in ('amd64', 'x86_64'):
        raise RuntimeError('This package contains only the verified Windows x64 runtime')
    for relative, expected in manifest['files'].items():
        path = (ROOT / relative).resolve()
        if not path.is_relative_to(ROOT):
            raise ValueError(f'Runtime manifest path escapes the Skill: {relative}')
        if digest(path) != expected:
            raise ValueError(f'Packaged file fingerprint mismatch: {relative}')
    return ROOT / manifest['executable']


def expand_inputs(values):
    result = {}
    for value in values:
        hits = glob.glob(value, recursive=True) if glob.has_magic(value) else [value]
        if not hits:
            raise FileNotFoundError(f'Input pattern matched no files: {value}')
        for hit in hits:
            path = Path(hit).resolve()
            if not path.is_file():
                raise FileNotFoundError(f'Input is not a file: {path}')
            result[key(path)] = path
    return list(result.values())


def unity_root(path):
    for parent in Path(path).resolve().parents:
        if (parent / 'Assets').is_dir() and (parent / 'ProjectSettings/ProjectVersion.txt').is_file():
            return parent
    return None


# endregion

# region ExportAndCompile

def export(args):
    executable = package_check()
    inputs = expand_inputs(args.file)
    output = args.out.resolve()
    for path in inputs:
        project = unity_root(path)
        if project and output.is_relative_to(project / 'Assets'):
            raise ValueError('Export output must be outside the source project Assets directory')
    output.mkdir(parents=True, exist_ok=False)
    source_hashes = fingerprints(inputs)
    report = output / 'export-report.json'
    command = [str(executable), '--file', *map(str, inputs), '--out', str(output), '--asm', '--validate', '--platform', args.platform, '--report', str(report)]
    with (output / 'export.log').open('wb') as log:
        process = subprocess.run(command, cwd=output, stdout=log, stderr=subprocess.STDOUT)
    check_fingerprints(source_hashes)
    data = read_json(report)
    generated = [Path(item['output']) for item in data['shaders'] if item.get('output')]
    manifest = {'kind': 'ShaderAssetFucker.export', 'status': 'completed' if process.returncode == 0 else 'failed',
                'exitCode': process.returncode, 'report': str(report), 'reportSha256': digest(report),
                'inputs': source_hashes, 'outputs': fingerprints(generated), 'toolSha256': digest(executable)}
    write_json(output / 'export-manifest.json', manifest)
    print(json.dumps({'status': manifest['status'], 'exported': data['exported'], 'partial': data['partial'], 'failed': data['failed'], 'manifest': str(output / 'export-manifest.json')}, ensure_ascii=False))
    return process.returncode


def validate(args):
    package_check()
    import usc_validate
    paths = usc_validate.collect_inputs(args.input)
    if not paths:
        raise ValueError('Inputs contain no Shader source files')
    before = fingerprints(paths)
    report = args.out.resolve()
    manifest_path = report.with_suffix('.manifest.json')
    if report.exists() or manifest_path.exists():
        raise FileExistsError(f'Validation output already exists: {report}')
    report.parent.mkdir(parents=True, exist_ok=True)
    command = [sys.executable, str(ROOT / 'scripts/usc_validate.py'), '--unity', str(args.unity.resolve()), '--platform', args.platform,
               '--workers', str(args.workers), '--report', str(report), *map(str, paths)]
    with report.with_suffix('.log').open('wb') as log:
        process = subprocess.run(command, cwd=report.parent, stdout=log, stderr=subprocess.STDOUT)
    check_fingerprints(before)
    data = read_json(report)
    manifest = {'kind': 'ShaderAssetFucker.validation', 'status': data['status'] if process.returncode == 0 else 'failed',
                'report': str(report), 'reportSha256': digest(report), 'sources': before}
    write_json(manifest_path, manifest)
    print(json.dumps({'status': manifest['status'], 'summary': data.get('summary'), 'manifest': str(manifest_path)}, ensure_ascii=False))
    return process.returncode


# endregion

# region EditorJobs

def replacement_rows(project, exports, validation_path):
    validation = read_json(validation_path)
    if validation['kind'] != 'ShaderAssetFucker.validation' or validation['status'] != 'passed':
        raise ValueError('Replacement requires a completed successful compilation manifest')
    compilation = read_json(validation['report'])
    if digest(validation['report']) != validation['reportSha256'] or compilation['status'] != 'passed':
        raise ValueError('Compiler report changed or did not pass')
    check_fingerprints(validation['sources'])
    validated = {key(path): sha for path, sha in validation['sources'].items()}
    compiled = {key(item['path']): item['status'] for item in compilation['files']}
    if any(compiled.get(path) != 'passed' for path in validated):
        raise ValueError('Compilation report does not cover every fingerprinted source')
    rows = {}
    for manifest_path in exports:
        manifest = read_json(manifest_path)
        if manifest['kind'] != 'ShaderAssetFucker.export' or manifest['status'] != 'completed' or manifest['exitCode'] != 0:
            raise ValueError('Partial or failed reconstruction cannot replace project assets')
        if digest(manifest['report']) != manifest['reportSha256']:
            raise ValueError('Export report changed')
        check_fingerprints(manifest['inputs'])
        check_fingerprints(manifest['outputs'])
        original = {key(path): sha for path, sha in manifest['inputs'].items()}
        outputs = {key(path): sha for path, sha in manifest['outputs'].items()}
        for item in read_json(manifest['report'])['shaders']:
            if item['status'] != 'exported':
                raise ValueError(f'Replacement includes a non-exported Shader: {item.get("shader")}')
            source = Path(item['source']).resolve()
            restored = Path(item['output']).resolve()
            if not source.is_relative_to(project / 'Assets') or source.suffix.casefold() != '.asset':
                raise ValueError(f'Only original project Shader .asset files can be replaced: {source}')
            if key(source) in rows:
                raise ValueError(f'An asset contains duplicate Shader results: {source}')
            if key(source) not in original or validated.get(key(restored)) != outputs.get(key(restored)) or key(restored) not in outputs:
                raise ValueError(f'Export and compilation fingerprints do not cover the same Shader: {source}')
            relative = source.relative_to(project).as_posix()
            row = [relative, str(Path(relative).with_suffix('.shader')).replace('\\', '/'), str(restored), original[key(source)], outputs[key(restored)], item['shader']]
            if any(any(character in str(value) for character in '\t\r\n') for value in row):
                raise ValueError('Task row fields cannot contain tabs or line breaks')
            rows[key(source)] = row
    if not rows:
        raise ValueError('No project Shader assets were selected')
    return sorted(rows.values(), key=lambda row: row[0].casefold())


def render_editor(phase, job, index=0, compile_only=False):
    template = (ROOT / 'unity' / f'{phase}.cs.txt').read_text(encoding='utf-8')
    replacements = {'__BACKUP__': json.dumps(job['backup'], ensure_ascii=False), '__PROJECT__': json.dumps(job['project'], ensure_ascii=False),
                    '__ROWS_FILE__': json.dumps(job['rowsFile'], ensure_ascii=False), '__INDEX__': str(index), '__CHECK_ONLY__': str(compile_only).lower()}
    for marker, value in replacements.items():
        template = template.replace(marker, value)
    return template


def prepare(args):
    project = args.project.resolve()
    task = args.task.resolve()
    if not (project / 'Assets').is_dir() or not (project / 'ProjectSettings/ProjectVersion.txt').is_file():
        raise ValueError('Expected a Unity project root')
    if not task.is_relative_to(project / 'Temp/FakeUnityCLI'):
        raise ValueError('Editor task files must be inside project Temp/FakeUnityCLI')
    job_path = task / 'job.json'
    if args.phase == 'plan':
        if not args.backup or not args.export_manifest or not args.validation_manifest:
            raise ValueError('Plan requires --backup --export-manifest and --validation-manifest')
        backup = args.backup.resolve()
        if backup.exists() or backup.is_relative_to(project / 'Assets') or backup.is_relative_to(project / 'Packages') or backup.is_relative_to(ROOT):
            raise ValueError('Backup must be a new directory outside project Assets, Packages and this Skill')
        if job_path.exists():
            raise FileExistsError(f'Task already exists: {task}')
        rows = replacement_rows(project, args.export_manifest, args.validation_manifest)
        task.mkdir(parents=True, exist_ok=False)
        rows_path = task / 'inputs.tsv'
        rows_path.write_text('\n'.join('\t'.join(row) for row in rows), encoding='utf-8')
        job = {'project': str(project), 'backup': str(backup), 'rowsFile': str(rows_path), 'count': len(rows)}
        write_json(job_path, job)
    else:
        job = read_json(job_path)
        if key(job['project']) != key(project):
            raise ValueError('Task belongs to another Unity project')
        backup = Path(job['backup']).resolve()
        if backup.is_relative_to(project / 'Assets') or backup.is_relative_to(project / 'Packages') or backup.is_relative_to(ROOT):
            raise ValueError('Task backup path is inside a protected source directory')
        if args.phase == 'apply':
            if not args.allow_replace:
                raise ValueError('Apply requires --allow-replace after user authorization')
            if args.index is None or not 0 <= args.index < job['count']:
                raise ValueError('Apply requires a valid --index')
            if not (Path(job['backup']) / 'plan-result.json').is_file():
                raise ValueError('Editor plan and complete backup have not finished')
    suffix = f'-{args.index}' if args.phase == 'apply' else ''
    if args.compile_only:
        suffix += '-compile-only'
    code_file = task / f'{args.phase}{suffix}.cs.txt'
    if code_file.exists():
        raise FileExistsError(f'Editor job already prepared: {code_file}')
    code_file.write_text(render_editor(args.phase, job, args.index or 0, args.compile_only), encoding='utf-8')
    print(json.dumps({'status': 'prepared_no_editor_mutation', 'phase': args.phase, 'codeFile': str(code_file), 'count': job['count'], 'compileOnly': args.compile_only}, ensure_ascii=False))
    return 0


# endregion

# region Commands

def main():
    parser = argparse.ArgumentParser(description='ShaderAssetFucker packaged workflow')
    sub = parser.add_subparsers(dest='command', required=True)
    doctor = sub.add_parser('doctor')
    doctor.add_argument('--run-tool', action='store_true')
    command = sub.add_parser('export')
    command.add_argument('--file', nargs='+', required=True)
    command.add_argument('--out', type=Path, required=True)
    command.add_argument('--platform', default='d3d11')
    command = sub.add_parser('validate')
    command.add_argument('--input', nargs='+', required=True)
    command.add_argument('--unity', type=Path, required=True)
    command.add_argument('--out', type=Path, required=True)
    command.add_argument('--platform', default='d3d11', choices=['d3d11', 'gles20', 'gles3', 'openglcore'])
    command.add_argument('--workers', type=int, default=1)
    command = sub.add_parser('prepare')
    command.add_argument('--phase', choices=['plan', 'apply', 'verify'], required=True)
    command.add_argument('--project', type=Path, required=True)
    command.add_argument('--task', type=Path, required=True)
    command.add_argument('--backup', type=Path)
    command.add_argument('--export-manifest', type=Path, nargs='+')
    command.add_argument('--validation-manifest', type=Path)
    command.add_argument('--index', type=int)
    command.add_argument('--allow-replace', action='store_true')
    command.add_argument('--compile-only', action='store_true')
    args = parser.parse_args()
    if args.command == 'doctor':
        executable = package_check()
        if args.run_tool:
            subprocess.run([str(executable), '--help'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        print(json.dumps({'status': 'verified', 'executable': str(executable), 'sha256': digest(executable)}))
        return 0
    return {'export': export, 'validate': validate, 'prepare': prepare}[args.command](args)


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (OSError, ValueError, RuntimeError, KeyError, subprocess.CalledProcessError) as error:
        print(json.dumps({'status': 'failed', 'error': f'{type(error).__name__}: {error}'}, ensure_ascii=False), file=sys.stderr)
        raise SystemExit(2)

# endregion
