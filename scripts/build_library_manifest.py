#!/usr/bin/env python3

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "content"
OUTPUT_FILE = CONTENT_DIR / "library-manifest.json"
SCAN_FOLDERS = {
    "chapter": CONTENT_DIR / "chapters",
    "scene": CONTENT_DIR / "scenes",
    "play": CONTENT_DIR / "plays",
    "case": CONTENT_DIR / "cases",
    "dossier": CONTENT_DIR / "dossiers",
    "world": CONTENT_DIR / "world",
    "note": CONTENT_DIR / "notes",
    "theme": CONTENT_DIR / "themes",
}
KIND_ORDER = {
    "case": 0,
    "dossier": 1,
    "chapter": 2,
    "scene": 3,
    "play": 4,
    "world": 5,
    "theme": 6,
    "note": 7,
}
LIST_KEYS = {"characters", "tags", "related"}
INT_KEYS = {"order", "chronology", "cast_order"}
BOOL_KEYS = {"featured"}
SYSTEM_FIELDS = {
    "title",
    "type",
    "facet",
    "section",
    "status",
    "summary",
    "order",
    "chronology",
    "characters",
    "tags",
    "case",
    "template",
    "featured",
    "canon",
}


def slugify(value):
    cleaned = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return cleaned or "entry"


def parse_front_matter(markdown_text):
    if not markdown_text.startswith("---\n"):
        return {}

    _, _, remainder = markdown_text.partition("\n")
    metadata_block, separator, _ = remainder.partition("\n---\n")
    if not separator:
        return {}

    metadata = {}
    for line in metadata_block.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        metadata[key.strip()] = parse_value(key.strip(), value.strip())

    return metadata


def parse_value(key, value):
    lowered = value.lower()

    if key in BOOL_KEYS:
        return lowered == "true"

    if key in INT_KEYS:
        try:
            return int(value)
        except ValueError:
            return value

    if key in LIST_KEYS:
        return parse_list(value)

    if lowered in {"true", "false"}:
        return lowered == "true"

    if re.fullmatch(r"-?\d+", value):
        return int(value)

    return value


def parse_list(value):
    cleaned = value.strip()

    if cleaned.startswith("[") and cleaned.endswith("]"):
        cleaned = cleaned[1:-1]

    parts = [part.strip().strip('"').strip("'") for part in cleaned.split("|")]
    if len(parts) == 1 and "," in cleaned:
        parts = [part.strip().strip('"').strip("'") for part in cleaned.split(",")]

    return [part for part in parts if part]


def ensure_list(value):
    if isinstance(value, list):
        return value
    if value in {None, ""}:
        return []
    return [str(value)]


def infer_section(entry_type):
    if entry_type in {"chapter", "scene", "play"}:
        return "archive"
    if entry_type == "case":
        return "cases"
    if entry_type == "dossier":
        return "cast"
    if entry_type == "world":
        return "world"
    if entry_type == "note":
        return "notes"
    if entry_type == "theme":
        return "about"
    return "archive"


def infer_template(entry_type):
    if entry_type in {"chapter", "scene", "play"}:
        return "literary"
    if entry_type == "case":
        return "dossier"
    if entry_type == "dossier":
        return "profile"
    if entry_type == "world":
        return "reference"
    if entry_type == "note":
        return "notebook"
    if entry_type == "theme":
        return "essay"
    return "standard"


def build_entry(kind, path):
    raw_text = path.read_text(encoding="utf-8")
    metadata = parse_front_matter(raw_text)
    relative_path = path.relative_to(ROOT).as_posix()
    entry_type = str(metadata.get("type", kind)).lower()
    title = metadata.get("title", path.stem.replace("-", " ").title())
    order = metadata.get("order", 999)
    chronology = metadata.get("chronology", order if isinstance(order, int) else 999)
    characters = ensure_list(metadata.get("characters"))
    tags = ensure_list(metadata.get("tags"))
    case_value = metadata.get("case", "")
    case_slug = slugify(case_value) if case_value else ""

    return {
        "id": f"{entry_type}-{path.stem}",
        "slug": path.stem,
        "title": title,
        "kind": entry_type,
        "type": entry_type,
        "facet": str(metadata.get("facet", "chamber")).lower(),
        "section": str(metadata.get("section", infer_section(entry_type))).lower(),
        "status": str(metadata.get("status", "draft")).lower(),
        "canon": str(metadata.get("canon", "working")).lower(),
        "summary": metadata.get("summary", "No summary provided yet."),
        "order": order if isinstance(order, int) else 999,
        "chronology": chronology if isinstance(chronology, int) else 999,
        "path": relative_path,
        "case": case_slug,
        "case_name": case_value,
        "characters": characters,
        "tags": tags,
        "template": str(metadata.get("template", infer_template(entry_type))).lower(),
        "featured": bool(metadata.get("featured", False)),
        "fields": {
            key: value for key, value in metadata.items() if key not in SYSTEM_FIELDS
        },
    }


def build_collections(entries):
    def collect(key):
        return sorted({entry[key] for entry in entries if entry.get(key)})

    characters = sorted(
        {character for entry in entries for character in entry.get("characters", [])}
    )
    tags = sorted({tag for entry in entries for tag in entry.get("tags", [])})
    cases = sorted({entry["case"] for entry in entries if entry.get("case")})

    return {
        "types": collect("type"),
        "facets": collect("facet"),
        "sections": collect("section"),
        "statuses": collect("status"),
        "characters": characters,
        "tags": tags,
        "cases": cases,
    }


def main():
    entries = []

    for kind, folder in SCAN_FOLDERS.items():
        if not folder.exists():
            continue
        for path in sorted(folder.glob("*.md")):
            entries.append(build_entry(kind, path))

    case_titles = {
        entry["case"]: entry["title"]
        for entry in entries
        if entry["type"] == "case" and entry.get("case")
    }
    for entry in entries:
        if entry.get("case") and entry["case"] in case_titles:
            entry["case_name"] = case_titles[entry["case"]]

    entries.sort(
        key=lambda item: (
            KIND_ORDER.get(item["type"], 99),
            item["chronology"],
            item["title"],
        )
    )
    OUTPUT_FILE.write_text(
        json.dumps({"entries": entries, "collections": build_collections(entries)}, indent=2)
        + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(entries)} entries to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
