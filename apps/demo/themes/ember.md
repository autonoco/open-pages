---
name: Ember
description: Warm paper background, burnt-orange primary, tight radius, Instrument Sans.
---

# Ember

## Palette

| Token | Value | Notes |
| --- | --- | --- |
| background | `oklch(0.99 0.01 80)` | warm off-white paper |
| foreground | `oklch(0.2 0.02 40)` | near-black with a brown cast |
| primary | `oklch(0.62 0.19 35)` | burnt orange, buttons and links |
| accent | `oklch(0.93 0.05 60)` | soft apricot fills |
| border | `oklch(0.9 0.02 70)` | hairlines |
| radius | `0.375rem` | tight corners, no pills |

## Typography

- Font: Instrument Sans (Google Fonts, imported in `ember.css`) on `--font-sans`.
- Headings: `font-semibold tracking-tight`, 36–56px on desktop.
- Body: 16–18px, `leading-relaxed`, `text-muted-foreground` for supporting copy.

## Components

- Buttons: default variant for the single primary action; `variant="outline"` for everything else.
- Cards: `bg-card border-border`, no shadows.
- Badges: `variant="secondary"` for eyebrows.

## Aesthetic

Editorial and warm. Generous whitespace, one accent color, hairline rules instead of shadows. No gradients, no glassmorphism.
