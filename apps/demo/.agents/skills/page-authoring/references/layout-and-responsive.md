# Layout and responsive design

The viewer previews every page at three widths — **Desktop** (the full
viewport), **Tablet** (820px), and **Mobile** (390px). A page is done when all
three look intentional. Tailwind is mobile-first: unprefixed utilities are the
phone layout; `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)
layer larger layouts on top.

## Containers

```tsx
<section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">…</section>
```

- Center content with `mx-auto max-w-*`; keep horizontal padding (`px-6`) so
  text never touches the viewport edge on mobile.
- Reading columns: `max-w-2xl` / `max-w-[65ch]` for prose. Marketing grids:
  `max-w-5xl`–`max-w-7xl`.
- Vertical rhythm: `py-16` between sections on mobile, `sm:py-24` on desktop.
  Sections separate by space or a hairline (`border-t border-slate-200`), not
  both.

## Grids and stacks

```tsx
<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {features.map((f) => <FeatureCard key={f.title} {...f} />)}
</div>
```

- Default to a single column, add columns at `sm:`/`lg:`.
- `flex flex-col gap-4 sm:flex-row sm:items-center` for header rows that must
  stack on phones.
- Use `gap-*`, not margins on children, for spacing inside grids and flex rows.

## Navigation

- Desktop nav links: `hidden sm:flex gap-8`. On mobile either show a compact
  set of links, or a `<button aria-expanded>` that toggles a stacked menu with
  `useState`. Never let a nav overflow horizontally.
- Sticky headers: `sticky top-0 z-10 bg-white/90 backdrop-blur` — give them a
  background so content does not bleed through.

## Hero

- Heading `text-4xl sm:text-6xl lg:text-7xl`, `leading-[1.05] tracking-tight`.
- Constrain the heading (`max-w-3xl`) and the lede (`max-w-xl`) independently.
- CTA row: `flex flex-col gap-3 sm:flex-row` so buttons stack on mobile.

## Full-viewport pages (dashboards, app UIs)

- Root: `min-h-screen` (not `h-screen`) so content can scroll.
- Sidebars: `hidden lg:block w-64` plus a mobile alternative (top tabs or a
  toggle). Content area: `min-w-0 flex-1` so tables and code blocks can shrink.
- Wide content (tables, charts) scrolls inside its own `overflow-x-auto`
  wrapper; the page body must never scroll horizontally.

## Checklist

- [ ] Mobile: no horizontal scrollbar, every grid stacks, headings shrink.
- [ ] Tablet: two-column layouts where three would cramp.
- [ ] Desktop: content is capped by a `max-w-*`, not stretched edge to edge.
- [ ] Touch targets ≥ 40px tall on mobile (`py-2.5` on buttons and links).

## Anti-patterns

- ❌ Fixed pixel widths on layout containers (`w-[1200px]`).
- ❌ `absolute` positioning for layout (fine for badges, overlays, decoration).
- ❌ `h-screen` on scrolling pages; `overflow-hidden` on `body`/root.
- ❌ Grids with no mobile fallback (`grid-cols-4` alone).
- ❌ Text sized only for desktop (`text-7xl` with no smaller base).
