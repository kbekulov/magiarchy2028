#!/usr/bin/env python3

import argparse
import shutil
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
CHAPTERS_DIR = ROOT / "content" / "chapters"
ARCHIVE_DIR = CHAPTERS_DIR / "old versions"


def resolve_chapter(path_value):
    chapter_path = Path(path_value)
    if not chapter_path.is_absolute():
        chapter_path = ROOT / chapter_path

    chapter_path = chapter_path.resolve()
    chapters_dir = CHAPTERS_DIR.resolve()
    archive_dir = ARCHIVE_DIR.resolve()

    if not chapter_path.is_file():
        raise SystemExit(f"Chapter file does not exist: {chapter_path}")

    if chapter_path.suffix.lower() != ".md":
        raise SystemExit("Only Markdown chapter files can be archived.")

    if chapter_path.parent != chapters_dir:
        raise SystemExit(
            "Archive only active top-level chapter files in content/chapters/."
        )

    if chapter_path == archive_dir or archive_dir in chapter_path.parents:
        raise SystemExit("Refusing to archive an already archived chapter copy.")

    return chapter_path


def archive_chapter(chapter_path):
    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    destination = ARCHIVE_DIR / f"{chapter_path.stem}__{timestamp}{chapter_path.suffix}"
    counter = 2

    while destination.exists():
        destination = (
            ARCHIVE_DIR
            / f"{chapter_path.stem}__{timestamp}-{counter}{chapter_path.suffix}"
        )
        counter += 1

    shutil.copy2(chapter_path, destination)
    return destination


def main():
    parser = argparse.ArgumentParser(
        description="Archive the current version of a chapter before editing it."
    )
    parser.add_argument("chapter", help="Path to the active chapter Markdown file.")
    args = parser.parse_args()

    chapter_path = resolve_chapter(args.chapter)
    archived_path = archive_chapter(chapter_path)
    print(archived_path.relative_to(ROOT).as_posix())


if __name__ == "__main__":
    main()
