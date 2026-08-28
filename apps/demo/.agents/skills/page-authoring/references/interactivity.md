# Interactivity

Pages are real React 18 components running in the browser, wrapped in
`StrictMode`. Everything React can do is available; the constraints below
keep pages preview-safe, export-safe, and inspectable.

## State

```tsx
const [tab, setTab] = useState<'monthly' | 'yearly'>('monthly');

<button
  type="button"
  onClick={() => setTab('yearly')}
  aria-pressed={tab === 'yearly'}
  className={tab === 'yearly' ? 'bg-slate-900 text-white' : 'text-slate-600'}
>
  Yearly
</button>
```

- Keep state local and small: tabs, toggles, accordions, filters, form values.
- Derive, do not duplicate: compute filtered lists with `useMemo` (or inline)
  from the source array and the filter state.
- Toggle/tab buttons carry `aria-pressed` or `role="tablist"` semantics;
  disclosure buttons carry `aria-expanded` and `aria-controls`.

## Forms

- Real `<form>` with `onSubmit={(e) => { e.preventDefault(); … }}`.
- Every input has a `<label htmlFor>` (or `aria-label`), a `name`, and a
  sensible `type`/`inputMode`/`autoComplete`.
- No backend exists in the workspace or the export. Either mirror submitted
  values into local state ("Thanks, we'll be in touch"), or point the form at
  a URL the user supplies (`action="https://formspree.io/…" method="post"`).
  Never invent an endpoint.

## Network and browser APIs

- `fetch`, `localStorage`, `IntersectionObserver`, `matchMedia` are fine —
  inside effects or handlers, with loading and error states.
- Assume the exported page may run from `file://` or a static host with no
  API: gate network features behind a URL the user supplied, and render
  something meaningful without it.
- Access `window`/`document` only inside `useEffect` or event handlers.
  Module-top-level `window.innerWidth` breaks the module import and the
  export build.

## Effects and StrictMode

- Effects run twice in development (StrictMode). Every subscription,
  observer, timer, and listener must be cleaned up in the effect's return.
- No side effects in render. No `Date.now()` / `Math.random()` in render for
  layout-affecting values; seed them in state via a lazy initializer.

## Progressive enhancement

- Content must be visible with JavaScript disabled or before hydration: no
  empty shells that only fill from an effect.
- Hover-only affordances need a keyboard/touch equivalent.
- Animations: `motion-safe:transition-*`; respect `prefers-reduced-motion`.

## Routing inside a page

- Simple multi-view pages: a `view` state and conditional rendering, with
  `<a href="#section">` anchors for in-page navigation.
- Hash routing is acceptable when the user asks for "pages" inside one export
  (`window.location.hash`, read in an effect). Path-based routing needs a
  host with rewrites — mention this to the user before choosing it.

## Anti-patterns

- ❌ `useEffect` to compute something derivable from props/state.
- ❌ Fetching from an endpoint nobody set up.
- ❌ `document.querySelector` to mutate the DOM React owns.
- ❌ Global listeners without cleanup; timers that outlive the component.
- ❌ Interactive `<div>`s. Use `<button>`, `<a>`, `<input>`, `<select>`.
