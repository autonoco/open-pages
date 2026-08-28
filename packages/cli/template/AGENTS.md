# open-pages — Agent Guide

You are authoring **web pages** in this repo. Every page is a React component rendered as a real web page — HTML JSX styled with Tailwind via `className`, with hooks, state, and browser APIs available. A page folder can hold an `index.html` instead when plain HTML is the better fit.

## Hard rules

- Put your page under `pages/<kebab-case-id>/`.
- The entry is `pages/<id>/index.tsx` (or `pages/<id>/index.html`).
- A page is its entry plus optional `components/`, `styles.css`, and `assets/` (images, fonts) inside its folder. Shared assets live in the root `assets/` folder (import via `@assets/...`).
- Do **not** touch `package.json`, `open-pages.config.ts`, or other pages.
- Do not add dependencies. Use only `react`, `react-dom`, and standard web APIs.

## Which skill to use

- **Drafting a new page** — use the `create-page` skill. It walks through scoping questions, structure, and hand-off.
- **Applying inspector comments** (`@page-comment` markers in a page) — use the `apply-comments` skill.
- **Creating or extracting a theme** — use the `create-theme` skill. Themes live as markdown under `themes/<id>.md` (with a `<id>.demo.tsx` preview) and are read by `create-page` before authoring.
- **Resolving "this page" / "this element"** — when the user references the current page or selection without naming it, consult the `current-page` skill. It reads the dev server's `node_modules/.open-pages/current.json` to find which page and inspector-picked element they mean.
- **Any other page edit** — read the `page-authoring` skill before writing. It is the technical reference for everything inside `pages/<id>/`: file contract, styling with Tailwind, layout and responsiveness, interactivity, assets and fonts, self-review checklist. `create-page` and `apply-comments` both defer to it for the *how*.

Keep this file short: hard rules only. All deeper guidance lives in the skills above.

## Updating skills

The skills above are managed by `@autono/open-pages`. Do not edit them in place. To pull the latest versions:

```
npm run update
```

`npm run dev` will also detect drift on startup and offer to sync. `npx open-pages sync:skills --dry-run` previews changes without writing.
