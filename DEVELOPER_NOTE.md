# Developer Note

This refactor keeps the existing static Bootstrap structure but extends it into a
project-appropriate archive instead of rebuilding the site around a new framework or
CMS.

## What changed

- The archive now has a real information architecture:
  project home, about, cast, cases, archive, world, timeline, notes, and reader.
- Markdown remains the source of truth, but the content model is richer and supports:
  type, facet, section, chronology, case, characters, tags, canon, template, and featured status.
- New content categories were added for:
  bureau cases, character dossiers, world files, notes, and themes.
- The reader page now treats entries differently depending on what they are:
  literary files read like prose, dossiers feel like records, and world files read as reference.
- Shared code was introduced:
  `shell.js` for navigation chrome and `archive-core.js` for manifest access,
  formatting, rendering, and related-entry logic.

## Why

Divine Chamber does not behave like a flat blog.
Its archive needs to support two linked modes of reading:

- chamber reading:
  symbolic pressure, character interplay, dramatic tension, literary scenes
- bureau reading:
  incidents, case logic, investigation flow, political and civic consequences

The updated structure is designed so readers can enter through either mode and still
understand how files connect.

## Practical design decisions

- Bootstrap was kept for layout and responsive behavior.
- Styling was pushed away from default Bootstrap into a darker bureau shell with warm paper surfaces.
- Dependencies were kept minimal.
- Repeated navigation was centralized into `shell.js` for maintainability.
- The manifest builder stays intentionally simple instead of introducing a full YAML parser.
