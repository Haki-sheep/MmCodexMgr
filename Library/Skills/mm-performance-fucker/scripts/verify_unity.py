"""Run native smoke checks in a new isolated project; never open a business project."""
import argparse
import json
import subprocess
import sys
import os
import tempfile
import uuid
from pathlib import Path

from perf import emit


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--unity", required=True)
    parser.add_argument("--fuc", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--profile", choices=("capture", "full"), default="capture")
    parser.add_argument("--build-player", action="store_true")
    args = parser.parse_args()
    args.unity = str(Path(args.unity).resolve(strict=True))
    root = Path(__file__).resolve().parent
    output = Path(args.output).resolve()
    if not output.is_relative_to(Path(tempfile.gettempdir()).resolve()):
        raise ValueError("隔离验证输出必须在系统 TEMP 内 任务结束前清理")
    output.mkdir(parents=True, exist_ok=True)
    project = output / ("fixture-" + uuid.uuid4().hex)
    (project / "Assets").mkdir(parents=True)
    (project / "ProjectSettings").mkdir()
    (project / "Packages").mkdir()
    # This text version marker only identifies the fixture; Unity writes its own project settings.
    (project / "ProjectSettings/ProjectVersion.txt").write_text("m_EditorVersion: 2022.3.62f3\n", encoding="utf-8")
    (project / "Packages/manifest.json").write_text('{"dependencies":{}}\n', encoding="utf-8")
    installed = subprocess.run([sys.executable, "-X", "utf8", str(root / "install.py"), "--project", str(project), "--fuc", args.fuc, "--apply", "--profile", args.profile], check=False, env={**os.environ, "PYTHONDONTWRITEBYTECODE":"1"})
    if installed.returncode:
        raise RuntimeError(f"隔离工程安装失败 {project}")
    editor = project / "Assets/Editor"
    editor.mkdir()
    (editor / "MmPerformanceValidation.cs").write_text((root / "native_validation.cs.txt").read_text(encoding="utf-8"), encoding="utf-8")
    (project / "Assets/MmPerformanceRuntimeValidation.cs").write_text((root / "runtime_validation.cs.txt").read_text(encoding="utf-8"), encoding="utf-8")
    log = project / "native-validation.log"
    print(f"Isolated fixture: {project}", flush=True)
    completed = subprocess.run([args.unity, "-batchmode", "-nographics", "-projectPath", str(project),
                                "-executeMethod", "MmPerformanceValidation.Run", "-logFile", str(log)], timeout=240)
    result = project / "Validation/native-validation.json"
    if completed.returncode or not result.exists():
        raise RuntimeError(f"Unity 验证失败 exit={completed.returncode} log={log}")
    validation = json.loads(result.read_text(encoding="utf-8-sig"))
    if validation.get("success") is not True:
        raise RuntimeError(f"Unity 验证拒绝 {validation} log={log}")
    player_result = None
    if args.build_player:
        build_log = project / "player-build.log"
        build = subprocess.run([args.unity, "-batchmode", "-nographics", "-projectPath", str(project),
                                "-executeMethod", "MmPerformanceValidation.BuildPlayer", "-quit", "-logFile", str(build_log)], timeout=300)
        player = project / "Validation/Player/MmPerformanceValidation.exe"
        if build.returncode or not player.exists():
            raise RuntimeError(f"Player 构建失败 exit={build.returncode} log={build_log}")
        player_result = project / "Validation/player-capture.json"
        run = subprocess.run([str(player), "-batchmode", "-nographics", "-mmperf-output", str(player_result),
                              "-logFile", str(project / "player.log")], timeout=60)
        if run.returncode or not player_result.exists():
            raise RuntimeError(f"Player 验证失败 exit={run.returncode} log={project / 'player.log'}")
        from report_analysis import analyze, load
        analyzed = analyze(load(player_result))
        if analyzed["job"]["state"] != "completed" or analyzed["kind"] != "player_late_update" or analyzed["samples"] == 0:
            raise RuntimeError(f"Player 结果不完整 {player_result}")
        player_result = {"samples":analyzed["samples"], "source":analyzed["kind"], "path":str(player_result)}
    emit({"fixture": str(project), "log": str(log), "result": validation, "player":player_result})


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, subprocess.TimeoutExpired) as exception:
        emit({"success": False, "error": str(exception)})
        sys.exit(1)
