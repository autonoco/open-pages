# open-pages workspace

Web pages as React components. Each page lives under `pages/<id>/index.tsx` and default-exports one component. The `@autono/open-pages` runtime handles Vite, React, Tailwind, the live preview, and the inspector — you just write the page.

## Getting started

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`, edit `pages/getting-started/index.tsx`, or create a new page at `pages/<your-page>/index.tsx`. Each page previews at `http://localhost:5173/p/<id>`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server with live preview and hot reload. |
| `npm run build` | Build the whole workspace viewer as a static site. |
| `npm run export` | Build pages into `export/<id>/`, one deployable folder per page. |
| `npm run preview` | Preview the built workspace locally. |
| `npm run sync:skills` | Sync the bundled agent skills into the workspace. |
| `npm run update` | Update `@autono/open-pages` and sync skills. |

## Authoring a page

```tsx
// pages/my-page/index.tsx
import type { PageMeta } from '@autono/open-pages';

export const meta: PageMeta = {
  title: 'My page',
  createdAt: '2026-08-28T00:00:00.000Z',
};

export default function MyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-4xl font-bold tracking-tight">Hello</h1>
      <p className="mt-4 text-slate-600">Tailwind via className, hooks, state, all of it.</p>
    </main>
  );
}
```

A page is a real web page: Tailwind v4 utilities via `className` work out of the box, `import './styles.css'` for custom CSS, hooks and event handlers for interactivity. Put images and fonts under `pages/<id>/assets/` and import them; shared assets go in the root `assets/` folder and import via `@assets/...`.

A folder holding an `index.html` (with sibling CSS/JS) instead of `index.tsx` works too. It is served as-is and exported the same way.

See [`AGENTS.md`](./AGENTS.md) for the rules your agent follows.

## The viewer

- Toolbar toggles between desktop, tablet (820px), and mobile (390px) widths.
- `i` toggles Inspect mode: click any element to see its source line and leave a comment for your agent.
- **Open** shows the page by itself in a new tab.

## Agent integration

This workspace ships agent skills under `.agents/skills/` (symlinked into `.claude/skills/`). Ask your agent to "make a landing page for X" and the `create-page` skill takes over. Leave comments in Inspect mode and ask for `apply-comments` to iterate.

## Config

Optional `open-pages.config.ts` at the workspace root:

```ts
import type { OpenPagesConfig } from '@autono/open-pages';

const openPagesConfig: OpenPagesConfig = {
  port: 5173,
};

export default openPagesConfig;
```

Supported fields: `pagesDir`, `themesDir`, `assetsDir`, `port`, `base`, `allowedHosts`, `build`.
