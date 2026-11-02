"""Run native smoke checks in a new isolated project; never open a business project."""
import argparse
import json
import subprocess
import sys
import uuid
from pathlib import Path

from perf import emit


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--unity", required=True)
    parser.add_argument("--fuc", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    project = output / ("fixture-" + uuid.uuid4().hex)
    (project / "Assets").mkdir(parents=True)
    (project / "ProjectSettings").mkdir()
    (project / "Packages").mkdir()
    # This text version marker only identifies the fixture; Unity writes its own project settings.
    (project / "ProjectSettings/ProjectVersion.txt").write_text("m_EditorVersion: 2022.3.62f3\n", encoding="utf-8")
    (project / "Packages/manifest.json").write_text('{"dependencies":{}}\n', encoding="utf-8")
    installed = subprocess.run([sys.executable, "-X", "utf8", str(root / "install.py"), "--project", str(project), "--fuc", args.fuc, "--apply"], check=False)
    if installed.returncode:
        raise RuntimeError(f"隔离工程安装失败 {project}")
    editor = project / "Assets/Editor"
    editor.mkdir()
    (editor / "MmPerformanceValidation.cs").write_text((root / "native_validation.cs.txt").read_text(encoding="utf-8"), encoding="utf-8")
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
    emit({"fixture": str(project), "log": str(log), "result": validation})


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, subprocess.TimeoutExpired) as exception:
        emit({"success": False, "error": str(exception)})
        sys.exit(1)
