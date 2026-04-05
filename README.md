# Divine Chamber Archive

Divine Chamber is a Bootstrap-based personal website/archive for an original story
project with two intertwined facets:

- the chamber: theatrical, symbolic, intimate, witty, psychologically charged
- the bureau: investigative, political, procedural, and city-facing

This repository keeps Markdown as the source of truth for the writing while
presenting it through a multi-page archive structure instead of a generic blog.

## Site structure

- `index.html`:
  Project home and archive entry points
- `narrative.html`:
  About Divine Chamber, its premise, themes, and dual-facet logic
- `characters.html`:
  Chamber cast and bureau presences rendered from Markdown dossiers
- `cases.html`:
  Bureau cases and linked archive materials
- `music.html`:
  Curated listening room for YouTube-hosted project tracks
- `library.html`:
  Full archive browser with metadata filters
- `world.html`:
  Worldbuilding, city, Crown, bureau, and symbolic system files
- `timeline.html`:
  Chronology/progression view across the archive
- `notes.html`:
  Notes, drafts, and development logs
- `reader.html`:
  Dedicated reader for individual archive entries

## Frontend stack

- Bootstrap `5.3.8` via CDN
- custom archive styling in `styles.css`
- shared navigation shell in `shell.js`
- shared archive helpers in `archive-core.js`
- page-specific scripts for home, cast, cases, music, world, timeline, notes, archive, and reader views

## Content model

Markdown files live under `content/` and are indexed by
`scripts/build_library_manifest.py`.

Current content folders:

- `content/chapters`
- `content/scenes`
- `content/plays`
- `content/cases`
- `content/dossiers`
- `content/music-library.json`
- `content/world`
- `content/notes`
- `content/themes`

Minimal supported frontmatter schema:

```md
---
title: Case 01 - The Amber Ward
type: case
facet: bureau
section: cases
order: 1
chronology: 10
status: canon
canon: core
case: amber-ward
characters: Operator | Sherie | Drake
tags: bureau | municipal | ward-break
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
  `chamber`, `bureau`, `world`, `meta`
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
`case_code`, `priority`, `location`, or `category` are also passed into the manifest
and can be used by page templates.

## Music library

YouTube-backed music data lives in `content/music-library.json`.

Supported track fields:

- `id`
- `title`
- `youtube`
  accepts either a full YouTube URL or a bare video ID
- `facet`
  `chamber`, `bureau`, `world`, or `meta`
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

## Preview locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.
