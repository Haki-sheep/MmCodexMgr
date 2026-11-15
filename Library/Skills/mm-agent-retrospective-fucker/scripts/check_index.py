"""Read-only checks for local skill links and stable problem identifiers."""

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote


LINK = re.compile(r"\[[^\]\n]+\]\(([^)\n]+)\)")
IDENTIFIER = re.compile(r"P\d{3,}(?:-V\d{3,})?")
EXPLICIT_ANCHOR = re.compile(r'<a\s+id=[\'"]([^\'"]+)[\'"]\s*>', re.IGNORECASE)


def anchor_set(text):
    result = set(EXPLICIT_ANCHOR.findall(text))
    for heading in re.findall(r"^#{1,6}\s+(.+?)\s*#*\s*$", text, re.MULTILINE):
        heading = re.sub(r"[^\w\- ]", "", heading.lower()).strip()
        result.add(heading.replace(" ", "-"))
    return result


def local_link(source, raw):
    target = raw.strip().strip("<>")
    if re.match(r"^[A-Za-z]:[/\\]", target) or re.match(r"^[\w+.-]+:", target):
        return None
    name, _, fragment = target.partition("#")
    if name and Path(name).is_absolute():
        return None
    path = (source.parent / unquote(name)).resolve() if name else source.resolve()
    return path, unquote(fragment)


def check(root):
    errors = []
    documents = {}
    for path in sorted(root.rglob("*.md")):
        try:
            documents[path.resolve()] = path.read_text(encoding="utf-8")
        except UnicodeError as error:
            errors.append(f"UTF-8 decoding failed: {path}: {error}")
    index = (root / "references/problem-index.md").resolve()
    diagnostic = (root / "references/diagnostics.md").resolve()
    for required in (root / "SKILL.md", index, diagnostic, root / "references/feedback.md"):
        if required.resolve() not in documents:
            errors.append(f"Missing readable document: {required}")
    if errors:
        return errors, 0

    for source, text in documents.items():
        for raw in LINK.findall(text):
            target = local_link(source, raw)
            if target is None:
                continue
            path, fragment = target
            if not path.is_file():
                errors.append(f"Broken local link: {source.name}: {raw}")
            elif fragment and path in documents and fragment not in anchor_set(documents[path]):
                errors.append(f"Missing anchor: {source.name}: {raw}")

    anchors = EXPLICIT_ANCHOR.findall(documents[diagnostic])
    for anchor in set(anchors):
        if anchors.count(anchor) > 1:
            errors.append(f"Duplicate diagnostic anchor: {anchor}")
    diagnostic_ids = {
        anchor.upper() for anchor in anchors if IDENTIFIER.fullmatch(anchor.upper())
    }
    rows = {}
    for number, line in enumerate(documents[index].splitlines(), 1):
        cells = line.split("|")
        if len(cells) < 3:
            continue
        identifier = cells[1].strip()
        if identifier == "ID" or re.fullmatch(r"[:\-\s]+", identifier):
            continue
        if not IDENTIFIER.fullmatch(identifier):
            errors.append(f"Invalid index ID at line {number}: {identifier}")
            continue
        if identifier in rows:
            errors.append(f"Duplicate index ID: {identifier} at line {number}")
        rows[identifier] = number
        destinations = [local_link(index, target) for target in LINK.findall(line)]
        if (diagnostic, identifier.lower()) not in destinations:
            errors.append(f"Index ID must link to its diagnostic anchor: {identifier}")
        if identifier not in diagnostic_ids:
            errors.append(f"Index ID has no diagnostic entry: {identifier}")

    if not rows:
        errors.append("Problem index contains no problem IDs")
    for identifier in diagnostic_ids:
        if "-V" in identifier:
            parent = identifier.split("-V", 1)[0]
            if parent not in rows:
                errors.append(f"Variant has no indexed parent: {identifier}")
        elif identifier not in rows:
            errors.append(f"Diagnostic entry has no index row: {identifier}")
    return errors, len(rows)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    root = args.root.resolve()
    if not root.is_dir():
        parser.error("skill root must be an existing directory")
    errors, count = check(root)
    print(json.dumps({"passed": not errors, "indexed_problems": count, "errors": errors}, ensure_ascii=False, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
