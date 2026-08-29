---
name: create-theme
description: Use this skill when the user wants to create, draft, author, or extract a theme in this open-pages repo. Triggers on phrases like "create a theme", "make a theme called X", "extract a theme from <page>", "match our brand", "build a design system from these screenshots", "apply this shadcn preset". Produces a three-file bundle under `themes/` — `<id>.md` (direction, fonts, component notes, token table), `<id>.css` (the shadcn token overrides), and `<id>.demo.tsx` (a demo page composed from `ui/` components that the workspace's Themes panel previews live). Do NOT use for editing real pages — only for authoring the theme bundle.
---

# Create a theme

A theme is a **token set**. Every workspace ships the full shadcn/ui set under `ui/`, and every component reads its colors, radius, and fonts from the CSS variables in `styles/globals.css` (`--background`, `--primary`, `--radius`, …). A theme overrides those variables; every component and every token-styled page restyles at once. Nothing is copied into pages.

The bundle is three files sharing one stem under `themes/`:

1. `themes/<id>.md` — agent-facing direction: aesthetic, fonts, how to use the components in this theme, and a table of token → value. This is what `create-page` reads when an author picks the theme.
2. `themes/<id>.css` — **only** `:root { … }` and `.dark { … }` blocks overriding the shadcn tokens (plus an optional Google Fonts `@import url(…)` at the very top). No `@theme` block, no Tailwind import, no selectors beyond those two.
3. `themes/<id>.demo.tsx` — a runnable page module (same shape as `pages/<id>/index.tsx`, **one default-exported component**) composed from `@/ui/*` components so the tokens are shown on real parts. The Themes panel renders it with `<id>.css` injected automatically; the demo does not set `meta.theme`.

A page opts in with `meta.theme: '<id>'`; the runtime injects `themes/<id>.css` into that page's preview frame and into its export.

You only write the three theme files. Never modify pages, `ui/`, `styles/globals.css`, or configuration. The token names and how pages consume them live in the **`page-authoring`** skill (`references/typography-and-color.md`) — read it first. Component props and variants: the **`shadcn`** skill.

## Step 1 — Identify the input source

A theme can be derived from any combination of:

- **A shadcn preset** — a code or URL from https://ui.shadcn.com/create. `npx shadcn@latest preset decode <code>` prints its tokens; or run `npx shadcn@latest apply <code> --only theme,font` in a scratch copy and lift the resulting `:root`/`.dark` values. Never run `apply` against the workspace's `styles/globals.css` directly — that changes the default for every page.
- **Image references / brand guidelines** — paths or URLs to screenshots, mood boards, logo files, a brand PDF. You will translate them into OKLCH tokens.
- **Free-text description** — prose describing the desired palette, weight, feel.
- **An existing page** — `pages/<id>/index.tsx` whose look should become reusable.

If the user's original message already specifies the inputs unambiguously, skip the question and proceed. Otherwise call `AskUserQuestion` (multi-select) so they can pick one or more sources, and ask follow-ups (paths, preset code, page id, prose) only as needed.

## Step 2 — Gather raw inputs

- **Preset**: take its tokens as the baseline; adjust only what the user asked to change.
- **Images**: read each path with the `Read` tool (it accepts images). Note dominant colors (write them as hex, then convert to OKLCH), type family feel, corner radius, surface treatment (flat vs. cards vs. borders), light or dark default, and chrome (nav style, footer).
- **Text**: extract explicit values (hex codes, font names, "rounded", "sharp", "dense") and resolve vague language into concrete decisions before writing.
- **Existing page**: read `pages/<id>/index.tsx` (and `components/`) and pull any raw palette classes or hex values into token roles (the page's `bg-[#0b0b10]` root → `--background`; its CTA fill → `--primary`; its card border → `--border`), plus fonts and radius.

Every color ends up as `oklch(L C H)` — the same format as `styles/globals.css`. When inputs disagree (images use blue but the description says green), ask the user which to honor.

## Step 3 — Pick a theme id

Use **kebab-case**, short, descriptive. Examples: `dark-launch`, `clean-saas`, `editorial-warm`, `ops-console`. Check `themes/` to avoid collisions.

## Step 4 — Write `themes/<id>.css`

Override the full token list for both modes, even when a value equals the default, so the file is self-describing:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;700&family=Inter:wght@400;500&display=swap');

:root {
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-heading: 'Inter Tight', var(--font-sans);
  --radius: 0.75rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.55 0.2 265);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.5 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.55 0.2 265);
  --chart-1: oklch(0.55 0.2 265);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.55 0.2 265);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.55 0.2 265);
}

