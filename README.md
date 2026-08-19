# open-pdf

**The PDF framework built for agents.** An AI coding agent authors documents as React components; you get a live in-browser PDF preview with click-to-edit and click-to-comment; the preview bytes are the exported file.

> **Status: pre-release.** This codebase started as a hard fork of [open-slide](https://github.com/1weiho/open-slide) v1.18.0 (MIT, © Yiwei Ho) — the same agent-first architecture, retargeted from slide decks to real PDFs rendered by [Takumi](https://takumi.kane.tw). The engine swap is in progress; see [notes/PLAN.md](notes/PLAN.md) for the full blueprint and the empirical engine bake-off behind it.

## How it will work

```bash
npx @open-pdf/cli init my-doc
cd my-doc && npm run dev
```

1. Open the workspace in your coding agent (Claude Code, Cursor, Codex, ...) and run `/create-doc` with a prompt.
2. Watch the live PDF preview at `localhost:5173` — real PDF bytes, not an HTML approximation.
3. Click elements to edit directly, or leave comments; the agent applies them with `/apply-comments`.
4. `open-pdf export` emits the same bytes headlessly. Tagged, accessible PDF by default.

## Monorepo

| Package | Purpose |
|---|---|
| `@open-pdf/core` | Runtime viewer, Vite plugins, inspector, `open-pdf` CLI (dev/build/preview/export/sync:skills) |
| `@open-pdf/cli` | `init` scaffolder |
| `apps/demo` | Example documents workspace |
| `apps/web` | Docs site |

## License

MIT. Contains substantial code from [open-slide](https://github.com/1weiho/open-slide) © 2026 Yiwei Ho; modifications © 2026 Autono. See [LICENSE](LICENSE).
