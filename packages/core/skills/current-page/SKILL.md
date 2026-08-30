---
name: current-page
description: Resolve which page and (optionally) selected element the user is currently viewing in the open-pages dev server. Consult this whenever the user references "this page", "this site", "this element", "the page I'm on", "the button I clicked", or any deictic reference to page content without naming it. Re-read `node_modules/.open-pages/current.json` at the start of every such turn — the user navigates between turns, so a value you read earlier in the conversation is almost certainly stale.
---

# Where is the user right now?

When the user says "fix this page", "tweak this heading", or "the page I'm looking at", they almost never name the page id or element — they mean wherever they are in the dev viewer. Before asking "which page?" or "which element?", check the file the dev server writes on every navigation and inspector pick.

## Re-read on every deictic turn — never reuse a prior read

`current.json` is a live cursor, not a fact about the conversation. The user moves between pages and elements freely between your turns — including while you were doing other work. **Read the file fresh at the start of every new turn that uses a deictic reference**, even if:

- you already read it earlier in this same conversation,
- you just finished editing the page it pointed to,
- the user's new message sounds like a continuation ("now make it bigger", "also fix this one", "keep going").

A "continue editing" follow-up is exactly the case where the user has likely just navigated to a different page or picked a different element. Trusting your last read here will silently edit the wrong file. Re-read, compare `pageId` / `selection` against what you used last time, and act on the new values.

## How to read it

```
node_modules/.open-pages/current.json
```

Path is relative to the project root (the user's `cwd`, the directory that contains `pages/` and `package.json`). Use the `Read` tool. The file is JSON.

## What you get

```json
{
  "pageId": "launch",
  "pageTitle": "Meridian — Launch",
  "view": "pages",
  "pagePath": "pages/launch/index.tsx",
  "selection": {
    "line": 52,
    "column": 8,
    "tagName": "h1",
    "text": "Your analytics, turned into decisions"
  },
  "updatedAt": "2026-08-28T14:32:11.123Z"
}
```

- `pageId` — folder name under `pages/`. Use as-is for any `/__pages/<id>/...` API or as the URL segment (`/p/<id>`).
- `pageTitle` — the page's `meta.title` (or `<title>` for an HTML page), falling back to the id.
- `pagePath` — page entry path **relative to the project root**: `pages/<id>/index.tsx`, or `pages/<id>/index.html` for a plain HTML page. Prefix it with the project root before handing it to `Read` / `Edit`. Note the selection may point into a file under `pages/<id>/components/` if the page is split — match the line against the file whose JSX contains that tag and text.
- `view` — `"pages"` when the user is viewing the page, `"assets"` when they are browsing that page's files in the asset manager rather than the page itself.
- `selection` — `null` if nothing is selected. Otherwise, the JSX element the user picked in the inspector:
  - `line` (1-indexed) and `column` (0-indexed) point to the JSX opening tag in the page source. This is the canonical handle — match against the source line.
  - `tagName` is the rendered HTML tag, lowercased (`"h1"`, `"div"`, `"button"`). The source line it points at may be a shadcn component rather than that tag — a `"button"` selection usually lands on a `<Button>` line in the page, because `ui/` components spread the inspector tag onto their root. Edit the page line; never follow it into `ui/*.tsx`.
  - `text` is a trimmed text snippet (≤120 chars) of the element's content — a sanity check that you're looking at the right node.
  - Selection auto-clears whenever the user navigates to a different page or clears it in the viewer. HTML pages never produce a selection.
- `updatedAt` — ISO timestamp of the last navigation or selection change. Use it to detect staleness.

## When to use this

- The user references the current page deictically: "this", "here", "the page I'm on", "the site I'm looking at", "what I'm working on".
- The user references a specific element: "this heading", "this image", "the button I just clicked", "tighten this", "change the color of this". If `selection` is non-null, that's the element they mean.
- Before asking "which page?" or "which element?" as a clarifying question — check this file first.
- Before guessing from `git log`, recently-edited files, or the most recent page folder.

## When NOT to use this

- The user names a page explicitly ("edit `launch`") — use that name directly.
- The `apply-comments` workflow already finds the right file via `@page-comment` markers; it doesn't need this skill.
- For listing or discovering pages — read `pages/` directly.

## Staleness — verify before acting

`updatedAt` is the last time the user navigated. Treat it like a cache:

- **Fresh (under ~5 minutes old)**: trust it. Open `pagePath`, do the work.
- **Older than ~5 minutes**: confirm with the user before editing. The dev server may not be running; the user may have switched contexts.
- **Hours/days old**: ignore it. Ask the user which page they mean.

A *newer* `updatedAt` than the one you saw last turn is the normal signal that the user has moved — switch to the new `pageId` / `selection` without asking.

## When the file is missing

- The dev server hasn't been opened on a page yet, or has never run.
- Don't create the file or guess. Ask the user which page they mean, or suggest they open the page in the dev server first.

## Example — page-level reference

User: "tighten the spacing on this page"

1. Read `node_modules/.open-pages/current.json`.
2. Check `updatedAt` is recent.
3. Read `pagePath` (e.g. `pages/launch/index.tsx`).
4. If `selection` is set, jump to that line; otherwise identify the relevant section from the user's words.
5. Consult the `page-authoring` skill for spacing and layout rules, then edit in place.

If `current.json` is missing or stale, ask: "Which page should I tighten? The dev server hasn't published a current page recently."

## Example — element-level reference

User: "make this bigger"

1. Read `node_modules/.open-pages/current.json`.
2. If `selection` is non-null, the user means that element. Read `pagePath`, jump to `selection.line`, and find the JSX opening tag near that line/column. Confirm with the snippet in `selection.text` and the `tagName`.
3. Consult `page-authoring` for type-scale and responsive rules before editing (bigger on desktop usually means a `sm:`/`lg:` step, not a fixed size).
4. Edit the JSX node in place.

If `selection` is null, fall back to the page-level flow above — and consider asking "which element?" since the user used a deictic but hasn't picked one in the inspector.
