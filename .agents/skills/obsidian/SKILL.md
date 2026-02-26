---
name: obsidian
description: Read and write markdown notes in the ClayEngine Obsidian vault at C:\Obsidian\ClayEngine (/mnt/c/Obsidian/ClayEngine in WSL). Use when the user asks to create, update, summarize, or sync product-related or cross-project documentation in Obsidian, or when markdown content should live outside the repo.
---

# obsidian markdown bridge

Use this skill to manage product and cross-project markdown in the ClayEngine Obsidian vault.

## Vault Mapping

- Windows vault root: `C:\Obsidian\ClayEngine`
- WSL vault root: `/mnt/c/Obsidian/ClayEngine`
- Product notes directory: `/mnt/c/Obsidian/ClayEngine/Product`
- Cross-project notes directory: `/mnt/c/Obsidian/ClayEngine/Cross-Project`
- Create `Product/` or `Cross-Project/` if either is missing.

## Workflow

1. Detect note scope.
- Route to `Product/` for ClayEngine roadmap, features, API, release, or editor/runtime decisions.
- Route to `Cross-Project/` for workflows, standards, architecture, or decisions shared across projects.

2. Locate the target note.
- Use the provided file path if the user gives one.
- If only a topic/title is given, search both directories before creating a new note.
- Prefer updating the best existing note over creating duplicates.

3. Read note content.
- Preserve YAML frontmatter if present.
- Preserve wiki links (`[[...]]`), headings, and checklists.
- Return only the summary or extraction requested by the user.

4. Write note content.
- Create missing files as UTF-8 `.md`.
- Use kebab-case file names unless the user specifies a different name.
- Update sections in place when possible instead of rewriting the full note.
- Add `Updated: YYYY-MM-DD` near the top when making substantive edits.
- Use templates in `references/note-templates.md` for new notes.

5. Mirror repo markdown to Obsidian when requested.
- Place mirrored product docs in `/mnt/c/Obsidian/ClayEngine/Product/`.
- Place mirrored cross-project docs in `/mnt/c/Obsidian/ClayEngine/Cross-Project/`.
- Keep original filenames unless the user asks for a rename.
- If a file name collides, append `-repo` to the new file name.
- Do not delete source repo files unless explicitly requested.

## Quality Bar

- Keep notes concise and action-oriented.
- Prefer exact dates in `YYYY-MM-DD` format.
- Keep one topic per note; split unrelated sections into separate notes.
- Ask one short clarification question if scope between product and cross-project is ambiguous.
