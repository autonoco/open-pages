---
name: create-theme
description: Use this skill when the user wants to create, draft, author, or extract a document theme in this open-pdf repo. Triggers on phrases like "create a theme", "make a theme called X", "extract a theme from <doc>", "build a theme from these images". Produces two paired files under `themes/` — `<id>.md` (palette, typography, layout, fixed components) and `<id>.demo.tsx` (a runnable demo doc; the dev-UI Themes panel will preview it once demo previews are re-enabled). Do NOT use for editing real docs — only for authoring the theme bundle.
---

# Create a document theme

This skill produces a **theme bundle** under `themes/`: two paired files that together describe a reusable visual identity for PDF documents.

1. `themes/<id>.md` — agent-facing documentation: palette, typography, layout, fixed components (letterhead, footer band, callout). This is what `create-doc` reads when an author picks the theme.
2. `themes/<id>.demo.tsx` — a runnable mini-doc (same module shape as `docs/<id>/index.tsx`: **one default-exported component** plus `pageOptions`) that demonstrates the theme on 1–2 pages. The dev-UI Themes panel currently shows a placeholder card for demos; previews are being re-enabled, so keep the demo valid regardless.

Both files share the same stem so the runtime can pair them automatically.

The theme markdown is authoring-time direction — `create-doc` copies its palette, utilities, and components into a real doc's source. The demo `.tsx` is a self-contained preview, not a real doc — it does not appear in the docs list.

You only write `themes/<id>.md` and `themes/<id>.demo.tsx`. Never modify real docs or configuration. The dialect and print defaults that themes override live in the **`doc-authoring`** skill — read it before writing the theme so your overrides are stated explicitly.

## Step 1 — Identify the input source

A theme can be derived from any combination of three input shapes:

- **Image references** — paths or URLs to document screenshots, mood-board images, brand assets.
- **Free-text description** — prose describing the desired palette, weight, feel.
- **An existing doc** — `docs/<id>/index.tsx` whose visual identity should be lifted out into a reusable theme.

If the user's original message already specifies the inputs unambiguously, skip the question and proceed. Otherwise call `AskUserQuestion` (multi-select) so they can pick one or more sources, and ask follow-ups (paths, doc id, prose) only as needed.

## Step 2 — Gather raw inputs

- **Images**: read each path with the `Read` tool (it accepts images). Note dominant colors as hex, type weight, ruling style (hairlines vs heavy bars), table styling, and recurring chrome (letterhead, footer line).
- **Text**: extract explicit tokens (hex codes, tone words) and resolve vague language into concrete decisions before writing.
- **Existing doc**: read `docs/<id>/index.tsx` and pull:
  - The Tailwind color utilities used consistently (`text-slate-900`, accent classes) → Palette section.
  - Type sizes (`text-[11px]`, heading sizes) → Typography section.
  - `pageOptions` (size, margins, header/footer bands) → Layout + Fixed components.
  - Recurring helper components (callout boxes, key-value rows, signature blocks) → Fixed components section.
  - The aesthetic feel implied → Aesthetic paragraph.

When inputs disagree (e.g. images use blue but the description says green), ask the user which to honor.

## Step 3 — Pick a theme id

Use **kebab-case**, short, descriptive. Examples: `ledger-classic`, `saas-clean`, `compliance-formal`, `field-guide`. Check `themes/` to avoid collisions.

## Step 4 — Write `themes/<id>.md`

Produce a file with this exact section order. Section bodies adapt to the theme; the headings stay consistent across all themes.

````markdown
---
name: <Human title, e.g. "Classic Ledger">
description: <one-line elevator pitch>
---

# <Theme name>

## Palette

| Role | Tailwind | Notes |
| --- | --- | --- |
| text | `text-slate-900` | primary copy |
| muted | `text-slate-500` | secondary copy, labels |
| accent | `text-indigo-600` | doc number, links, key figures |
| rule | `border-slate-300` | table borders, dividers |
| band | `bg-slate-100` | table header fill, callout fill |

## Typography

- Font: engine default, or a font file the doc registers via `pageOptions.fonts` (name the family and tell `create-doc` where the file must live).
- Type-scale overrides (only list what differs from `doc-authoring` defaults):
  - Document title: 30px, `font-bold tracking-tight`
  - Section heading: 16px, `font-bold`
  - Body: 11.5px, `leading-relaxed`

## Layout