.dark {
  --background: oklch(0.13 0.01 265);
  --foreground: oklch(0.985 0 0);
  /* … every token again, dark values … */
}
```

Rules:

- Exactly the shadcn token names (`--background` … `--sidebar-ring`, `--radius`), plus optionally `--font-sans` / `--font-heading` and the font `@import`. Unknown names do nothing; misspelled names silently fall back to the default.
- `*-foreground` must contrast with its surface (≥ 4.5:1 for body pairs). Check `--muted-foreground` on `--background` and `--primary-foreground` on `--primary` explicitly.
- A dark-first theme still defines `:root` for light; a page that wants dark puts `dark` on its root element. If the theme is dark-only, make both blocks the dark values.
- `--radius` sets every radius (`rounded-sm` … `rounded-2xl` scale from it): `0` sharp, `0.5rem` default-ish, `1rem` soft.
- Fonts load from Google Fonts via `@import url(…)` at the top of this file, or from a self-hosted file the theme tells `create-page` to place under `assets/` (then `@font-face` goes in the page's `styles.css`, not here).

## Step 5 — Write `themes/<id>.md`

Produce a file with this exact section order. Section bodies adapt to the theme; the headings stay consistent across all themes.

````markdown
---
name: <Human title, e.g. "Dark Launch">
description: <one-line elevator pitch>
---

# <Theme name>

## Tokens

| Token | Light | Dark | Role in pages |
| --- | --- | --- | --- |
| `--background` / `--foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | … | page root (`bg-background text-foreground`) |
| `--primary` / `--primary-foreground` | … | … | the one accent: CTAs, active tabs, links |
| `--card`, `--muted`, `--accent`, `--secondary` | … | … | surfaces |
| `--border`, `--input`, `--ring` | … | … | rules, fields, focus |
| `--destructive` | … | … | delete, errors |
| `--chart-1…5` | … | … | chart series order |
| `--radius` | `0.75rem` | | rounded-lg cards, pill buttons via `rounded-full` |

The full set lives in `themes/<id>.css`; this table is the reference for what each value is *for*.

## Typography

- Fonts: `--font-sans` / `--font-heading` set in the CSS (how they load: Google Fonts `@import`, or a self-hosted file under `assets/`).
- Type-scale overrides (only what differs from `page-authoring` defaults): hero `text-5xl sm:text-7xl font-heading tracking-tight`; body `text-lg`; eyebrow `<Badge variant="secondary">`.

## Layout

- Container: `mx-auto max-w-6xl px-6`; section rhythm `py-20`; separators `border-t border-border`.
- Default mode: light | dark (`dark` on the page root).
- Density: airy | standard | dense — how much `gap-*` and padding pages should use.

## Components in this theme

Notes on how to use the `ui/` set so pages feel like this theme — which variants to prefer, what to avoid:

- Buttons: primary CTA `<Button size="lg">`; secondary `<Button size="lg" variant="outline">`; pill shape via `className="rounded-full"` (or not).
- Cards: `<Card>` with `border-border`, no shadow | `shadow-sm`.
- Nav: `<NavigationMenu>` on desktop, `<Sheet>` on mobile; sticky with `bg-background/90 backdrop-blur`.
- Data: `<Table>` + `<Badge>` for status; charts use `--chart-*` in order.
- Feedback: `<Alert>`, `sonner` toasts.
- Avoid: gradients | shadows | more than one accent | … (whatever the theme forbids).

