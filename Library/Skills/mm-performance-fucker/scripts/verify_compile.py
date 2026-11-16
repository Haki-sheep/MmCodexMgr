"""Compile each assembly against an installed Editor SDK This is not an Editor import or runtime test."""
import argparse
import json
import subprocess
import tempfile
from pathlib import Path


def compile_sdk(editor):
    editor = Path(editor).resolve(strict=True)
    data = editor / "Data"
    root = Path(__file__).resolve().parents[1]
    compiler = data / "DotNetSdkRoslyn/csc.dll"
    runtime = data / "NetCoreRuntime/dotnet.exe"
    engine = sorted((data / "Managed/UnityEngine").glob("UnityEngine.*.dll"))
    editor_refs = sorted((data / "Managed/UnityEngine").glob("UnityEditor.*.dll")) + sorted((data / "Managed").glob("UnityEditor.*.dll"))
    standard = sorted((data / "NetStandard/ref/2.1.0").glob("*.dll"))
    if not compiler.is_file() or not runtime.is_file() or not engine or not editor_refs or not standard:
        raise ValueError(f"Editor SDK 布局不受支持 {editor}")
    results = []
    with tempfile.TemporaryDirectory(prefix="MmPerformance-compile-") as temporary:
        output = Path(temporary)

        def build(name, sources, references, defines=""):
            target = output / (name + ".dll")
            response = output / (name + ".rsp")
            tokens = ["-nologo", "-target:library", "-nostdlib+", "-langversion:9", f'-out:"{target}"']
            if defines:
                tokens.append("-define:" + defines)
            tokens.extend(f'-r:"{item}"' for item in standard + references)
            tokens.extend(f'"{item}"' for item in sources)
            response.write_text("\n".join(tokens), encoding="utf-8")
            process = subprocess.run([str(runtime), str(compiler), "@" + str(response)], capture_output=True, encoding="utf-8-sig")
            results.append({"assembly":name, "exit_code":process.returncode, "diagnostics":process.stdout + process.stderr})
            if process.returncode:
                raise RuntimeError(json.dumps(results, ensure_ascii=False))
            return target

        runtime_dll = build("MmPerformance.Runtime", sorted((root / "assets/unity/MmPerformance/Runtime").glob("*.cs")), engine)
        editor_dll = build("MmPerformance.Editor", sorted((root / "assets/unity/MmPerformance/Editor").glob("*.cs")), engine + editor_refs + [runtime_dll])
        upstream = build("PerfAgent.Editor", sorted((root / "assets/unity/PerfAgent/Editor").rglob("*.cs")), engine + editor_refs,
                         "UNITY_EDITOR;UNITY_2022_3_OR_NEWER;UNITY_2021_3_OR_NEWER")
        build("MmPerformanceAudit.Editor", sorted((root / "assets/unity/MmPerformanceAudit/Editor").glob("*.cs")), engine + editor_refs + [runtime_dll, editor_dll, upstream])
        fixture = build("Assembly-CSharp", [root / "scripts/runtime_validation.cs.txt"], engine + [runtime_dll])
        build("Assembly-CSharp-Editor", [root / "scripts/native_validation.cs.txt"], engine + editor_refs + [runtime_dll, editor_dll, fixture])
    return {"scope":"managed SDK compilation only not Unity import or Player execution", "editor":str(editor), "assemblies":results}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--editor", required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(compile_sdk(args.editor), ensure_ascii=False, indent=2))
    except (OSError, ValueError, RuntimeError) as error:
        print(json.dumps({"success":False,"error":str(error)},ensure_ascii=False))
        raise SystemExit(1)
