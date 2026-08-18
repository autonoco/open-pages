# open-pdf — Agent Guide

You are authoring **docs** in this repo. Every doc is arbitrary React code that you write.

## Hard rules

- Put your doc under `docs/<kebab-case-id>/`.
- The entry is `docs/<id>/index.tsx`.
- Put doc-specific images/videos/fonts under `docs/<id>/assets/`. For assets reused across decks or themes (logos, avatars), use the global `assets/` folder and import via `@assets/...`.
- Do **not** touch `package.json`, `open-pdf.config.ts`, or other docs.
- Do not add dependencies. Use only `react` and standard web APIs.

## Which skill to use

- **Drafting a new deck** — use the `create-doc` skill. It walks through scoping questions, structure, and hand-off.
- **Applying inspector comments** (`@pdf-comment` markers in a page) — use the `apply-comments` skill.
- **Creating or extracting a theme** — use the `create-theme` skill. Themes live as markdown under `themes/<id>.md` and are read by `create-doc` before authoring.
- **Resolving "this page" / "this element"** — when the user references the current doc or selection without naming it, consult the `current-doc` skill. It reads the dev server's `node_modules/.open-pdf/current.json` to find which doc, page, and inspector-picked element they mean.
- **Any other doc edit** — read the `doc-authoring` skill before writing. It is the technical reference for everything inside `docs/<id>/`: file contract, the 1920×1080 canvas, type scale, palette, layout, assets, self-review checklist, and anti-patterns. `create-doc` and `apply-comments` both defer to it for the *how*.

Keep this file short: hard rules only. All deeper guidance lives in the skills above.

## Updating skills

The skills above are managed by `@open-pdf/core`. Do not edit them in place. To pull the latest versions:

```
pnpm up @open-pdf/core
pnpm sync:skills
```

`pnpm dev` will also detect drift on startup and offer to sync. `pnpm sync:skills --dry-run` (via `pnpm exec open-pdf sync:skills --dry-run`) previews changes without writing.