- Page: `size: 'a4'`, margins `{ top: 56, right: 64, bottom: 72, left: 64 }`.
- Section rhythm: `mt-8` between sections, hairline `border-b border-slate-200` under section headings.
- Alignment: left-aligned; numbers right-aligned.

## Fixed components

These are paste-ready Takumi-dialect JSX. Copy them verbatim into a doc that uses this theme.

### Letterhead

```tsx
const Letterhead = ({ company, lines }: { company: string; lines: string[] }) => (
  <div tw="flex flex-col">
    <span tw="text-[20px] font-bold text-slate-900">{company}</span>
    {lines.map((l) => (
      <span key={l} tw="text-slate-500">{l}</span>
    ))}
  </div>
);
```

### Footer band (goes in `pageOptions.footer`, not in content)

```tsx
footer: (
  <div tw="flex w-full items-center justify-between text-[9px] text-slate-400">
    <span>{'<company>'}</span>
    <span tw="flex">Page <PageNumber /> of <TotalPages /></span>
  </div>
),
```

### Callout (optional)

```tsx
const Callout = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div tw="mt-8 flex flex-col rounded bg-slate-50 p-4 text-[10px] text-slate-600" style={{ breakInside: 'avoid' }}>
    <span tw="font-bold text-slate-700">{title}</span>
    {children}
  </div>
);
```

## Aesthetic

One paragraph. What it feels like, the references it draws on, what to avoid (e.g. "no rounded corners; no color fills except the table band; hairline rules only"). Commit to a single direction.

## Example usage

```tsx
<main tw="flex flex-col text-[11.5px] leading-relaxed text-slate-900">
  <Letterhead company="Meridian Systems LLC" lines={['2201 Biscayne Blvd', 'Miami, FL 33137']} />
  <h1 tw="mt-8 text-[30px] font-bold tracking-tight">Services Proposal</h1>
  {/* … */}
</main>
```
````

## Step 4b — Write `themes/<id>.demo.tsx`

The demo is a normal doc module — same shape as `docs/<id>/index.tsx`, just sitting under `themes/` so the runtime knows it's preview-only.

Contract:

- `import { type DocMeta, PageNumber, type PageOptions, TotalPages } from '@autono/open-pdf';` as needed.
- **One default-exported component** (flowing content, 1–2 pages worth) plus `export const pageOptions` using the theme's page setup and footer band.
- Inline the **same** fixed components defined in the theme markdown — verbatim, no abstractions. Demo and markdown must stay in lockstep so what `create-doc` pastes matches what the demo shows.
- Content should exercise the theme's range: letterhead, a heading, a short table, a callout. Use plausible realistic content, not lorem ipsum.
- Self-contained: no `@/` imports; engine-default font unless the theme ships a font file the demo can reference.

## Step 5 — Self-review

- [ ] Palette table covers text / muted / accent / rule / band as Tailwind utilities.
- [ ] Frontmatter has `name` and `description` only (the runtime reads nothing else).
- [ ] Typography names only fonts the theme actually registers (or the engine default).
- [ ] Layout specifies `pageOptions` size + margins.
- [ ] Fixed components are paste-ready Takumi-dialect JSX (`tw` prop, no `className`, no hooks) and the footer band uses `<PageNumber/>`/`<TotalPages/>` inside `pageOptions`.
- [ ] Aesthetic paragraph names a single coherent direction.
- [ ] Both files written: `themes/<id>.md` and `themes/<id>.demo.tsx`. No doc changes, no config changes.
- [ ] Demo `.tsx` default-exports one component (not an array) and inlines the same fixed components as the markdown.

## Step 6 — Hand off

Tell the user:

- The theme id and the two file paths.
- That `/create-doc` will list the theme as a picker option on its next run.
- A one-line summary of the look (palette + aesthetic).

Do not run the dev server. Do not modify real docs — the demo `.tsx` is the demonstration.

## Anti-patterns

- ❌ Writing executable code in `themes/<id>.md` outside the labeled component snippets — the markdown is documentation.
- ❌ Producing only the markdown without the demo, or only the demo without the markdown. A theme is the **bundle** — both files, every time.
- ❌ Slide-era shapes in the demo: page arrays, fixed-size page `<div>`s, `className`, hooks.
- ❌ Naming font families the theme never registers.
- ❌ Inventing palette / styling when the user supplied images or an existing doc. Extract, don't fabricate.
- ❌ Editing `docs/`, `packages/`, `package.json`, or `open-pdf.config.ts`.
- ❌ Skipping Fixed components. The letterhead and footer band are the most common reuse targets — they must be paste-ready.
