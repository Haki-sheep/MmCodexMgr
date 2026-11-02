"""Preview or deploy bundled Assets and project Provider; never overwrite an existing file."""
import argparse
import hashlib
import json
import os
import shutil
import sys
import uuid
from pathlib import Path

from perf import emit, invoke

SKILL_ROOT = Path(__file__).resolve().parents[1]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def reject_links(path, stop):
    # Junctions and symlinks must not redirect deployment outside the chosen project.
    while path != stop.parent:
        if path.exists() and (path.is_symlink() or (hasattr(path, "is_junction") and path.is_junction()) or
                              getattr(path.lstat(), "st_file_attributes", 0) & 0x400):
            raise ValueError(f"部署路径含链接或重解析点 {path}")
        if path == stop:
            return
        path = path.parent
    raise ValueError("部署目标超出指定工程")


def deployment_plan(project):
    if not (project / "Assets").is_dir() or not (project / "ProjectSettings/ProjectVersion.txt").is_file():
        raise ValueError("--project 必须为 Unity 工程根目录")
    provenance = json.loads((SKILL_ROOT / "assets/payload-manifest.json").read_text(encoding="utf-8"))
    roots = [
        (SKILL_ROOT / "assets/unity/PerfAgent", project / "Assets/PerfAgent"),
        (SKILL_ROOT / "assets/unity/MmPerformance", project / "Assets/MmPerformance"),
        (SKILL_ROOT / "assets/plugin", project / "Tools/FakeUnityCLI/plugins/mm-performance"),
    ]
    packages = project / "Packages/manifest.json"
    if packages.exists() and "com.night.perfagent" in json.loads(packages.read_text(encoding="utf-8-sig")).get("dependencies", {}):
        raise ValueError("工程已通过 UPM 安装 PerfAgent 请先核对版本与重复程序集 不自动再部署 Assets 副本")
    for directory in (project / "Assets", project / "Packages"):
        if directory.exists():
            for assembly in directory.rglob("PerfAgent.Editor.asmdef"):
                if assembly != project / "Assets/PerfAgent/Editor/PerfAgent.Editor.asmdef":
                    raise ValueError(f"已有另一份 PerfAgent 程序集 {assembly}")
    plan = []
    for source, destination in roots:
        reject_links(destination, project)
        files = sorted(path for path in source.rglob("*") if path.is_file())
        for path in files:
            relative = path.relative_to(SKILL_ROOT / "assets").as_posix()
            if digest(path) != provenance["files"][relative]:
                raise ValueError(f"随包文件 hash 与 manifest 不一致 {relative}")
        state = "missing"
        if destination.exists():
            if not destination.is_dir():
                raise ValueError(f"目标不是目录 {destination}")
            for path in files:
                target = destination / path.relative_to(source)
                reject_links(target, project)
                if not target.is_file() or digest(target) != digest(path):
                    raise ValueError(f"已有文件缺失或与本包冲突 不自动覆盖 {target}")
            expected = {path.relative_to(source) for path in files}
            extra = [path.relative_to(destination) for path in destination.rglob("*") if path.is_file()
                     and path.suffix != ".meta" and path.relative_to(destination) not in expected]
            if extra:
                raise ValueError(f"已有部署包含额外文件 不自动更新 {destination}: {extra}")
            state = "identical"
        plan.append({"source": str(source), "destination": str(destination), "state": state, "files": len(files)})
    return plan


def main():
    parser = argparse.ArgumentParser(description="安装预览 默认不写目标工程")
    parser.add_argument("--project", required=True)
    parser.add_argument("--fuc", help="--apply 时必须指定工程实际 CLI exe 或 DLL")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    project = Path(os.path.abspath(args.project))
    plan = deployment_plan(project)
    if not args.apply:
        emit({"dry_run": True, "plan": plan})
        return
    if not args.fuc:
        raise ValueError("部署需要 --fuc 完成 edit-required 准备检查")
    missing = [item for item in plan if item["state"] == "missing"]
    if not missing:
        emit({"changed": False, "plan": plan})
        return
    check = invoke(args.fuc, ["editor", "operation-prepare", "edit-required", "--project", str(project), "--json"])
    if check.get("data", {}).get("allowed") is not True:
        raise RuntimeError(f"部署准备没有明确放行 {check}")
    stage = project / "Temp/MmPerformance" / uuid.uuid4().hex
    reject_links(stage, project)
    stage.mkdir(parents=True)
    for index, item in enumerate(missing):
        shutil.copytree(item["source"], stage / str(index))
    # Recheck after staging; this is a policy check, not an exclusive cross-process lease.
    check = invoke(args.fuc, ["editor", "operation-prepare", "edit-required", "--project", str(project), "--json"])
    if check.get("data", {}).get("allowed") is not True:
        raise RuntimeError(f"发布前检查没有明确放行 staged={stage} {check}")
    published = []
    try:
        for index, item in enumerate(missing):
            destination = Path(item["destination"])
            reject_links(destination, project)
            if destination.exists():
                raise FileExistsError(f"发布时目标已出现 staged={stage} {destination}")
            destination.parent.mkdir(parents=True, exist_ok=True)
            os.rename(stage / str(index), destination)
            published.append(str(destination))
        deployment_plan(project)
    except Exception as exception:
        raise RuntimeError(f"部署未完整完成 已发布={published} staging={stage} 原因={exception}") from exception
    stage.rmdir()
    emit({"changed": True, "published": published, "verification": "文件 hash 完整 Unity 编译尚未验证",
          "next": "通过 FakeUnityCLI refresh/编译证据和 provider-describe 验证 不把文件部署视为 Unity 编译成功"})


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, RuntimeError) as exception:
        emit({"success": False, "error": str(exception)})
        sys.exit(1)
