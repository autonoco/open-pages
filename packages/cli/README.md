# @autono/create-open-pages

Scaffold a workspace for [open-pages](https://openpages.sh) — the web page framework built for agents. Your coding agent writes pages as React components or plain HTML, with the full shadcn/ui set already installed; you get a live browser preview, click-to-comment, and static export to any host.

## Usage

```bash
npm create @autono/open-pages@latest my-pages
cd my-pages
npm run dev
```

This creates a workspace containing:

- `pages/getting-started/` — a starter page you can edit or delete.
- `ui/` — all 61 shadcn/ui components, plus `lib/utils.ts` (`cn`) and `hooks/use-mobile.ts`. Pages import `@/ui/button` and friends; nothing to `add`.
- `styles/globals.css` — Tailwind v4 entry with the shadcn token theme (`:root` / `.dark`). The runtime uses it for preview and export.
- `components.json` — shadcn config (new-york, radix, `@/ui` aliases) so `npx shadcn@latest add` works for blocks and other registries, and the bundled `shadcn` skill activates.
- `package.json` — depends on `@autono/open-pages`, which provides the runtime (viewer, inspector, export) and the `open-pages` CLI.
- `open-pages.config.ts` — optional typed config (pagesDir, port, base).
- `.claude/skills/` and `.agents/skills/` — agent skills (`create-page`, `page-authoring`, `apply-comments`, `create-theme`, `current-page`, `shadcn`).
- `AGENTS.md` (linked as `CLAUDE.md`) — agent guide for authoring pages.

You won't see any Vite or React config in the workspace. That lives inside `@autono/open-pages`. The shadcn components are yours: real source files under `ui/`, editable like any shadcn project.

## Flags

| Flag | Description |
| --- | --- |
| `init [dir]` | Scaffold into `dir` (defaults to the current directory). |
| `-f, --force` | Scaffold into a non-empty directory. |
| `-n, --name <name>` | Override the generated `package.json` name. |
| `--use-npm` / `--use-pnpm` / `--use-yarn` / `--use-bun` | Pick the package manager for the install step. |
| `--no-install` | Skip dependency installation. |
| `--no-git` | Skip git init and the initial commit. |

## The loop

1. Ask your agent to "make a landing page for X" — the `create-page` skill writes the React.
2. `npm run dev` shows the live preview at `http://localhost:5173/p/<id>`; every save hot-reloads.
3. Press `i`, click anything, leave a note — it lands in the source as a marker.
4. The agent runs `apply-comments`; `open-pages export <id>` writes a deployable static folder.

Full documentation: [docs.openpages.sh](https://docs.openpages.sh)

## License

MIT
