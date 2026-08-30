---
name: page-authoring
description: Technical reference for writing or editing open-pages pages — file contract, composing from the preinstalled shadcn/ui set under `ui/`, semantic theme tokens, layout and responsive breakpoints, web type scale, interactivity with hooks and forms, assets and fonts, plain `index.html` pages, and the self-review checklist. Consult this whenever you are about to write or modify any file under `pages/<id>/`, including from inside the `create-page` or `apply-comments` workflows, or for any ad-hoc page edit. Triggers on phrases like "edit the page", "fix the layout", "change the palette", "add a section", "make it responsive", "add a form", "use a dialog", "investigate the page framework", "how do pages work here".
---

# Authoring open-pages pages

This skill is the **technical reference** for everything that happens inside `pages/<id>/`. It does not own a workflow:

- `create-page` owns "build a new page" — it asks the user scoping questions, then delegates the *how* to this skill.
- `apply-comments` owns "process inspector markers" — it finds markers and applies edits, but the edits themselves follow the rules here.
- `current-page` resolves deictic references ("this page", "this element") to a concrete `pageId` + selection. Consult it **first** when the user references the current page without naming it, then come back here for how to edit it.
- `shadcn` (the vendored official skill) covers the shadcn CLI, registries, presets, and component-level docs. Consult it for "how does `<Combobox>` work" or "add a block from a registry"; this skill covers how pages in *this* workspace use those components.
- Any ad-hoc page edit (manual tweak, one-off fix) should also consult this skill before touching the file.

A page here is a **real web page**: one React component rendered into a real browser document. The workspace previews it live in an iframe, the inspector maps clicks back to source lines, and `open-pages export` turns it into a static folder you can deploy anywhere. Your job is a good web page; the runtime's job is preview, comments, and export.

## What the workspace already gives you

Every workspace is a shadcn/ui project out of the box. Nothing needs installing:

| Path | What it is |
| --- | --- |
| `ui/*.tsx` | The full shadcn/ui set (61 components: accordion, alert, alert-dialog, aspect-ratio, attachment, avatar, badge, breadcrumb, bubble, button, button-group, calendar, card, carousel, chart, checkbox, collapsible, combobox, command, context-menu, dialog, direction, drawer, dropdown-menu, empty, field, form, hover-card, input, input-group, input-otp, item, kbd, label, marker, menubar, message, message-scroller, native-select, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, spinner, switch, table, tabs, textarea, toggle, toggle-group, tooltip). Import as `@/ui/<name>`. |
| `lib/utils.ts` | `cn()` for merging class names. Import as `@/lib/utils`. |
| `hooks/use-mobile.ts` | `useIsMobile()` breakpoint hook. Import as `@/hooks/use-mobile`. |
| `styles/globals.css` | Tailwind v4 entry: `@source` for `pages/ ui/ lib/ hooks/ themes/`, the `dark` variant, `:root`/`.dark` OKLCH tokens, `@theme inline`, base layer. Loaded into every page automatically. |
| `components.json` | shadcn config (style `new-york`, base `radix`, aliases `@/ui`, `@/lib/utils`, `@/hooks`, `@/components`). Activates the `shadcn` skill and CLI lookups. |
| `themes/<id>.css` | Optional token overrides a page opts into with `meta.theme` (see Themes). |

