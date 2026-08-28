# open-pages demo workspace

The dogfood workspace for the framework. It consumes `@autono/open-pages` via `workspace:*`, so edits to `packages/core` show up here on the next reload.

## Pages

| Page | Kind | Shows |
| --- | --- | --- |
| `launch` | React | A marketing landing page with a pricing toggle. |
| `status-board` | React | An interactive status page with filters and derived state. |
| `plain-html` | HTML | An `index.html` page with sibling CSS and JS. |

## Run it

```bash
pnpm install
pnpm dev          # from the repo root: builds core, starts this workspace
```

Or from this directory, `pnpm dev` after `pnpm core build` at the root. The workspace opens at `http://localhost:5173`; each page previews at `/p/<id>`.

## Authoring

Same contract as any scaffolded workspace: `pages/<id>/index.tsx` default-exports one React component and exports `meta`. See the skills under `.claude/skills/` (synced from `packages/core/skills/`) for the full guide, or the [template README](../../packages/cli/template/README.md).

```bash
pnpm export       # every page → export/<id>/
pnpm build        # the whole viewer → dist/
```
