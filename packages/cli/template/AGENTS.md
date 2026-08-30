# open-pages — Agent Guide

You are authoring **web pages** in this repo. Every page is a React component rendered as a real web page — composed from the shadcn/ui components under `ui/`, styled with Tailwind via `className`, with hooks, state, and browser APIs available. A page folder can hold an `index.html` instead when plain HTML is the better fit.

## Hard rules

- Put your page under `pages/<kebab-case-id>/`.
- The entry is `pages/<id>/index.tsx` (or `pages/<id>/index.html`).
- A page is its entry plus optional `components/`, `styles.css`, and `assets/` (images, fonts) inside its folder. Shared assets live in the root `assets/` folder (import via `@assets/...`).
- Use the shadcn components first: `import { Button } from '@/ui/button'`, `cn` from `@/lib/utils`. Use the semantic token classes (`bg-background`, `text-muted-foreground`, `bg-primary`) so themes apply.
- Do **not** edit files under `ui/`, `lib/`, or `hooks/` for one page. They are shared by every page; wrap or extend a component inside the page instead.
- Do **not** touch `package.json`, `open-pages.config.ts`, `components.json`, `styles/globals.css`, or other pages.
- Do not add dependencies beyond what is installed. `npx shadcn@latest add` is fine for blocks and registry items.

## Which skill to use

- **Drafting a new page** — use the `create-page` skill. It walks through scoping questions, structure, and hand-off.
- **Applying inspector comments** (`@page-comment` markers in a page) — use the `apply-comments` skill.
- **Creating or extracting a theme** — use the `create-theme` skill. A theme is `themes/<id>.md` plus `themes/<id>.css` (shadcn token overrides) and a `<id>.demo.tsx` preview; `create-page` reads it before authoring and a page opts in with `meta.theme`.
- **shadcn CLI, registries, presets, component docs** — the bundled `shadcn` skill (the official one) covers `npx shadcn@latest search / view / docs / add / apply`.
- **Resolving "this page" / "this element"** — when the user references the current page or selection without naming it, consult the `current-page` skill. It reads the dev server's `node_modules/.open-pages/current.json` to find which page and inspector-picked element they mean.
- **Any other page edit** — read the `page-authoring` skill before writing. It is the technical reference for everything inside `pages/<id>/`: file contract, styling with Tailwind, layout and responsiveness, interactivity, assets and fonts, self-review checklist. `create-page` and `apply-comments` both defer to it for the *how*.

Keep this file short: hard rules only. All deeper guidance lives in the skills above.

## Updating skills

The skills above are managed by `@autono/open-pages`. Do not edit them in place. To pull the latest versions:

```
npm run update
```

`npm run dev` will also detect drift on startup and offer to sync. `npx open-pages sync:skills --dry-run` previews changes without writing.
