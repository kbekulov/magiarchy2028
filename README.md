# Magiarchy Archive

Magiarchy is a Bootstrap-based archive site for a hidden-world story project.
This repo adapts source material from `github.com/kbekulov/magiarchy` into a
manifest-driven reading structure built around dossiers, crisis files, world
doctrine, chapter scaffolds, and writer-facing notes.

## Site structure

- `index.html`:
  project home and archive entry points
- `narrative.html`:
  story universe, hidden ontology, and thematic questions
- `characters.html`:
  character dossiers rendered from Markdown
- `cases.html`:
  crisis files and linked archive materials
- `music.html`:
  listening room for placeholder themes and future uploads
- `library.html`:
  full archive browser with metadata filters
- `world.html`:
  world doctrine, magistry rules, locations, and organizations
- `timeline.html`:
  chapter and crisis chronology
- `notes.html`:
  canon packs and writer-facing notes
- `reader.html`:
  dedicated reader for individual archive entries

## Frontend stack

- Bootstrap `5.3.8` via CDN
- custom archive styling in `styles.css`
- shared navigation shell in `shell.js`
- shared archive helpers in `archive-core.js`
- page-specific scripts for home, cast, cases, music, world, timeline, notes, archive, and reader views

## Content model

Markdown lives under `content/` and is indexed by
`scripts/build_library_manifest.py`.

Active folders:

- `content/chapters`
- `content/cases`
- `content/dossiers`
- `content/world`
- `content/notes`
- `content/themes`
- `content/music-library.json`

Minimal supported frontmatter schema:

```md
---
title: Event File - Fionn's Assassination
type: case
facet: power
section: cases
order: 1
chronology: 35
status: active
canon: core
case: Fionn Assassination
characters: Lynleit | Helena | Kyrien
tags: succession | accusation | exile
summary: Short archive summary.
template: dossier
featured: true
---
```

Recommended fields:

- `title`
- `type`
  `chapter`, `scene`, `play`, `case`, `dossier`, `world`, `note`, `theme`
- `facet`
  `story`, `power`, `world`, `meta`
- `section`
  `archive`, `cases`, `cast`, `world`, `notes`, `about`
- `order`
- `chronology`
- `status`
- `canon`
- `case`
- `characters`
- `tags`
- `summary`
- `template`
  `literary`, `dossier`, `profile`, `reference`, `notebook`, `essay`
- `featured`

Optional entry-specific fields such as `sigil`, `role`, `affiliation`, `archetype`,
`case_code`, `priority`, `location`, or `category` are passed into the manifest
and can be used by page templates.

## Music library

Track metadata lives in `content/music-library.json`.

Supported track fields:

- `id`
- `title`
- `youtube`
- `facet`
- `collection`
- `mood`
- `reading`
- `summary`
- `note`
- `order`

The music page uses one featured player and quieter shelf cards instead of embedding
every video at once.

## Update the archive

Whenever content changes, rebuild the manifest:

```bash
python3 scripts/build_library_manifest.py
```

Before editing an existing chapter into a new draft version, archive the current
Markdown file first:

```bash
python3 scripts/archive_chapter_version.py content/chapters/chapter-01-a-visitor.md
```

Archived chapter snapshots live in `content/chapters/old versions/` with a
datetime suffix, for example `chapter-01-a-visitor__2026-04-13_14-30-00.md`.
The active chapter files remain directly inside `content/chapters/`.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.