Installed deps you may import directly: `lucide-react` (icons), `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `cmdk`, `sonner`, `vaul`, `recharts`, `react-day-picker`, `date-fns`, `input-otp`, `embla-carousel-react`, `react-resizable-panels`, `next-themes`. Nothing else.

`npx shadcn@latest add <item>` is only for **blocks** (`dashboard-01`, `login-03`, …) or third-party registries; every core component is already under `ui/`. For lookups use `npx shadcn@latest docs <component> --json`, `view`, `search` — details in the `shadcn` skill.

## Topic references

Details live under `references/` in this skill. **Read the relevant file before using the feature**:

| Topic | Read before | File |
| --- | --- | --- |
| Layout + responsive | any multi-column layout, nav, app shell, sidebar, grid; anything that must work on mobile | `references/layout-and-responsive.md` |
| Typography + color | picking a type scale, the token system, dark sections, contrast | `references/typography-and-color.md` |
| Interactivity | state, forms, dialogs, toasts, tabs, anything with an event handler | `references/interactivity.md` |
| Assets + fonts | images, icons, custom fonts, Google Fonts | `references/assets-and-fonts.md` |
| Plain HTML pages | a page authored as `index.html` instead of React | `references/html-pages.md` |

## Hard rules

- Put the page under `pages/<kebab-case-id>/`.
- Entry is `pages/<id>/index.tsx` (or `pages/<id>/index.html` for a plain HTML page — see `references/html-pages.md`).
- A page may contain only `index.tsx`, `components/*.tsx`, `styles.css`, and `assets/`. Shared assets live in the root `assets/` folder and import via `@assets/...`. No `README.md`, no config files.
- `ui/`, `lib/`, `hooks/`, `styles/globals.css`, and `components.json` are **workspace-level and shared by every page**. Do not edit a file under `ui/` to suit one page — wrap or extend it in `pages/<id>/components/` instead (`<Button className={cn('rounded-full', …)}>`, or a `HeroButton` that renders `<Button>`). Do not edit `styles/globals.css` from a page task; token changes belong to a theme (`create-theme`).
- Do **not** touch `package.json`, `open-pages.config.ts`, or other pages. Do not add dependencies beyond the installed list above.
- **Use `@/ui/*` first.** Hand-roll an element only when no shadcn component covers it (a hero, a marketing feature grid, a footer). Buttons, inputs, cards, dialogs, tabs, tables, menus, tooltips, forms: always the `ui/` component.
- **Style with semantic tokens**, not raw palette classes: `bg-background text-foreground`, `bg-card`, `bg-primary text-primary-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`, `bg-accent`, `text-destructive`, `ring-ring`, `rounded-lg`. Themes restyle every token at once; a page written in `bg-slate-900` ignores them. Raw palette utilities are for deliberate one-off brand moments only.

## File contract

```tsx
// pages/<id>/index.tsx
import type { PageMeta } from '@autono/open-pages';
import { useState } from 'react';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';

export const meta: PageMeta = {
  title: 'Meridian — Launch',
  description: 'Meridian turns your analytics into weekly decisions.',
  createdAt: '2026-08-28T12:00:00.000Z',
};

export default function Launch() {
  const [yearly, setYearly] = useState(false);
  return (
    <main className="min-h-screen bg-background text-foreground antialiased">
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h1 className="text-5xl font-bold tracking-tight">Your analytics, turned into decisions</h1>
        <div className="mt-8 flex gap-3">
          <Button size="lg">Start free</Button>
          <Button size="lg" variant="outline">See how it works</Button>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <Tabs defaultValue={yearly ? 'yearly' : 'monthly'} onValueChange={(v) => setYearly(v === 'yearly')}>
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
          <TabsContent value="monthly">
            <Card>
              <CardHeader><CardTitle>Growth</CardTitle></CardHeader>
              <CardContent className="text-muted-foreground">$49 / month</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
```

- `export default` is **one zero-prop React component** — the whole page. Its root is `min-h-screen bg-background text-foreground` (add `dark` to the root's `className` for a dark page — the variant is `&:is(.dark *)`, so every token flips underneath it).
- `meta.title` (optional) becomes the browser tab title and the workspace card label. Default is the folder name.
- `meta.description` (optional) becomes `<meta name="description">` in the exported HTML.
- `meta.theme` (optional) opts the page into `themes/<id>.css` — the runtime injects that stylesheet into the preview frame and the export. The id must match a `themes/<id>.md` basename. Omit for the default neutral tokens.
- `meta.createdAt` is an **ISO 8601 string literal** set once when the page is scaffolded — **immediately before writing the file, run `node -e "console.log(new Date().toISOString())"` via Bash and paste the exact output**. Must stay a plain string literal (the framework reads it via regex, never by evaluating the module).
- Hooks, state, event handlers, `fetch`, `window`, client-side routing: all allowed. This is a browser. See `references/interactivity.md` for the constraints that still apply (no `window` at module top level, StrictMode double-invokes effects).

## Styling: tokens first, then shadcn, then utilities

1. **Tokens.** Surfaces and text use the semantic classes from `styles/globals.css`. Pairs go together: `bg-primary text-primary-foreground`, `bg-card text-card-foreground`, `bg-muted text-muted-foreground`. Borders are `border-border`; focus rings `ring-ring`; radius `rounded-md`/`rounded-lg`/`rounded-xl` (all scale from `--radius`).
2. **shadcn components** carry their own token styling and variants (`<Button variant="outline" size="sm">`, `<Badge variant="secondary">`). Reach for a variant before adding classes; add classes via `className` (merged with `cn`) for layout — width, margin, grid placement — not to repaint the component.
3. **Tailwind utilities** on `className` for everything structural: containers, grids, spacing, type sizes, responsive variants. Arbitrary values are fine (`max-w-[72ch]`). Mobile-first: unprefixed utilities are the phone layout, `sm:`/`md:`/`lg:` layer on top.

```tsx
<section className="mx-auto max-w-5xl px-6 py-20">
  <Badge variant="secondary">Pricing</Badge>
  <h2 className="mt-4 text-3xl font-bold tracking-tight">Simple plans</h2>
  <p className="mt-3 max-w-xl text-lg text-muted-foreground">Grow at your own pace.</p>
  <div className="mt-8 grid gap-6 sm:grid-cols-3">
    {plans.map((p) => (
      <Card key={p.name} className={cn(p.featured && 'border-primary')}>…</Card>
    ))}
  </div>
</section>
```

- `className`, never a `tw` prop. Build class strings literally; `cn()` for conditionals — never `` `text-${size}` ``.
- Icons: `lucide-react` (`<ArrowRight className="size-4" />`), sized with `size-*`, `aria-hidden` when decorative.
- `style={{ … }}` only for values Tailwind cannot express (computed positions, CSS variables from data).
- A page may import its own stylesheet (`import './styles.css'`) for keyframes, complex selectors, or a font `@import`. Keep it small; never redefine the tokens there — that is a theme's job.
- Preflight plus the shadcn base layer are applied inside the page: headings start unstyled (set sizes and weights explicitly); `body` already carries `bg-background text-foreground`.

## Web type scale

| Element | Size |
| --- | --- |
| Hero heading | 48–72px (`text-5xl`–`text-7xl`), tight leading + tracking |
| Section heading | 24–36px (`text-2xl`–`text-4xl`) |
| Body | 16–18px (`text-base`–`text-lg`), `leading-relaxed` |
| Secondary / captions | 13–14px (`text-sm text-muted-foreground`) |
| Labels, eyebrows | 11–12px (`text-xs`), `uppercase tracking-widest` |

- Contrast: body text must pass 4.5:1. The tokens pass by construction; if you reach for `text-foreground/40`, you are below the floor.
- Details and the token → OKLCH map in `references/typography-and-color.md`.

## Data rows vs designed repeats

- **Repeated data belongs in a `.map` over a data array** — pricing tiers, feature lists, testimonials pulled from a typed const at the top of the file; keep the row JSX in the map body. A comment on any row means "this row template".
- **Designed repeats that differ (hero vs. secondary CTA, three distinct feature panels with custom art) are explicit instances** of a small helper component defined in the same file or under `components/`. The inspector targets source JSX; explicit instances give each block its own address, so "make the middle one green" is one edit, not three.
- The inspector tags components as well as host elements: shadcn components spread their props onto their root, so a click on a rendered `<Button>` resolves to the `<Button>` line in *your* page, not to `ui/button.tsx`.

## Editing an existing page

Locate the section first instead of reading the whole file:

```bash
grep -n '<section\|<h[12]\|<header\|<footer\|<Card\b\|<Dialog\b' pages/<id>/index.tsx
```

Landmarks, headings, and top-level shadcn wrappers anchor sections; read the target range with `offset` + `limit`. Read the whole file when auditing tokens or restructuring.

## Themes

A theme is `themes/<id>.md` (direction and component notes) + `themes/<id>.css` (token overrides) + `themes/<id>.demo.tsx` (a demo page). If the page is meant to follow one, **read `themes/<id>.md` first — its guidance overrides the defaults in this skill** — and set `meta.theme: '<id>'`; the runtime injects the CSS. Do not paste token values into the page; the whole point is that the page stays token-based and the theme repaints it. Themes are produced by the `create-theme` skill.

## Runtime behavior you get for free

- Home lists every folder under `pages/`; cards show a live, scaled-down preview of the real page.
- The page view at `http://localhost:5173/p/<id>` renders the page in an iframe with **Desktop / Tablet (820px) / Mobile (390px)** viewport toggles, a reload button, and **Open** (the page by itself in a new tab).
- **Inspect mode** (toolbar button or `i`): the user clicks any element or component, sees its tag and source line, and can leave a comment that lands in your source as an `@page-comment` marker (see `apply-comments`). The current selection is always in `node_modules/.open-pages/current.json` (see `current-page`).
- Hot reload: save any file under `pages/<id>/` and the preview updates in place.
- `open-pages export <id>` builds `export/<id>/` — `index.html` plus hashed assets with relative URLs, bundling only the `ui/` components the page imports. Drop the folder on Netlify, Vercel, Cloudflare Pages, GitHub Pages, or S3.

## Self-review before finishing

- [ ] `pages/<id>/index.tsx` default-exports **one** component; `meta` has `title` + fresh `createdAt` literal (+ `theme` if built from one).
- [ ] Root element is `min-h-screen bg-background text-foreground`; the page has a `<main>` landmark.
- [ ] Every button, input, card, dialog, tab, table, menu, tooltip, or form is the `@/ui/*` component, not a hand-rolled lookalike.
- [ ] Colors are semantic tokens; raw palette classes appear only where a one-off brand moment was intended.
- [ ] Nothing under `ui/`, `lib/`, `hooks/`, or `styles/` was edited.
- [ ] Preview it at `http://localhost:5173/p/<id>` (or ask the user to). No error banner, no console errors.
- [ ] Check the **Mobile** viewport: no horizontal overflow, nav collapses or wraps, grids stack, text sizes step down.
- [ ] Every `className` is Tailwind v4 the scanner will see (literal strings, `cn()` for conditionals).
- [ ] Interactive elements are real `<Button>`/`<a>`/`<Input>` with visible focus styles and labels; images have `alt`.
- [ ] One coherent type scale across the page; contrast holds on dark sections.
- [ ] Designed repeats are explicit component instances; data lists are a `.map` over a typed const.
- [ ] No `window`/`document` access at module top level; effects clean up.
- [ ] Nothing outside `pages/<id>/` was edited.

## Anti-patterns

- ❌ A hand-rolled `<button className="rounded-md bg-slate-900 px-4 …">` when `<Button>` exists. Same for inputs, cards, dialogs, dropdowns, tabs, tables.
- ❌ Repainting a component with raw colors (`<Button className="bg-blue-600">`). Use a variant, or change the theme.
- ❌ Editing `ui/button.tsx` because one page wants rounder buttons. Wrap it under `pages/<id>/components/`.
- ❌ `tw` props, `pageOptions`, fixed-size "page" `<div>`s, or any document/slide thinking. This is a scrolling web page.
- ❌ Desktop-only layouts: absolute pixel positioning, fixed widths on the root, `grid-cols-3` with no `sm:` fallback.
- ❌ Building class names at runtime (`` `text-${size}` ``) — Tailwind only generates utilities it can read literally.
- ❌ `<div onClick>` where a `<Button>` belongs; `<a>` without `href`; icon buttons without `aria-label`.
- ❌ Tiny typography (11px body). Web body is 16px+.
- ❌ Global CSS resets, `body {}` rules, or `:root { --primary: … }` in the page's `styles.css`. Tokens belong to themes.
- ❌ Installing packages, `npx shadcn add` for a component already in `ui/`, editing `package.json`/config/other pages, adding a `README.md` to the page folder.
