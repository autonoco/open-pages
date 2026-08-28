# Typography and color

## Type scale (web)

| Role | Tailwind | Notes |
| --- | --- | --- |
| Hero heading | `text-5xl sm:text-7xl font-bold leading-[1.02] tracking-tight` | one per page |
| Page / section heading | `text-3xl sm:text-4xl font-bold tracking-tight` | |
| Subsection | `text-xl font-semibold` | |
| Lede | `text-lg sm:text-xl text-<muted>` | under the hero heading |
| Body | `text-base leading-relaxed` (16px) | never smaller for running copy |
| Secondary | `text-sm text-<muted>` | captions, metadata, table cells |
| Eyebrow / label | `text-xs font-semibold uppercase tracking-[0.2em]` | above headings |
| Code | `font-mono text-[0.9em]` with a subtle background | |

- Line-height: tight (`leading-[1.05]`–`leading-tight`) for display sizes,
  `leading-relaxed` (1.625) for body.
- Measure: cap prose at `max-w-[65ch]` / `max-w-2xl`.
- Numbers in tables and prices: `tabular-nums`.
- Fonts: the system stack is the default and is fine. Register a display or
  brand font only when the user names one — see `assets-and-fonts.md`.

## Palette structure

One page, one palette. Name the roles up front and reuse them literally:

| Role | Light example | Dark example |
| --- | --- | --- |
| background | `bg-white` | `bg-[#0b0b10]` |
| surface | `bg-slate-50` / `bg-white` cards with `border-slate-200` | `bg-white/[0.04]` with `border-white/10` |
| text | `text-slate-900` | `text-white` |
| muted | `text-slate-600` (never lighter than `slate-500` on white) | `text-white/60` |
| accent | one hue, one shade for fills (`bg-indigo-600`) and one for text (`text-indigo-600`) | `bg-emerald-400 text-black` |
| border | `border-slate-200` | `border-white/10` |

- Define the palette as repeated utilities or as a small `const` map of class
  strings when a page uses many surfaces. Do not build class names at runtime.
- Accent is for actions and one highlight per screen. Two accents means no
  accent.
- Dark pages: prefer near-black (`#0b0b10`, `#111`) over pure black; lift
  surfaces with translucent white (`bg-white/[0.03]`), not grey hex soup.

## Contrast

- Body text ≥ 4.5:1 against its background; large headings ≥ 3:1.
- Muted text on white: `slate-500` is the floor. On dark: `white/60` is the
  floor; `white/40` only for decorative metadata.
- Accent text on white must be a 600+ shade (`indigo-600`, `emerald-700`).
  `emerald-400` text on white fails.
- Links inside prose: underline or a clearly different color, not color alone
  at low contrast.

## Anti-patterns

- ❌ Body text under 16px, or `text-xs` for anything the user must read.
- ❌ Three font families. Two is the ceiling (display + body).
- ❌ Pure black on pure white for long text (`text-slate-900` on white reads
  better); pure white on pure black for dark pages.
- ❌ Gradient text, drop shadows, and glows on every heading. One flourish, once.
- ❌ Palette drift: a new grey shade every section.
