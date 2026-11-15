import argparse
import hashlib
import io
import json
from pathlib import Path
import posixpath
import re
from urllib.parse import unquote, urlsplit
from xml.etree import ElementTree
from zipfile import ZipFile

from PIL import Image


def digest(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()


def inspect_source(source, output):
    output.mkdir(parents=True, exist_ok=True)
    result = {"source": str(source), "sha256": digest(source), "text": "", "images": [], "warnings": []}

    def add_image(file, label):
        with Image.open(file) as image:
            image.load()
            extension = {"PNG": ".png", "JPEG": ".jpg", "WEBP": ".webp", "GIF": ".png"}.get(image.format)
            if not extension:
                raise ValueError(f"不支持的图片格式 {label} {image.format}")
            if image.format == "GIF":
                destination = output / f"image-{len(result['images']) + 1}.png"
                image.convert("RGBA").save(destination)
                result["warnings"].append(f"{label} 为GIF 仅使用首帧")
            else:
                destination = output / f"image-{len(result['images']) + 1}{extension}"
                destination.write_bytes(file.read_bytes())
            result["images"].append({"file": str(destination), "label": label, "width": image.width,
                                     "height": image.height, "sha256": digest(destination)})

    suffix = source.suffix.lower()
    if suffix in (".docx",):
        with ZipFile(source) as archive:
            ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                  "a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
            document = ElementTree.fromstring(archive.read("word/document.xml"))
            result["text"] = "\n".join("".join(t.text or "" for t in p.findall(".//w:t", ns)) for p in document.findall(".//w:p", ns))
            # 按正文关系定位图片 避免把包内未使用素材当成定图
            relations = ElementTree.fromstring(archive.read("word/_rels/document.xml.rels"))
            targets = {item.attrib["Id"]: item.attrib["Target"] for item in relations if item.attrib.get("TargetMode") != "External"}
            for index, blip in enumerate(document.findall(".//a:blip", ns)):
                relation = blip.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed")
                target = targets.get(relation)
                if not target:
                    continue
                member = target.lstrip("/") if target.startswith("/") else posixpath.normpath("word/" + target)
                with Image.open(io.BytesIO(archive.read(member))) as image:
                    image.load()
                    destination = output / f"image-{index + 1}.png"
                    image.save(destination, "PNG")
                    result["images"].append({"file": str(destination), "label": target, "width": image.width,
                                             "height": image.height, "sha256": digest(destination)})
    elif suffix == ".pdf":
        from pypdf import PdfReader
        document = PdfReader(source)
        for page_index, page in enumerate(document.pages):
            result["text"] += f"\n[第{page_index + 1}页]\n{page.extract_text() or ''}"
            for image_index, item in enumerate(page.images):
                image = item.image
                destination = output / f"page-{page_index + 1}-image-{image_index + 1}.png"
                image.save(destination, "PNG")
                result["images"].append({"file": str(destination), "label": f"第{page_index + 1}页 {item.name}",
                                         "width": image.width, "height": image.height, "sha256": digest(destination)})
        result["warnings"].append("PDF仅提取正文和嵌入位图 未把矢量页面渲染成定图 扫描文字未做OCR")
    elif suffix in (".md", ".markdown", ".txt"):
        result["text"] = source.read_text(encoding="utf-8-sig")
        if suffix != ".txt":
            for match in re.finditer(r'!\[([^\]]*)\]\(\s*(?:<([^>]+)>|([^\s)]+)(?:\s+"[^"]*")?)\s*\)', result["text"]):
                target = unquote(match.group(2) or match.group(3))
                if re.match(r"^https?://", target, re.I):
                    result["warnings"].append(f"远程图片未下载 {target}")
                    continue
                if urlsplit(target).scheme and not re.match(r"^[a-zA-Z]:[\\/]", target):
                    raise ValueError(f"图片地址须为本机路径 {target}")
                file = (source.parent / target).resolve(strict=True)
                add_image(file, match.group(1) or target)
    else:
        add_image(source, source.name)
    result["text"] = result["text"].strip()
    result["textFile"] = str(output / "text.txt")
    Path(result["textFile"]).write_text(result["text"], encoding="utf-8", newline="\n")
    manifest = output / "source.json"
    manifest.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    print(json.dumps(inspect_source(Path(args.source).resolve(strict=True), Path(args.output).resolve()), ensure_ascii=False))