## Aesthetic

One paragraph. What it feels like, the references it draws on, what to avoid. Commit to a single direction.

## Example usage

```tsx
export const meta: PageMeta = { title: '…', theme: '<id>', createdAt: '…' };

<main className="min-h-screen bg-background text-foreground antialiased">
  <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">…<Button>Get started</Button></header>
  <section className="mx-auto max-w-6xl px-6 py-20">…</section>
</main>
```
````

The markdown never contains color values that are not also in the CSS, and never contains paste-ready components with raw colors — pages compose `ui/` and the tokens do the rest.

## Step 6 — Write `themes/<id>.demo.tsx`

The demo is a normal page module — same shape as `pages/<id>/index.tsx`, sitting under `themes/` so the runtime knows it's preview-only.

Contract:

- `import type { PageMeta } from '@autono/open-pages';`, `@/ui/*` imports, React hooks as needed. No `meta.theme` (the runtime injects `<id>.css` for demos).
- **One default-exported component** — a single scrolling page that exercises the tokens on real components: a header with `<Button>`s, a hero, a `<Card>` grid, a `<Tabs>` or `<Accordion>`, a `<Table>` with `<Badge>` status, an `<Input>` + `<Button>` form row, and a footer. Include one dark section (`<div className="dark bg-background text-foreground">`) if the theme is light-first, or one light section if dark-first, so both blocks of the CSS are visible.
- Root element: `min-h-screen bg-background text-foreground` (with `dark` if the theme is dark by default). Everything token-styled — the demo is the proof that pages need no raw colors.
- Realistic content, not lorem ipsum. Must look right at Mobile (390px) as well as Desktop. Self-contained: no page-local assets.

## Step 7 — Self-review

- [ ] `themes/<id>.css` overrides every shadcn token in both `:root` and `.dark`, in OKLCH, with only those two selectors (plus an optional font `@import`).
- [ ] Every `*-foreground` passes contrast on its surface; `--muted-foreground` is readable on `--background`.
- [ ] Frontmatter in the `.md` has `name` and `description` only (the runtime reads nothing else).
- [ ] Typography names only fonts the CSS loads (or the system stack).
- [ ] "Components in this theme" gives variant guidance for buttons, cards, nav, data, feedback.
- [ ] Demo `.tsx` default-exports one component, imports only `@/ui/*`, uses semantic tokens only, shows both modes, nothing overflows on mobile.
- [ ] All three files written with the same stem. No page changes, no `ui/` changes, no `styles/globals.css` changes.

## Step 8 — Hand off

Tell the user:

- The theme id and the three file paths.
- That the Themes panel in the workspace (`http://localhost:5173/themes`) previews the demo live, and `/create-page` will list the theme as a picker option on its next run.
- That any existing page can adopt it by setting `meta.theme: '<id>'` — no other change.
- A one-line summary of the look (accent, mode, radius, fonts).

Do not run the dev server. Do not modify real pages — the demo `.tsx` is the demonstration.

## Anti-patterns

- ❌ Pasting token values into pages, or theme markdown full of `bg-[#hex]` snippets. Tokens live in the CSS; pages stay semantic.
- ❌ `@theme inline`, `@import "tailwindcss"`, `@source`, or selectors other than `:root`/`.dark` in `themes/<id>.css`.
- ❌ Editing `styles/globals.css` or running `npx shadcn apply` against the workspace — that silently rethemes every page.
- ❌ Producing one or two of the three files. A theme is the **bundle** — `.md`, `.css`, `.demo.tsx`, every time.
- ❌ A demo with raw colors or hand-rolled buttons — it must prove the tokens carry the look through `ui/`.
- ❌ Naming font families the CSS never loads.
- ❌ Inventing values when the user supplied a preset, images, or an existing page. Extract, don't fabricate.
- ❌ Editing `pages/`, `ui/`, `packages/`, `package.json`, or `open-pages.config.ts`.
