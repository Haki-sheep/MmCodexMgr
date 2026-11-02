"""Standalone Skill entry point; only FakeUnityCLI owns Editor transport."""
import argparse
import json
import subprocess
import sys
import uuid
from pathlib import Path

from report_analysis import analyze, compare, detail, load


def emit(value):
    print(json.dumps(value, ensure_ascii=False, allow_nan=False, indent=2))


def fuc_command(path):
    executable = Path(path).resolve(strict=True)
    if executable.suffix.lower() in (".cmd", ".bat", ".ps1"):
        raise ValueError("--fuc 指向 exe 或 DLL 不执行 shell 启动脚本")
    return ["dotnet", str(executable)] if executable.suffix.lower() == ".dll" else [str(executable)]


def invoke(fuc, tokens):
    # Pass an argv list so project paths and stage labels never become shell code.
    completed = subprocess.run(fuc_command(fuc) + tokens, capture_output=True, encoding="utf-8-sig", errors="replace")
    if completed.returncode:
        raise RuntimeError(f"CLI 退出码 {completed.returncode}\n{completed.stdout}\n{completed.stderr}")
    try:
        result = json.loads(completed.stdout)
    except json.JSONDecodeError as exception:
        raise RuntimeError(f"CLI 未返回 JSON\n{completed.stdout}\n{completed.stderr}") from exception
    return result


def parser():
    root = argparse.ArgumentParser(description="Mm Unity 性能分析 独立 Skill 工具")
    commands = root.add_subparsers(dest="command", required=True)
    for name in ("probe", "audit", "start", "status", "result", "cancel", "mark"):
        command = commands.add_parser(name)
        command.add_argument("--project", required=True)
        command.add_argument("--fuc", required=True)
        command.add_argument("--request-id", default=None)
        command.add_argument("--yes", action="store_true")
        if name in ("status", "result", "cancel", "mark"):
            command.add_argument("--job-id", required=True)
        if name == "audit":
            command.add_argument("--deep", action="store_true")
        if name == "mark":
            command.add_argument("--text", required=True)
        if name == "start":
            command.add_argument("--seconds", type=float, default=30)
            command.add_argument("--warmup", type=float, default=2)
            command.add_argument("--fps", type=int, default=60)
            command.add_argument("--max-frames", type=int, default=300000)
            command.add_argument("--stall-seconds", type=float, default=10)
            command.add_argument("--phase", default="unspecified")
    for name in ("analyze", "detail"):
        command = commands.add_parser(name)
        command.add_argument("report")
        if name == "analyze":
            command.add_argument("--limit", type=int, default=5)
        else:
            command.add_argument("--index", required=True, type=int)
            command.add_argument("--radius", type=int, default=10)
    command = commands.add_parser("diff")
    command.add_argument("baseline")
    command.add_argument("current")
    return root


def main():
    args = parser().parse_args()
    if args.command == "analyze":
        if not 1 <= args.limit <= 50:
            raise ValueError("limit 必须为 1 至 50")
        emit(analyze(load(args.report), args.limit))
        return 0
    if args.command == "detail":
        emit(detail(load(args.report), args.index, args.radius))
        return 0
    if args.command == "diff":
        result = compare(load(args.baseline), load(args.current))
        emit(result)
        return 0 if result["comparable"] else 1
    writes = args.command in ("audit", "start", "cancel", "mark")
    if writes and not args.yes:
        raise ValueError("此操作需要 --yes 现场保护仍由 FakeUnityCLI 检查")
    request_id = uuid.UUID(args.request_id).hex if args.request_id else uuid.uuid4().hex
    # Emit identity before dispatch so a broken transport still leaves a queryable original request.
    print(json.dumps({"request_id": request_id, "expected_job_id": request_id if args.command in ("start", "audit") else args.job_id if hasattr(args, "job_id") else None}, ensure_ascii=False), file=sys.stderr)
    tokens = ["mmperf", args.command, "--project", str(Path(args.project).resolve(strict=True)),
              "--json", "--request-id", request_id]
    if writes:
        tokens.append("--yes")
    extra = {}
    if hasattr(args, "job_id"):
        extra["job_id"] = uuid.UUID(args.job_id).hex
    if args.command == "start":
        extra.update({key: getattr(args, key) for key in ("seconds", "warmup", "fps", "max_frames", "stall_seconds", "phase")})
    if args.command == "audit":
        extra["deep"] = args.deep
    if args.command == "mark":
        extra["text"] = args.text
    if extra:
        tokens.append("--")
        for key, value in extra.items():
            tokens.extend([f"--{key}", str(value).lower() if isinstance(value, bool) else str(value)])
    emit(invoke(args.fuc, tokens))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, KeyError, RuntimeError) as exception:
        emit({"success": False, "error": str(exception)})
        sys.exit(1)
