"""Update payload hashes after deliberately changing bundled sources."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1] / "assets"
path = root / "payload-manifest.json"
manifest = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {
    "schema_version": 1,
    "adapter_version": "0.1.0",
    "upstream": {"repository": "https://github.com/MothCyan/PerfAgent-Unity", "author": "MothCyan",
                 "license": "MIT", "commit": None, "source": "user-provided local source snapshot"},
}
manifest["files"] = {
    item.relative_to(root).as_posix(): hashlib.sha256(item.read_bytes()).hexdigest()
    for directory in (root / "unity", root / "plugin")
    for item in sorted(directory.rglob("*")) if item.is_file()
}
path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Recorded {len(manifest['files'])} payload files")
