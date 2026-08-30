# Typography and color

## Type scale (web)

| Role | Tailwind | Notes |
| --- | --- | --- |
| Hero heading | `text-5xl sm:text-7xl font-bold leading-[1.02] tracking-tight` | one per page |
| Page / section heading | `text-3xl sm:text-4xl font-bold tracking-tight` | |
| Subsection | `text-xl font-semibold` | |
| Lede | `text-lg sm:text-xl text-muted-foreground` | under the hero heading |
| Body | `text-base leading-relaxed` (16px) | never smaller for running copy |
| Secondary | `text-sm text-muted-foreground` | captions, metadata, table cells |
| Eyebrow / label | `text-xs font-semibold uppercase tracking-[0.2em]` or `<Badge variant="secondary">` | above headings |
| Code | `font-mono text-[0.9em] bg-muted rounded px-1` | |

- Line-height: tight (`leading-[1.05]`–`leading-tight`) for display sizes,
  `leading-relaxed` (1.625) for body.
- Measure: cap prose at `max-w-[65ch]` / `max-w-2xl`.
- Numbers in tables and prices: `tabular-nums`.
- Fonts: `--font-sans` from the tokens is the default (system stack unless a
  theme sets it). Load a display or brand font only when the user names one
  or a theme requires it — see `assets-and-fonts.md`.

## The token system

`styles/globals.css` defines the shadcn tokens in OKLCH for `:root` (light)
and `.dark`, and exposes them as utilities through `@theme inline`. Pages
and `ui/` components read the utilities; themes rewrite the values.

| Token pair | Utilities | Use for |
| --- | --- | --- |
| `--background` / `--foreground` | `bg-background text-foreground` | page root |
| `--card` / `--card-foreground` | `bg-card text-card-foreground` | panels, `<Card>` |
| `--popover` / `--popover-foreground` | `bg-popover` | menus, popovers (used by `ui/`) |
| `--primary` / `--primary-foreground` | `bg-primary text-primary-foreground` | the one accent: primary CTA, active state |
| `--secondary` / `--secondary-foreground` | `bg-secondary` | secondary buttons, badges |
| `--muted` / `--muted-foreground` | `bg-muted text-muted-foreground` | subdued surfaces, secondary copy |
| `--accent` / `--accent-foreground` | `bg-accent` | hover surfaces, selected rows |
| `--destructive` | `text-destructive`, `<Button variant="destructive">` | delete, errors |
| `--border`, `--input`, `--ring` | `border-border`, `border-input`, `ring-ring` | dividers, field borders, focus |
| `--chart-1`…`--chart-5` | `text-chart-1`, `fill-chart-1` | `<Chart>` series |
| `--sidebar*` | `bg-sidebar` … | `<Sidebar>` shell |
| `--radius` | `rounded-sm`…`rounded-2xl` | all radii scale from one value |

- Always use a pair together: a `bg-primary` without `text-primary-foreground`
  breaks the moment a theme changes the primary hue.
- Opacity modifiers work on tokens: `bg-primary/10` for a tinted band,
  `border-border/60` for a softer rule.
- Dark pages: put `dark` on the root element's `className`. Every token flips;
  no manual `dark:` prefixes needed unless a single element must differ.
- Dark *sections* on a light page: wrap the section in `<div className="dark bg-background text-foreground">`.
- Raw palette classes (`bg-emerald-400`, `text-slate-600`) are for deliberate
  brand moments a theme should not repaint — a neon launch button, a
  gradient hero. Keep them rare and keep them out of `ui/` components.

## Contrast

- Body text ≥ 4.5:1 against its background; large headings ≥ 3:1. The token
  pairs pass by construction; `text-muted-foreground` is the floor for
  secondary copy.
- Do not dim below the floor with opacity: `text-foreground/40` and
  `text-white/30` fail. Decorative metadata at most `text-muted-foreground/80`.
- Accent text on light backgrounds must be the darker shade a theme sets for
  `--primary`; on dark, the lighter one. Never `bg-primary` text on
  `bg-background` without checking.
- Links inside prose: `underline underline-offset-4`, not color alone.

## Anti-patterns

- ❌ Body text under 16px, or `text-xs` for anything the user must read.
- ❌ Three font families. Two is the ceiling (display + body).
- ❌ Hardcoding a palette per page (`bg-white text-slate-900` everywhere)
  when `bg-background text-foreground` exists — the page silently opts out of
  every theme.
- ❌ `dark:bg-…` sprinkled on every element instead of one `dark` on the root.
- ❌ Gradient text, drop shadows, and glows on every heading. One flourish, once.
- ❌ Palette drift: a new grey shade every section. There are `muted`,
  `card`, and `background`; that is the whole grey scale.
