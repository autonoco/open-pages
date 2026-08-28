---
name: create-theme
description: Use this skill when the user wants to create, draft, author, or extract a page theme in this open-pages repo. Triggers on phrases like "create a theme", "make a theme called X", "extract a theme from <page>", "build a design system from these screenshots", "match our brand". Produces two paired files under `themes/` — `<id>.md` (palette, typography, layout, fixed components) and `<id>.demo.tsx` (a runnable demo page the workspace's Themes panel previews live). Do NOT use for editing real pages — only for authoring the theme bundle.
---

# Create a page theme

This skill produces a **theme bundle** under `themes/`: two paired files that together describe a reusable visual identity for web pages.

1. `themes/<id>.md` — agent-facing documentation: palette, typography, layout, fixed components (nav, hero, section wrapper, buttons, card, footer). This is what `create-page` reads when an author picks the theme.
2. `themes/<id>.demo.tsx` — a runnable demo page (same module shape as `pages/<id>/index.tsx`: **one default-exported component**) that shows the theme on a single scrolling page. The workspace's Themes panel renders it live, exactly like a real page.

Both files share the same stem so the runtime can pair them automatically.

The theme markdown is authoring-time direction — `create-page` copies its palette, utilities, and components into a real page's source. The demo `.tsx` is a self-contained preview, not a real page — it does not appear in the pages list.

You only write `themes/<id>.md` and `themes/<id>.demo.tsx`. Never modify real pages or configuration. The styling rules and web defaults that themes override live in the **`page-authoring`** skill — read it before writing the theme so your overrides are stated explicitly.

## Step 1 — Identify the input source

A theme can be derived from any combination of three input shapes:

- **Image references** — paths or URLs to screenshots, mood-board images, brand assets.
- **Free-text description** — prose describing the desired palette, weight, feel.
- **An existing page** — `pages/<id>/index.tsx` whose visual identity should be lifted out into a reusable theme.

If the user's original message already specifies the inputs unambiguously, skip the question and proceed. Otherwise call `AskUserQuestion` (multi-select) so they can pick one or more sources, and ask follow-ups (paths, page id, prose) only as needed.

## Step 2 — Gather raw inputs

- **Images**: read each path with the `Read` tool (it accepts images). Note dominant colors as hex, type weight and family feel, corner radius, surface treatment (flat vs. cards vs. borders), density, and recurring chrome (nav style, footer).
- **Text**: extract explicit tokens (hex codes, font names, tone words) and resolve vague language into concrete decisions before writing.
- **Existing page**: read `pages/<id>/index.tsx` (and `components/`) and pull:
  - The Tailwind color utilities used consistently (`bg-…`, `text-…`, accent classes) → Palette section.
  - Type sizes and any font loading (`<link>` to Google Fonts, `font-[…]`) → Typography section.
  - Container widths, section padding, breakpoints used → Layout section.
  - Recurring helper components (nav, hero, cards, buttons, footer) → Fixed components section.
  - The aesthetic feel implied → Aesthetic paragraph.

When inputs disagree (e.g. images use blue but the description says green), ask the user which to honor.

## Step 3 — Pick a theme id

Use **kebab-case**, short, descriptive. Examples: `dark-launch`, `clean-saas`, `editorial-warm`, `ops-console`. Check `themes/` to avoid collisions.

## Step 4 — Write `themes/<id>.md`

Produce a file with this exact section order. Section bodies adapt to the theme; the headings stay consistent across all themes.

````markdown
---
name: <Human title, e.g. "Dark Launch">
description: <one-line elevator pitch>
---

# <Theme name>

## Palette

| Role | Tailwind | Hex | Notes |
| --- | --- | --- | --- |
| background | `bg-[#0b0b10]` | #0b0b10 | page root |
| surface | `bg-white/[0.04] border-white/10` | — | cards, panels |
| text | `text-white` | #ffffff | headings, body |
| muted | `text-white/60` | — | secondary copy, labels |
| accent | `bg-emerald-400 text-black` / `text-emerald-400` | #34d399 | primary CTA, eyebrows |
| border | `border-white/10` | — | dividers, card edges |

## Typography

- Font: system stack, or a named family with how to load it (Google Fonts `<link>` rendered in the page, or a self-hosted file the page must place under `assets/`).
- Type-scale overrides (only list what differs from `page-authoring` defaults):
  - Hero heading: `text-5xl sm:text-7xl font-bold leading-[1.02] tracking-tight`
  - Section heading: `text-3xl font-bold tracking-tight`
  - Body: `text-lg text-white/60`
  - Eyebrow: `text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400`

## Layout

- Container: `mx-auto max-w-6xl px-6`.
- Section rhythm: `py-20`, sections separated by `border-t border-white/10`.
- Breakpoints: single column by default; `sm:grid-cols-3` for feature and pricing grids; nav links `hidden sm:flex`.
- Radius: `rounded-full` for buttons, `rounded-2xl` for cards.

## Fixed components

These are paste-ready React JSX with `className`. Copy them verbatim into a page that uses this theme.

### Nav

```tsx
const Nav = ({ brand, links, cta }: { brand: string; links: { label: string; href: string }[]; cta: { label: string; href: string } }) => (
  <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
    <span className="font-semibold tracking-tight">{brand}</span>
    <nav className="hidden gap-8 text-sm text-white/70 sm:flex">
      {links.map((l) => (
        <a key={l.href} href={l.href} className="hover:text-white">{l.label}</a>
      ))}
    </nav>
    <a href={cta.href} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90">{cta.label}</a>
  </header>
);
```

### Hero

```tsx
const Hero = ({ eyebrow, title, lede, children }: { eyebrow: string; title: string; lede: string; children?: React.ReactNode }) => (
  <section className="mx-auto max-w-6xl px-6 pt-20 pb-24 text-center">
    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">{eyebrow}</p>
    <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl">{title}</h1>
    <p className="mx-auto mt-6 max-w-xl text-lg text-white/60">{lede}</p>
    <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">{children}</div>
  </section>
);
```

### Section

```tsx
const Section = ({ id, children }: { id?: string; children: React.ReactNode }) => (
  <section id={id} className="border-t border-white/10">
    <div className="mx-auto max-w-6xl px-6 py-20">{children}</div>
  </section>
);
```

### Buttons

```tsx
const PrimaryButton = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="rounded-full bg-emerald-400 px-6 py-3 font-medium text-black hover:bg-emerald-300">{children}</a>
);
const SecondaryButton = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="rounded-full border border-white/20 px-6 py-3 font-medium text-white/80 hover:border-white/40">{children}</a>
);
```

### Card

```tsx
const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
    <h3 className="font-semibold">{title}</h3>
    <div className="mt-2 text-white/60">{children}</div>
  </div>
);
```

### Footer

```tsx
const Footer = ({ left, right }: { left: string; right: string }) => (
  <footer className="border-t border-white/10">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-white/40">
      <span>{left}</span>
      <span>{right}</span>
    </div>
  </footer>
);
```

## Aesthetic

One paragraph. What it feels like, the references it draws on, what to avoid (e.g. "no gradients; one accent only; borders over shadows; motion limited to hover color changes"). Commit to a single direction.

## Example usage

```tsx
<main className="min-h-screen bg-[#0b0b10] text-white antialiased">
  <Nav brand="Meridian" links={links} cta={{ label: 'Get started', href: '#pricing' }} />
  <Hero eyebrow="Now in public beta" title="Your analytics, turned into decisions" lede="…">
    <PrimaryButton href="#pricing">Start free</PrimaryButton>
    <SecondaryButton href="#features">See how it works</SecondaryButton>
  </Hero>
  {/* … */}
  <Footer left="© 2026 Meridian" right="Built with open-pages" />
</main>
```
````

## Step 4b — Write `themes/<id>.demo.tsx`

The demo is a normal page module — same shape as `pages/<id>/index.tsx`, just sitting under `themes/` so the runtime knows it's preview-only.

Contract:

- `import type { PageMeta } from '@autono/open-pages';` and React hooks as needed.
- **One default-exported component** — a single scrolling page that exercises the theme: nav, hero with both buttons, a section with a card grid, a footer.
- Inline the **same** fixed components defined in the theme markdown — verbatim, no abstractions. Demo and markdown must stay in lockstep so what `create-page` pastes matches what the demo shows.
- Root element sets `min-h-screen`, the theme background, and text color. Must look right at Mobile (390px) as well as Desktop.
- Content should be plausible and realistic, not lorem ipsum. Self-contained: no `@/` imports, no page-local assets; if the theme names a Google Font, render the `<link>` tag in the demo too.

## Step 5 — Self-review

- [ ] Palette table covers background / surface / text / muted / accent / border as Tailwind utilities, with hex where fixed.
- [ ] Frontmatter has `name` and `description` only (the runtime reads nothing else).
- [ ] Typography names only fonts the theme explains how to load (or the system stack).
- [ ] Layout specifies container width, section rhythm, and breakpoints.
- [ ] Fixed components are paste-ready React JSX (`className`, typed props, no `@/` imports) and cover nav, hero, section, buttons, card, footer.
- [ ] Aesthetic paragraph names a single coherent direction.
- [ ] Both files written: `themes/<id>.md` and `themes/<id>.demo.tsx`. No page changes, no config changes.
- [ ] Demo `.tsx` default-exports one component and inlines the same fixed components as the markdown; contrast holds; nothing overflows on mobile.

## Step 6 — Hand off

Tell the user:

- The theme id and the two file paths.
- That the Themes panel in the workspace (`http://localhost:5173/themes`) previews the demo live, and `/create-page` will list the theme as a picker option on its next run.
- A one-line summary of the look (palette + aesthetic).

Do not run the dev server. Do not modify real pages — the demo `.tsx` is the demonstration.

## Anti-patterns

- ❌ Writing executable code in `themes/<id>.md` outside the labeled component snippets — the markdown is documentation.
- ❌ Producing only the markdown without the demo, or only the demo without the markdown. A theme is the **bundle** — both files, every time.
- ❌ Desktop-only components: a nav with no mobile behaviour, grids with no stacking fallback.
- ❌ Naming font families the theme never explains how to load.
- ❌ Inventing palette / styling when the user supplied images or an existing page. Extract, don't fabricate.
- ❌ Editing `pages/`, `packages/`, `package.json`, or `open-pages.config.ts`.
- ❌ Skipping Fixed components. Nav, hero, buttons, and footer are the most common reuse targets — they must be paste-ready.
