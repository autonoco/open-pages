# Layout and responsive design

The viewer previews every page at three widths — **Desktop** (the full
viewport), **Tablet** (820px), and **Mobile** (390px). A page is done when all
three look intentional. Tailwind is mobile-first: unprefixed utilities are the
phone layout; `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)
layer larger layouts on top. `useIsMobile()` from `@/hooks/use-mobile` is
available when JS must know (swap a `<Sheet>` for a `<Drawer>`, collapse a
table into cards).

## Containers

```tsx
<section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">…</section>
```

- Center content with `mx-auto max-w-*`; keep horizontal padding (`px-6`) so
  text never touches the viewport edge on mobile.
- Reading columns: `max-w-2xl` / `max-w-[65ch]` for prose. Marketing grids:
  `max-w-5xl`–`max-w-7xl`.
- Vertical rhythm: `py-16` between sections on mobile, `sm:py-24` on desktop.
  Sections separate by space or a hairline (`border-t border-border`, or a
  `<Separator />`), not both.

## Grids and stacks

```tsx
<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {features.map((f) => (
    <Card key={f.title}>
      <CardHeader><CardTitle>{f.title}</CardTitle></CardHeader>
      <CardContent className="text-muted-foreground">{f.body}</CardContent>
    </Card>
  ))}
</div>
```

- Default to a single column, add columns at `sm:`/`lg:`.
- `flex flex-col gap-4 sm:flex-row sm:items-center` for header rows that must
  stack on phones.
- Use `gap-*`, not margins on children, for spacing inside grids and flex rows.
- Tabular data is `<Table>` from `@/ui/table` inside an `overflow-x-auto`
  wrapper; on mobile either let it scroll or render a card list.

## Navigation

- Marketing header: wordmark + `<NavigationMenu>` (or plain links) with
  `hidden sm:flex`, one `<Button>` CTA. On mobile, a `<Sheet side="left">`
  opened by an icon `<Button variant="ghost" size="icon" aria-label="Menu">`
  holding the stacked links. Never let a nav overflow horizontally.
- Sticky headers: `sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border`.
- Sub-navigation and hierarchy: `<Breadcrumb>`, `<Tabs>`, `<Pagination>`.

## Hero

- Heading `text-4xl sm:text-6xl lg:text-7xl`, `leading-[1.05] tracking-tight`.
- Constrain the heading (`max-w-3xl`) and the lede (`max-w-xl`) independently.
- CTA row: `flex flex-col gap-3 sm:flex-row` with `<Button size="lg">` and
  `<Button size="lg" variant="outline">` so buttons stack on mobile.

## App shells (dashboards, tools, docs)

- Root: `min-h-screen` (not `h-screen`) so content can scroll.
- Sidebar layouts use `@/ui/sidebar`: wrap the page in `<SidebarProvider>`,
  render `<Sidebar>` + `<SidebarInset>`; it collapses to a sheet on mobile by
  itself and gives you `<SidebarTrigger />` for the topbar. Do not hand-roll
  a `hidden lg:block w-64` aside when this exists.
- Split panes (editor + preview, list + detail): `@/ui/resizable`
  (`ResizablePanelGroup` / `ResizablePanel` / `ResizableHandle`); stack them
  (`direction="vertical"`) or render one pane at a time on mobile via
  `useIsMobile()`.
- Content area: `min-w-0 flex-1` so tables and code blocks can shrink. Wide
  content scrolls inside its own `overflow-x-auto` wrapper (or
  `<ScrollArea>`); the page body must never scroll horizontally.
- Loading and empty states: `<Skeleton>` while data arrives, `<Empty>` when
  there is none.

## Checklist

- [ ] Mobile: no horizontal scrollbar, every grid stacks, headings shrink, nav collapses into a sheet or wraps.
- [ ] Tablet: two-column layouts where three would cramp.
- [ ] Desktop: content is capped by a `max-w-*`, not stretched edge to edge.
- [ ] Touch targets ≥ 40px tall on mobile (`<Button size="lg">` or `py-2.5` on links).

## Anti-patterns

- ❌ Fixed pixel widths on layout containers (`w-[1200px]`).
- ❌ `absolute` positioning for layout (fine for badges, overlays, decoration).
- ❌ `h-screen` on scrolling pages; `overflow-hidden` on `body`/root.
- ❌ Grids with no mobile fallback (`grid-cols-4` alone).
- ❌ Text sized only for desktop (`text-7xl` with no smaller base).
- ❌ A hand-built sidebar or drawer when `@/ui/sidebar`, `<Sheet>`, or `<Drawer>` fits.
