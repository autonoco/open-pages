# @open-pdf/cli

Scaffold a workspace for [open-pdf](https://openpdf.sh) — the PDF framework built for agents. Your coding agent writes documents as React components; you get a live preview that **is** the PDF, click-to-comment, and export to PDF or editable Word.

## Usage

```bash
npx @open-pdf/cli init my-docs
cd my-docs
npm run dev
```

This creates a workspace containing:

- `docs/getting-started/` — a starter doc you can edit or delete.
- `package.json` — depends on `@open-pdf/core`, which provides the runtime (viewer, inspector, export) and the `open-pdf` CLI.
- `open-pdf.config.ts` — optional typed config (docsDir, port, base).
- `.claude/skills/` and `.agents/skills/` — agent skills (`create-doc`, `apply-comments`, …).
- `CLAUDE.md` — agent guide for authoring documents.

You won't see any Vite, React, or tsconfig files in the workspace. They live inside `@open-pdf/core` and you never touch them.

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

1. Ask your agent to "make a doc about X" — the `create-doc` skill writes the React.
2. `npm run dev` shows the live PDF preview; every save re-renders real PDF bytes.
3. Press `i`, click anything, leave a note — it lands in the source as a marker.
4. The agent runs `apply-comments`; `open-pdf export` ships PDF or editable Word.

Full documentation: [docs.openpdf.sh](https://docs.openpdf.sh)

## License

MIT
