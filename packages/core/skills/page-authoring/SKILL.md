---
name: page-authoring
description: Technical reference for writing or editing open-pages pages — file contract, Tailwind via `className`, layout and responsive breakpoints, web type scale, interactivity with hooks and state, assets and fonts, plain `index.html` pages, and the self-review checklist. Consult this whenever you are about to write or modify any file under `pages/<id>/`, including from inside the `create-page` or `apply-comments` workflows, or for any ad-hoc page edit. Triggers on phrases like "edit the page", "fix the layout", "change the palette", "add a section", "make it responsive", "add a form", "investigate the page framework", "how do pages work here".
---

# Authoring open-pages pages

This skill is the **technical reference** for everything that happens inside `pages/<id>/`. It does not own a workflow:

- `create-page` owns "build a new page" — it asks the user scoping questions, then delegates the *how* to this skill.
- `apply-comments` owns "process inspector markers" — it finds markers and applies edits, but the edits themselves follow the rules here.
- `current-page` resolves deictic references ("this page", "this element") to a concrete `pageId` + selection. Consult it **first** when the user references the current page without naming it, then come back here for how to edit it.
- Any ad-hoc page edit (manual tweak, one-off fix) should also consult this skill before touching the file.

A page here is a **real web page**: one React component rendered into a real browser document. The workspace previews it live in an iframe, the inspector maps clicks back to source lines, and `open-pages export` turns it into a static folder you can deploy anywhere. Your job is a good web page; the runtime's job is preview, comments, and export.

## Topic references

Details live under `references/` in this skill. **Read the relevant file before using the feature**:

| Topic | Read before | File |
| --- | --- | --- |
| Layout + responsive | any multi-column layout, nav, hero, grid; anything that must work on mobile | `references/layout-and-responsive.md` |
| Typography + color | picking a type scale or palette, dark backgrounds, contrast | `references/typography-and-color.md` |
| Interactivity | state, forms, tabs, toggles, anything with an event handler | `references/interactivity.md` |
| Assets + fonts | images, icons, custom fonts, Google Fonts | `references/assets-and-fonts.md` |
| Plain HTML pages | a page authored as `index.html` instead of React | `references/html-pages.md` |

## Hard rules

- Put the page under `pages/<kebab-case-id>/`.
- Entry is `pages/<id>/index.tsx` (or `pages/<id>/index.html` for a plain HTML page — see `references/html-pages.md`).
- Do **not** touch `package.json`, `open-pages.config.ts`, or other pages.
- Do not add dependencies. Only `react`, `react-dom`, and `@autono/open-pages` (types) are available, plus browser APIs.
- A page is `index.tsx` plus, optionally, `components/*.tsx`, `styles.css`, and `assets/` for its images and fonts — all inside `pages/<id>/`. Shared assets live in the root `assets/` folder and import via `@assets/...`. No `README.md`, no config files.
- Style with Tailwind utilities on `className`. Tailwind is preconfigured and scans `pages/` and `themes/`; there is nothing to set up.

## File contract

```tsx
// pages/<id>/index.tsx
import type { PageMeta } from '@autono/open-pages';
import { useState } from 'react';

export const meta: PageMeta = {
  title: 'Meridian — Launch',
  description: 'Meridian turns your analytics into weekly decisions.',
  createdAt: '2026-08-28T12:00:00.000Z',
};

export default function Launch() {
  const [open, setOpen] = useState(false);
  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased">
      {/* sections */}
    </main>
  );
}
```

- `export default` is **one zero-prop React component** — the whole page. It owns the viewport: set the page background and text color on the root element (`min-h-screen bg-… text-…`).
- `meta.title` (optional) becomes the browser tab title and the workspace card label. Default is the folder name.
- `meta.description` (optional) becomes `<meta name="description">` in the exported HTML.
- `meta.theme` (optional) marks the page as built from a theme under `themes/`. The id must match a `<id>.md` basename. Omit if not derived from a registered theme.
- `meta.createdAt` is an **ISO 8601 string literal** set once when the page is scaffolded — **immediately before writing the file, run `node -e "console.log(new Date().toISOString())"` via Bash and paste the exact output**. Must stay a plain string literal (the framework reads it via regex, never by evaluating the module).
- Hooks, state, event handlers, `fetch`, `window`, client-side routing: all allowed. This is a browser. See `references/interactivity.md` for the constraints that still apply (no `window` at module top level, StrictMode double-invokes effects).

## Styling: Tailwind on `className`

Write the HTML you already know — `main`, `header`, `nav`, `section`, `h1`–`h3`, `p`, `ul`/`li`, `button`, `a`, `form`, `table` — styled with **Tailwind v4 utilities via `className`**:

```tsx
<section className="mx-auto max-w-5xl px-6 py-20">
  <h2 className="text-3xl font-bold tracking-tight">Pricing</h2>
  <p className="mt-3 max-w-xl text-lg text-slate-600">Simple plans that grow with you.</p>
</section>
```

