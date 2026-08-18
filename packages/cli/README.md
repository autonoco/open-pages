# @open-pdf/cli

Scaffold a workspace for [open-pdf](https://github.com/autonoco/open-pdf) — a React-based doc framework with Claude Code skills preconfigured.

## Usage

```bash
npx @open-pdf/cli init my-doc
cd my-doc
pnpm install
pnpm dev
```

This creates a workspace containing:

- `docs/getting-started/` — a starter doc you can edit or delete.
- `package.json` — depends on `@open-pdf/core`, which provides the runtime (home page, doc viewer, fullscreen mode) and the `open-pdf` CLI.
- `open-pdf.config.ts` — optional typed config (docsDir, port).
- `.claude/skills/` and `.agents/skills/` — Claude Code skills (`create-doc`, `apply-comments`, …).
- `CLAUDE.md` — agent guide for authoring docs.

You won't see any Vite, React, or tsconfig files in the workspace. They live inside `@open-pdf/core` and you never touch them.

## Commands

| Command | Description |
| --- | --- |
| `open-pdf init [dir]` | Scaffold a new workspace in `dir` (defaults to current dir). |
| `open-pdf init --force` | Scaffold into a non-empty directory. |
| `open-pdf init --name <name>` | Override the generated `package.json` name. |

(Once installed in the workspace, `@open-pdf/core` provides `open-pdf dev`, `open-pdf build`, and `open-pdf preview` via its own bin.)

## Authoring

Inside the scaffolded workspace, docs live under `docs/<kebab-case-id>/index.tsx` and default-export an array of `Page` components. Each page renders into a fixed 1920×1080 canvas; the framework handles scaling.

Ask Claude Code to "make docs about X" and the `create-doc` skill will take it from there.
