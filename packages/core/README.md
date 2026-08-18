# @open-pdf/core

Runtime and CLI for [open-pdf](https://github.com/autonoco/open-pdf) — a React-based doc framework where you write docs and the framework handles the Vite/React stack, layout, navigation, hot reload, and fullscreen play mode.

## Install

```bash
pnpm add @open-pdf/core
```

Most users get this installed automatically by running `npx @open-pdf/cli init`. Use this package directly only if you're wiring up an existing workspace by hand.

## What's inside

- **Runtime** — home page, doc viewer, thumbnail rail, keyboard navigation, and fullscreen presenter mode. Every doc renders into a fixed **1920×1080** canvas; the framework scales it.
- **Vite plugin** — discovers `docs/<id>/index.{tsx,jsx,ts,js}`, exposes them via virtual modules, and reloads when docs are added or removed.
- **CLI** — `open-pdf dev | build | preview` so workspaces never need to touch Vite, React, or tsconfig directly.

## CLI

Once installed, the `open-pdf` bin is available in the workspace:

| Command | Description |
| --- | --- |
| `open-pdf dev` | Start the dev server. Flags: `-p, --port <port>`, `--host [host]`, `--open`. |
| `open-pdf build` | Build a static site. Flags: `--out-dir <dir>` (defaults to `dist`). |
| `open-pdf preview` | Preview the production build. Flags: `-p, --port <port>`, `--host [host]`, `--open`. |

## Config

Create `open-pdf.config.ts` in the workspace root (all fields optional):

```ts
import type { OpenPdfConfig } from '@open-pdf/core';

const openPdfConfig: OpenPdfConfig = {
  docsDir: 'docs',
  port: 5173,
};

export default openPdfConfig;
```

### Hosting under a subpath

Set `base` to deploy the built site under a sub-directory (intranet folders, GitHub Pages project sites, reverse proxies). Use a leading and trailing slash:

```ts
const openPdfConfig: OpenPdfConfig = {
  base: '/my-docs/',
};
```

The value is passed straight to Vite's `base` and to React Router's `basename`, so client-side navigation matches the deployed path.

## Authoring docs

Docs live under `docs/<kebab-case-id>/index.tsx` and default-export an array of `Page` components:

```tsx
import type { Page } from '@open-pdf/core';

const Cover: Page = () => (
  <div className="flex h-full w-full items-center justify-center">
    <h1 className="text-[120px] font-bold">Hello, open-pdf</h1>
  </div>
);

const pages: Page[] = [Cover];
export default pages;

export const meta = { title: 'Hello' };
```

## Exports

```ts
import {
  CANVAS_WIDTH,   // 1920
  CANVAS_HEIGHT,  // 1080
  MorphElement,   // match or fade objects across pages for morph transitions
  type Page,
  type DocMeta,
  type DocModule,
  type DocTransition,
  type OpenPdfConfig,
} from '@open-pdf/core';
```

The Vite plugin is exposed under a subpath for advanced setups:

```ts
import { createViteConfig } from '@open-pdf/core/vite';
```

## License

MIT
