# open-pages

**The web page framework built for agents.**

[![npm](https://img.shields.io/npm/v/@autono/open-pages?label=%40autono%2Fopen-pages)](https://www.npmjs.com/package/@autono/open-pages)
[![npm](https://img.shields.io/npm/v/@autono/create-open-pages?label=%40autono%2Fcreate-open-pages)](https://www.npmjs.com/package/@autono/create-open-pages)
[![CI](https://github.com/autonoco/open-pages/actions/workflows/ci.yml/badge.svg)](https://github.com/autonoco/open-pages/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Your coding agent writes web pages as React components (or plain HTML). The dev server previews each page live in a real browser frame on every save. Click any element to see its source line and leave a comment; the agent applies it and the page hot-reloads. Export any page as a self-contained static folder and deploy it anywhere.

[openpages.sh](https://openpages.sh) · [Documentation](https://docs.openpages.sh) · [Quickstart](https://docs.openpages.sh/quickstart) · [Discussions](https://github.com/autonoco/open-pages/discussions)

## Quick start

```bash
npm create @autono/open-pages@latest my-pages
cd my-pages
npm run dev
```

Open the workspace in your coding agent and ask for a page. The bundled `create-page` skill writes `pages/<id>/index.tsx`; the preview at `http://localhost:5173` updates on every save.

Requires Node.js 18+.

## The loop

1. **Describe.** Tell your agent what the page is: a landing page, a dashboard, a docs page, a form. It runs `/create-page` and writes the React.
2. **Preview.** The dev server renders the real page in a real browser frame. Switch between desktop, tablet, and mobile widths in the toolbar.
3. **Annotate.** Press `i`, click anything, leave a note. It lands in the source as an `@page-comment` marker.
4. **Ship.** Your agent runs `/apply-comments`. `open-pages export <id>` writes a static folder you can drop on Netlify, Vercel, Cloudflare Pages, GitHub Pages, or S3.

## What you get

- **A preview that is the page.** Each page runs as a real document in an iframe: real DOM, real CSS, real interactivity. No approximation.
- **Click-to-source inspector.** Every element knows its exact source line. Comments persist in the source, ready for an agent.
- **React or HTML.** A page is `pages/<id>/index.tsx` (React 18) or `pages/<id>/index.html` with sibling CSS and JS. Tailwind v4 via `className` works out of the box.
- **Responsive by default.** Desktop, tablet (820px), and mobile (390px) viewport toggles in the viewer.
- **Static export.** `open-pages export` builds each page into `export/<id>/` with hashed assets and relative URLs. Deploy the folder anywhere.
- **Agent-native.** File-based skills (`create-page`, `page-authoring`, `apply-comments`, `create-theme`, `current-page`) sync into the workspace. No MCP server. Works with Claude Code, Cursor, Codex, Gemini CLI, OpenCode, Windsurf, Zed, and anything else that reads `AGENTS.md`.
- **Nothing to configure.** Vite, React, TypeScript, and Tailwind live inside the runtime. A workspace is `pages/`, an optional `open-pages.config.ts`, and your agent skills.

## A page

```tsx
import type { PageMeta } from '@autono/open-pages';
import { useState } from 'react';

export const meta: PageMeta = {
  title: 'Hello, open-pages',
  description: 'A page written by an agent.',
  createdAt: '2026-08-28T00:00:00.000Z',
};

export default function Page() {
  const [count, setCount] = useState(0);
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-5xl font-bold tracking-tight">Hello, open-pages</h1>
      <p className="mt-4 text-lg text-slate-600">This is a real web page.</p>
      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        className="mt-8 rounded-full bg-black px-5 py-2 text-white"
      >
        Clicked {count} times
      </button>
    </main>
  );
}
```

Style with Tailwind classes via `className`, import `./styles.css` for anything custom, and put images and fonts under `pages/<id>/assets/`. See [Authoring](https://docs.openpages.sh/authoring/pages) for the file contract, styling, interactivity, assets, and themes.

## CLI

| Command | What it does |
| --- | --- |
| `open-pages dev` | Dev server with live preview, viewport toggles, and inspector. |
| `open-pages build` | Static site of the whole workspace viewer, pages included. |
| `open-pages preview` | Serve the production build. |
| `open-pages export [pages...]` | Build pages into `export/<id>/`, one deployable folder per page. |
| `open-pages sync:skills` | Sync the built-in agent skills into the workspace. |
| `open-pages update` | Update `@autono/open-pages` to the latest version and sync skills. |

Full flags: [CLI reference](https://docs.openpages.sh/reference/cli) · [Config reference](https://docs.openpages.sh/reference/config)

## Packages

| Package | Version | Role |
| --- | --- | --- |
| [`@autono/open-pages`](packages/core) | [![npm](https://img.shields.io/npm/v/@autono/open-pages)](https://www.npmjs.com/package/@autono/open-pages) | Runtime: workspace viewer, live preview, inspector, Vite plugin, `open-pages` CLI. |
| [`@autono/create-open-pages`](packages/cli) | [![npm](https://img.shields.io/npm/v/@autono/create-open-pages)](https://www.npmjs.com/package/@autono/create-open-pages) | `npm create @autono/open-pages` scaffolder and workspace template. |
| [`apps/demo`](apps/demo) | private | Example workspace; the dogfood target for the framework. |
| [`apps/web`](apps/web) | private | [openpages.sh](https://openpages.sh) landing site. |
| [`docs/`](docs) | | [docs.openpages.sh](https://docs.openpages.sh), built with Mintlify. |

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the repo layout, dev workflow, and PR checklist.

```bash
pnpm install
pnpm dev:demo     # demo workspace against local core
pnpm check        # biome: format + lint
pnpm typecheck
pnpm test
```

Bugs and feature requests go through the [issue templates](https://github.com/autonoco/open-pages/issues/new/choose). Questions and show-and-tell belong in [Discussions](https://github.com/autonoco/open-pages/discussions). Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

Every merge to `main` is a release by default: CI tags the next version, publishes both packages to npm with provenance, and cuts a [GitHub Release](https://github.com/autonoco/open-pages/releases). Merge commits containing `[skip release]` skip it.

## Security

Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md). Please do not open public issues for security reports.

## Acknowledgements

open-pages is a fork of [open-pdf](https://github.com/autonoco/open-pdf), retargeted from paginated PDFs to web pages. open-pdf itself started as a fork of [open-slide](https://github.com/1weiho/open-slide) by [Yiwei Ho](https://github.com/1weiho), whose agent-first architecture (file-based skills, click-to-source inspector, comments as source markers) carries through all three.

## License

[MIT](LICENSE). Contains code from open-slide © 2026 Yiwei Ho; modifications © 2026 Autono Holdings Inc.
