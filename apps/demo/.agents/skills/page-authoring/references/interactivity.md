# Interactivity

Pages are real React 19 components running in the browser, wrapped in
`StrictMode`. Everything React can do is available; the constraints below
keep pages preview-safe, export-safe, and inspectable. Interactive UI comes
from `ui/` first — `Tabs`, `Accordion`, `Dialog`, `Sheet`, `Drawer`,
`DropdownMenu`, `Popover`, `Tooltip`, `Switch`, `Select`, `Combobox`,
`Command`, `Slider`, `Toggle`, `Collapsible` all ship with keyboard handling
and ARIA wired. Hand-rolled state is for what they do not cover.

## State

```tsx
const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

<Tabs value={billing} onValueChange={(v) => setBilling(v as typeof billing)}>
  <TabsList>
    <TabsTrigger value="monthly">Monthly</TabsTrigger>
    <TabsTrigger value="yearly">Yearly</TabsTrigger>
  </TabsList>
</Tabs>
```

- Keep state local and small: tabs, toggles, accordions, filters, form values.
- Derive, do not duplicate: compute filtered lists with `useMemo` (or inline)
  from the source array and the filter state.
- Controlled vs. uncontrolled: shadcn components accept `defaultValue` for
  fire-and-forget UI and `value` + `onValueChange` (or `open` +
  `onOpenChange`) when the page needs the value.
- When you must hand-roll a toggle, it is a `<Button variant="outline"
  aria-pressed={on}>`; a disclosure carries `aria-expanded` and
  `aria-controls` — or just use `<Collapsible>`.

## Forms

Simple forms: `<form onSubmit>` with `@/ui/field`, `@/ui/input`, `@/ui/label`,
`@/ui/select`, `@/ui/checkbox`, `@/ui/textarea`, `@/ui/button`. Validated
forms: native form state (or your own) presented with `@/ui/field`:

```tsx
import { Button } from '@/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/ui/field';
import { Input } from '@/ui/input';

<form onSubmit={handleSubmit}>
  <FieldGroup>
    <Field>
      <FieldLabel htmlFor="email">Work email</FieldLabel>
      <Input id="email" name="email" type="email" required />
      <FieldDescription>We never share it.</FieldDescription>
      {error && <FieldError>{error}</FieldError>}
    </Field>
    <Button type="submit">Create account</Button>
  </FieldGroup>
</form>
```

- Every input has a label (`<Label htmlFor>` or `<FormLabel>`), a `name`, and
  a sensible `type`/`inputMode`/`autoComplete`.
- No backend exists in the workspace or the export. Either mirror submitted
  values into local state ("Thanks, we'll be in touch"), or point the form at
  a URL the user supplies (`action="https://formspree.io/…" method="post"`).
  Never invent an endpoint.

## Dialogs, sheets, toasts

- Modal confirmation: `<Dialog>` / `<AlertDialog>` with a `<DialogTrigger asChild><Button>…`.
  Side panels: `<Sheet>`; mobile bottom panels: `<Drawer>`.
- Toasts: render `<Toaster />` from `@/ui/sonner` once at the root of the
  page, then `toast('Saved')` / `toast.success(…)` from `sonner` in handlers.
- Menus: `<DropdownMenu>` for actions, `<Select>` for a value, `<Combobox>`
  / `<Command>` for searchable lists.

## Network and browser APIs

- `fetch`, `localStorage`, `IntersectionObserver`, `matchMedia` are fine —
  inside effects or handlers, with loading (`<Skeleton>`, `<Spinner>`) and
  error (`<Alert variant="destructive">`) states.
- Assume the exported page may run from `file://` or a static host with no
  API: gate network features behind a URL the user supplied, and render
  something meaningful without it (`<Empty>`).
- Access `window`/`document` only inside `useEffect` or event handlers.
  Module-top-level `window.innerWidth` breaks the module import and the
  export build. For breakpoints use `useIsMobile()` from `@/hooks/use-mobile`.

## Effects and StrictMode

- Effects run twice in development (StrictMode). Every subscription,
  observer, timer, and listener must be cleaned up in the effect's return.
- No side effects in render. No `Date.now()` / `Math.random()` in render for
  layout-affecting values; seed them in state via a lazy initializer.

## Progressive enhancement

- Content must be visible with JavaScript disabled or before hydration: no
  empty shells that only fill from an effect.
- Hover-only affordances need a keyboard/touch equivalent (`<Tooltip>` and
  `<HoverCard>` already handle focus).
- Animations: `motion-safe:transition-*`; respect `prefers-reduced-motion`.

## Routing inside a page

- Simple multi-view pages: a `view` state and conditional rendering, with
  `<a href="#section">` anchors for in-page navigation and `<NavigationMenu>`
  or `<Breadcrumb>` for chrome.
- Hash routing is acceptable when the user asks for "pages" inside one export
  (`window.location.hash`, read in an effect). Path-based routing needs a
  host with rewrites — mention this to the user before choosing it.

## Anti-patterns

- ❌ A `useState` + two `<div>`s reimplementing `<Tabs>`, `<Accordion>`, or `<Dialog>`.
- ❌ `useEffect` to compute something derivable from props/state.
- ❌ Fetching from an endpoint nobody set up.
- ❌ `document.querySelector` to mutate the DOM React owns.
- ❌ Global listeners without cleanup; timers that outlive the component.
- ❌ Interactive `<div>`s. Use `<Button>`, `<a>`, `<Input>`, `<Select>`.
