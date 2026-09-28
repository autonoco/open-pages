---
name: Autono
description: Warm paper, ink type, one seal-red accent, serif headings. The Autono brand as tokens.
---

# Autono

## Tokens

| Token | Light | Dark | Role in pages |
| --- | --- | --- | --- |
| `--background` / `--foreground` | `oklch(0.977 0.01 87.5)` / `oklch(0.214 0.004 84.6)` | `oklch(0.186 0.004 106.8)` / `oklch(0.959 0.013 86.8)` | page root (`bg-background text-foreground`): warm paper with ink, or the dark desk with paper-coloured type |
| `--primary` / `--primary-foreground` | `oklch(0.554 0.181 32.4)` / `oklch(0.977 0.01 87.5)` | `oklch(0.636 0.174 34.7)` / `oklch(0.186 0.004 106.8)` | the seal: the one accent for CTAs, active tabs, focus, links |
| `--card`, `--muted`, `--secondary`, `--accent` | `oklch(1 0 0)`, `oklch(0.947 0.013 86.8)`, `oklch(0.929 0.016 86.4)`, `oklch(0.932 0.021 39.4)` | `oklch(0.23 0.006 106.8)`, `oklch(0.255 0.006 106.8)`, `oklch(0.263 0.011 99.3)`, `oklch(0.287 0.007 67.5)` | surfaces: cards are white sheets on the paper; muted and secondary are deeper paper; accent is a faint seal tint for hover and selection |
| `--muted-foreground` | `oklch(0.515 0.013 84.6)` | `oklch(0.719 0.014 86.8)` | supporting copy, metadata, table cells |
| `--border`, `--input`, `--ring` | `oklch(0.91 0.01 87.5)` ×2, `oklch(0.554 0.181 32.4)` | `oklch(0.281 0.006 91.6)` ×2, `oklch(0.636 0.174 34.7)` | hairline rules, field borders, seal focus ring |
| `--destructive` | `oklch(0.554 0.181 32.4)` | `oklch(0.636 0.174 34.7)` | delete and errors share the seal; the label, not a second red, tells them apart |
| `--chart-1…5` | seal, ink, chrome, light seal, dark seal | light seal, paper, mid grey, seal, light chrome | series order: the brand accent leads, neutrals follow |
| `--radius` | `0.375rem` | | tight corners on everything; no pill buttons |

The full set lives in `themes/autono.css`; this table is the reference for what each value is *for*. The dark block is the marketing site's desk (`#131311`) with paper-coloured type, not an inverted light palette.

## Typography

- Fonts: `--font-sans` Inter (400/500/600), `--font-heading` Source Serif 4 (500/600), `--font-mono` JetBrains Mono (400/500), all loaded by the Google Fonts `@import` at the top of the CSS.
- Headings are serif: `font-heading font-semibold tracking-tight` on every `h1`–`h3`. Hero `text-5xl sm:text-6xl leading-[1.05]`; section `text-3xl sm:text-4xl`; card titles `text-xl`.
- Body stays Inter: `text-base leading-relaxed`, ledes `text-lg text-muted-foreground`, and metadata `text-sm text-muted-foreground`.
- Eyebrows are small caps in the seal: `text-xs font-semibold uppercase tracking-[0.2em] text-primary`, or `<Badge variant="outline">` when they sit on a card.
- Code and identifiers use `font-mono text-[0.9em] bg-muted rounded px-1`; the mono face is part of the brand, so product names, ids, and file paths are set in it.

## Layout

- Container: `mx-auto max-w-5xl px-6`; section rhythm `py-20 sm:py-24`; sections separated by `border-t border-border`, never by background bands.
- Default mode: light. Use one dark section per page at most (`<div className="dark bg-background text-foreground">`), typically the closing CTA, so the desk and the paper both appear.
- Density: standard. Card grids `gap-6`, form rows `gap-3`, prose capped at `max-w-[62ch]`.

## Components in this theme

- Buttons: one `<Button size="lg">` per screen for the primary action; `<Button size="lg" variant="outline">` for the alternative; `variant="ghost"` inside cards and tables. Keep the default radius; no `rounded-full`.
- Cards: `<Card>` is a white sheet with a hairline `border-border` and no shadow. On the dark section it reads as the desk edge automatically.
- Nav: a slim header, wordmark in `font-heading`, three to five text links, one outline button. Sticky with `bg-background/90 backdrop-blur` if the page is long. `<Sheet>` for mobile.
- Data: `<Table>` with `tabular-nums`; status as `<Badge variant="secondary">` for neutral states and `<Badge>` (seal) for the one state that needs attention. Charts use `--chart-*` in order so the seal leads.
- Forms: `<Field>` + `<Input>` with the seal focus ring; helper text `text-sm text-muted-foreground`.
- Feedback: `<Alert>` with `variant="default"` for notes; `sonner` toasts. Errors use `text-destructive`, which is the seal, so pair them with an icon.
- Avoid: gradients, drop shadows, glows, a second accent hue, pill shapes, oversized rounded corners, and sans-serif display headings.

## Email

- `components/email/theme-autono.ts` exports `autonoTheme`, generated from this CSS. Emails pass it to `createEmailTailwindConfig` or to an emailcn section's `theme` prop; the seal becomes the CTA fill and the paper the body.
- Headings in email keep the serif: wrap the document's `<Head>` with a `<Font fontFamily="Source Serif 4" fallbackFontFamily="Georgia">` and set `font-serif` (or an explicit `fontFamily` style) on `<Heading>`; Gmail will show Georgia, which still reads as the brand.
- Footer: Miami plus `bobak@autono.co` in the mono face, and an unsubscribe link on anything that is not transactional.

## Aesthetic

A printed sheet on a dark desk. Warm off-white paper, ink-black type, hairline rules instead of shadows, and a single seal-red mark where the eye should land. Serif headings carry the editorial, hand-set feel of the Autono site and docs; Inter body and JetBrains Mono details keep it a tool, not a magazine. Generous whitespace, tight corners, nothing decorative. When in doubt, remove colour rather than add it: one seal per screen.

## Example usage

```tsx
export const meta: PageMeta = { title: 'Autono — Agents that ship', theme: 'autono', createdAt: '…' };

<main className="min-h-screen bg-background text-foreground antialiased">
  <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
    <span className="font-heading text-xl font-semibold">Autono</span>
    <Button variant="outline">Book a call</Button>
  </header>
  <section className="mx-auto max-w-5xl px-6 py-24">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Agentic solutions</p>
    <h1 className="mt-4 font-heading text-5xl font-semibold tracking-tight sm:text-6xl">Agents that ship real work.</h1>
    <Button size="lg" className="mt-8">Start a project</Button>
  </section>
  <div className="dark bg-background text-foreground">
    <section className="mx-auto max-w-5xl px-6 py-20">…closing CTA…</section>
  </div>
</main>
```
