---
name: apply-comments
description: Apply pending @page-comment markers written by the open-pages inspector tool. Use when the user asks to "apply comments", "process page comments", "apply the inspector comments", or references markers left inside `pages/<id>/index.tsx` (or its `components/*.tsx`).
---

# Apply page comments

The open-pages viewer has an inspector that lets the user click any element on the live page and attach a textual comment (e.g. *"make this red"*, *"change to 'Open Pages Rocks'"*). Each comment is persisted as an in-source JSX marker inside the page's source — usually `pages/<pageId>/index.tsx`, occasionally a file under `pages/<pageId>/components/`.

Your job: read those markers, perform the described edits, and delete the markers.

> **Before making any page edit**, consult the **`page-authoring`** skill (and the **`shadcn`** skill for component props and variants) — it is the technical reference for how a page is structured (file contract, `className` styling, layout and responsive rules, type scale, interactivity). A comment like *"make this bigger"* or *"change the accent colour"* should be applied in a way that stays consistent with those rules and still works on mobile.

## Marker format

```
{/* @page-comment id="c-<8hex>" ts="<ISO>" text="<base64url(JSON)>" */}
```

- Inserted as the **first child inside** the JSX element it refers to: a newline + indent + the marker, spliced immediately after the element's opening `>`. The marker is dropped *into* its target, not floated above it. **The marker does not necessarily end its line** — for an element that was written on one line (`<h1>Title</h1>`), the element's children and closing tag follow the marker on the same line.
- `text` is base64url-encoded JSON: `{"note": "...", "hint"?: "..."}`.
- Detection regex (authoritative — use exactly this):

  ```
  /\{\/\*\s*@page-comment\s+id="(c-[a-f0-9]+)"\s+ts="([^"]+)"\s+text="([A-Za-z0-9_\-]+={0,2})"\s*\*\/\}/g
  ```

## Procedure

1. **Identify the target page(s).**
   - If the user names one (`launch`, `pricing`, etc.), work on that single page's source files.
   - If they say "all" or don't specify, scan every `pages/*/index.tsx` and `pages/*/components/*.tsx`. Process each page one at a time.

2. **Read the file and find all markers.**
   - Run the regex above against the whole file.
   - For each match, base64url-decode `text` and `JSON.parse` it to get `{ note, hint? }`.
   - Record each hit as `{ id, lineIndex (0-based), note, hint }`.
   - If there are no markers, tell the user and stop.

3. **Understand each comment in context.**
   - The targeted JSX element is the **enclosing** element of the marker — i.e. read upward from the marker line until you reach the unclosed JSX opening tag whose body the marker lives in. That element is the target. It is often a shadcn component (`<Button>`, `<Card>`, `<TabsTrigger>`): the inspector tags components too, so a click on the rendered button lands on the `<Button>` line in the page, never inside `ui/*.tsx`. (For self-closing elements like `<img />`, the inspector hoists the marker to the nearest non-self-closing ancestor; in that case the comment usually refers to a child of the enclosing element rather than the enclosing element itself — use the `note` text to disambiguate.)
   - Read enough surrounding code (parent element, sibling elements, `className` strings, any state the element depends on) to apply the change faithfully. A comment inside a `<Button>` with an `onClick` may be about behaviour, not looks. Apply look changes with the component's variants and semantic tokens (`variant="outline"`, `bg-muted`), not raw colors; if the comment really wants a different palette across the page, say so — that is a theme change, not a page edit.
   - If the marker sits inside a `.map` body, the comment applies to the row template — every rendered row changes. If the user clearly meant one item ("make the *middle* one green"), change the data or add a per-item field rather than special-casing the JSX.
   - If the `note` is ambiguous, do the smallest reasonable interpretation and mention the assumption in your summary.

4. **Apply edits in reverse line order.**
   - Sort markers by descending `lineIndex` and process one at a time, using the `Edit` tool.
   - Processing top-down would invalidate line numbers for later markers as the file shrinks/grows.

5. **Remove each marker after applying its edit.**
   - Delete **only the marker text itself** — the `{/* @page-comment … */}` span matched by the detection regex — plus the newline and indentation immediately *before* it (the whitespace the inspector inserted). Never delete the whole line: children and the closing tag often share the marker's line, and removing the line destroys them.
   - After removal, if the element is left split across two lines that were originally one (`<h1 …>\n  Title</h1>`), it is fine to rejoin them, but not required.
   - Never leave a marker behind for an edit you applied — that signals a failure. Markers deliberately skipped per the edge cases below stay in place.

6. **Verify.**
   - After all edits, re-read the file and confirm the only remaining markers are ones you reported as skipped.
   - Confirm the edited JSX is well-formed (balanced tags, no dangling attributes) and that changed `className` strings are literal Tailwind utilities. If the project's `package.json` has typecheck/lint scripts, run them with the project's package manager; scaffolded projects ship neither TypeScript nor a linter — there, rely on the running dev server (or the `build` script) to surface compile errors. Fix any errors you introduced.
   - For layout changes, mentally check the Mobile viewport (390px): did the edit introduce a fixed width or a grid with no stacking fallback?

7. **Report.**
   - Summarise: `N applied, M skipped` plus a one-line description of each change (including the page id).

## base64url decoding helper

```js
function decode(s) {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString('utf8');
}
```

You can run this inline via `node -e '...'` if you need to inspect a payload; otherwise just reason about the decoded string.

## Edge cases

- **Marker with no enclosing JSX element** (shouldn't happen — the inspector won't write one — but if you find one): delete it and note as orphan.
- **Multiple markers stacked on consecutive lines inside the same element**: they all refer to that enclosing element. Read their notes in source order to understand the combined intent, then apply and delete them bottom-up per step 4.
- **Comment asks for something outside the target element's scope** (e.g. "add a testimonials section"): do the closest-reasonable edit and mention the scope expansion in your summary.
- **Comment on a plain HTML page** (`pages/<id>/index.html`): the inspector does not run there, so no markers exist. Apply the user's request directly to the HTML.
- **Can't resolve the comment** (e.g. truly ambiguous, or the file changed shape such that the target element doesn't exist): leave the marker in place and report it as skipped. Don't guess.

## Do not

- Do not touch `package.json`, `open-pages.config.ts`, `ui/`, `lib/`, `hooks/`, `styles/globals.css`, or any file outside `pages/`. A comment that asks to change a shared component ("make all buttons rounder") is applied by wrapping in the page, or flagged as a theme/`ui/` change for the user to decide.
- Do not add dependencies.
- Do not re-introduce markers or leave `TODO` breadcrumbs — the user already has a record in git.