- `className`, never a `tw` prop. Arbitrary values are fine (`text-[15px]`, `bg-[#0b0b10]`, `max-w-[72ch]`).
- Responsive variants are the default tool: `grid sm:grid-cols-2 lg:grid-cols-3`. Mobile-first — unprefixed utilities are the mobile layout.
- State variants for interactive elements: `hover:`, `focus-visible:`, `disabled:`, `aria-pressed:`.
- Use inline `style={{ … }}` only for values Tailwind cannot express (computed positions, CSS variables from data).
- A page may import its own stylesheet (`import './styles.css'`) for keyframes, complex selectors, or a font `@import`. Keep it small; utilities first.
- Preflight (Tailwind's reset) is applied inside the page, so headings and buttons start unstyled — set sizes and weights explicitly.

## Web type scale and color

| Element | Size |
| --- | --- |
| Hero heading | 48–72px (`text-5xl`–`text-7xl`), tight leading + tracking |
| Section heading | 24–36px (`text-2xl`–`text-4xl`) |
| Body | 16–18px (`text-base`–`text-lg`), `leading-relaxed` |
| Secondary / captions | 13–14px (`text-sm`), muted color |
| Labels, eyebrows | 11–12px (`text-xs`), `uppercase tracking-widest` |

- One page = one palette: a background, a text color, a muted text color, one accent, one border tint. Hold it for the whole page.
- Contrast: body text must pass 4.5:1 against its background; muted text on dark backgrounds is `text-white/60`, not `text-white/30`.
- Details in `references/typography-and-color.md`.

## Data rows vs designed repeats

- **Repeated data belongs in a `.map` over a data array** — pricing tiers, feature lists, testimonials pulled from a typed const at the top of the file; keep the row JSX in the map body. A comment on any row means "this row template".
- **Designed repeats that differ (hero vs. secondary CTA, three distinct feature panels with custom art) are explicit instances** of a small helper component defined in the same file or under `components/`. The inspector targets source JSX; explicit instances give each block its own address, so "make the middle one green" is one edit, not three.

## Editing an existing page

Locate the section first instead of reading the whole file:

```bash
grep -n '<section\|<h[12]\|<header\|<footer' pages/<id>/index.tsx
```

Landmarks and headings anchor sections; read the target range with `offset` + `limit`. Read the whole file when auditing palette or restructuring.

## Themes

If `themes/<id>.md` exists and the page is meant to follow it, **the theme file overrides the defaults in this skill** — its palette, typography, and fixed components are authoritative. Read the theme before applying anything else here. Themes are produced by the `create-theme` skill.

## Runtime behavior you get for free

- Home lists every folder under `pages/`; cards show a live, scaled-down preview of the real page.
- The page view at `http://localhost:5173/p/<id>` renders the page in an iframe with **Desktop / Tablet (820px) / Mobile (390px)** viewport toggles, a reload button, and **Open** (the page by itself in a new tab).
- **Inspect mode** (toolbar button or `i`): the user clicks any element, sees its tag and source line, and can leave a comment that lands in your source as an `@page-comment` marker (see `apply-comments`). The current selection is always in `node_modules/.open-pages/current.json` (see `current-page`).
- Hot reload: save any file under `pages/<id>/` and the preview updates in place.
- `open-pages export <id>` builds `export/<id>/` — `index.html` plus hashed assets with relative URLs. Drop the folder on Netlify, Vercel, Cloudflare Pages, GitHub Pages, or S3.

## Self-review before finishing

- [ ] `pages/<id>/index.tsx` default-exports **one** component; `meta` has `title` + fresh `createdAt` literal.
- [ ] Root element sets `min-h-screen`, background, and text color; the page has a `<main>` landmark.
- [ ] Preview it at `http://localhost:5173/p/<id>` (or ask the user to). No error banner, no console errors.
- [ ] Check the **Mobile** viewport: no horizontal overflow, nav collapses or wraps, grids stack, text sizes step down.
- [ ] Every `className` is Tailwind v4 the scanner will see (literal strings, no runtime-concatenated utility names).
- [ ] Interactive elements are real `<button>`/`<a>`/`<input>` elements with visible `focus-visible:` styles and labels; images have `alt`.
- [ ] One coherent palette and type scale across the page; contrast holds on dark sections.
- [ ] Designed repeats are explicit component instances; data lists are a `.map` over a typed const.
- [ ] No `window`/`document` access at module top level; effects clean up.
- [ ] Nothing outside `pages/<id>/` was edited.

## Anti-patterns

- ❌ `tw` props, `pageOptions`, fixed-size "page" `<div>`s, or any document/slide thinking. This is a scrolling web page.
- ❌ Desktop-only layouts: absolute pixel positioning, fixed widths on the root, `grid-cols-3` with no `sm:` fallback.
- ❌ Building class names at runtime (`` `text-${size}` ``) — Tailwind only generates utilities it can read literally. Map to full class strings instead.
- ❌ `<div onClick>` where a `<button>` belongs; `<a>` without `href`; icon buttons without `aria-label`.
- ❌ Tiny typography (11px body). Web body is 16px+.
- ❌ Global CSS resets or `body {}` rules in `styles.css` that fight Preflight — style the root element instead.
- ❌ Installing packages, editing `package.json`/config/other pages, adding a `README.md` to the page folder.
