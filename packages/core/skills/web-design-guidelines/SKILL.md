---
name: web-design-guidelines
description: Review page code against Vercel's Web Interface Guidelines — accessibility, focus and keyboard handling, forms, motion, layout, typography, and performance. Use when asked to "review my page", "check accessibility", "audit the design", "review UX", or as the review pass at the end of `create-page` and `apply-comments`.
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <page-id or file-or-pattern>
---

# Web Interface Guidelines

Review page files for compliance with Vercel's [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) (MIT). Vendored from the [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) `web-design-guidelines` skill and scoped to an open-pages workspace.

## How it works

1. Fetch the latest guidelines from the source URL below.
2. Read the files to review.
3. Check them against every rule in the fetched guidelines.
4. Report findings in the terse `file:line` format the guidelines specify.

## Guidelines source

Fetch fresh guidelines before each review:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Use WebFetch to retrieve the latest rules. The fetched content contains all the rules and the output format. If the fetch fails (offline, blocked), say so and fall back to the self-review checklist in the `page-authoring` skill instead of guessing at rules.

## What to review

- Given a page id, review the page's entry (`pages/<id>/index.tsx` or `pages/<id>/index.html`), everything under `pages/<id>/components/`, and any `styles.css`, `style.css`, or `main.js` beside the entry.
- Given a file or glob, review those files.
- Given nothing, resolve the current page with the `current-page` skill; if that yields nothing, ask which page to review.

Never review or report on files under `ui/`, `lib/`, `hooks/`, or `styles/`. Those are the shared shadcn set and are not edited for one page; a finding there is a `create-theme` or upstream matter, not a page fix.

## Applying findings

Report first. When the user asks you to fix, or the review runs inside `create-page` or `apply-comments`, apply the fixes to the page files only, following the `page-authoring` skill: keep `@/ui/*` components, keep semantic tokens, keep the type scale. Do not add dependencies to satisfy a rule.
