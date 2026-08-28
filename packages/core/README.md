# @autono/open-pages

Runtime and CLI for [open-pages](https://openpages.sh) — the web page framework built for agents. Pages are React components (or plain HTML); the dev server previews them live in a real browser frame on every save, and `open-pages export` builds each one into a static folder you can deploy anywhere.

## Install

Most workspaces get this installed by the scaffolder:

```bash
npm create @autono/open-pages@latest my-pages
```

Use this package directly only when wiring up an existing workspace by hand:

```bash
pnpm add @autono/open-pages react react-dom
```

## What's inside

- **Dev server + workspace viewer** — a home page listing every page with live thumbnails, folders, search, and sort; a per-page viewer at `/p/<id>` with desktop / tablet (820px) / mobile (390px) viewport toggles, reload, and open-in-new-tab.
- **Inspect mode** — press `i`, click any element on the page to see its exact source line and leave a comment. Comments persist as `@page-comment` markers in the source, ready for a coding agent to apply.
- **Vite plugin** — discovers `pages/<id>/index.tsx` and `pages/<id>/index.html`, exposes pages via virtual modules, generates a Tailwind v4 stylesheet scoped to `pages/` and `themes/`, hot-reloads on add/remove/edit.
- **Export CLI** — builds each page into `export/<id>/index.html` plus hashed assets with relative URLs.
- **Agent skills** — file-based skills (`create-page`, `page-authoring`, `apply-comments`, `create-theme`, `current-page`) that sync into workspaces; no MCP server required.

## CLI

Once installed, the `open-pages` bin is available in the workspace:

| Command | Description |
| --- | --- |
| `open-pages dev` | Start the dev server. Flags: `-p, --port <port>`, `--host [host]`, `--open`, `--no-skills-check`. |
| `open-pages build` | Build the workspace viewer as a static site, pages included. Flags: `--out-dir <dir>` (defaults to `dist`). |
| `open-pages preview` | Preview the production build. Flags: `-p, --port <port>`, `--host [host]`, `--open`. |
| `open-pages export [pages...]` | Build pages into self-contained static folders, one per page. Flags: `--out-dir <dir>` (defaults to `export`). |
| `open-pages sync:skills` | Sync built-in agent skills into this workspace. Flags: `--dry-run`. |
| `open-pages update` | Update `@autono/open-pages` to the latest version and sync skills. Flags: `--force`, `--no-skills`. |

## Authoring

A page is one folder under `pages/` with an `index.tsx` that default-exports a React component. Style with Tailwind via `className`; it is a real web page, so hooks, state, and browser APIs all work.

```tsx
import type { PageMeta } from '@autono/open-pages';

export const meta: PageMeta = {
  title: 'Hello, open-pages',
  createdAt: '2026-08-28T00:00:00.000Z',
};

export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-5xl font-bold tracking-tight">Hello, open-pages</h1>
      <p className="mt-4 text-lg text-slate-600">This is a real web page.</p>
    </main>
  );
}
```

A folder holding an `index.html` instead is served as-is (with its sibling CSS and JS) and exported the same way.

## Exports

```ts
import {
  type PageComponent,
  type PageKind,        // 'react' | 'html'
  type PageMeta,
  type PageModule,
  type OpenPagesConfig,
  type DesignSystem,
  defaultDesign,
  designToCssVars,
  cssVarsToString,
} from '@autono/open-pages';
```

The Vite plugin is exposed under a subpath for advanced setups:

```ts
import { createViteConfig } from '@autono/open-pages/vite';
```

## Config

Create `open-pages.config.ts` in the workspace root (all fields optional):

```ts
import type { OpenPagesConfig } from '@autono/open-pages';

const openPagesConfig: OpenPagesConfig = {
  pagesDir: 'pages',
  port: 5173,
  base: '/', // set to '/my-pages/' to host the built site under a subpath
};

export default openPagesConfig;
```

## Docs

Full documentation: [docs.openpages.sh](https://docs.openpages.sh)

## License

MIT
