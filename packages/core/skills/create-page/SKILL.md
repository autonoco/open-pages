---
name: create-page
description: Use this skill when the user wants to create, build, draft, or generate a new web page, site, or landing page in this open-pages repo. Triggers on phrases like "make a landing page for X", "build a pricing page", "create a portfolio site", "new page", "a dashboard UI", "an HTML page", or when the user asks to add content under `pages/`. Do NOT use for editing the framework itself — only for authoring content inside `pages/<id>/`.
---

# Create a page in open-pages

This skill owns the **workflow** for building a new page. The technical reference — file contract, composing from the preinstalled shadcn/ui set under `ui/`, semantic tokens, layout and responsive rules, type scale, interactivity, assets — lives in the **`page-authoring`** skill. Read that skill whenever you need details on *how* a page is structured. This skill assumes you'll consult it before writing code. Component-level questions (props, variants, blocks, registries) go to the vendored **`shadcn`** skill.

Every workspace already ships the full shadcn/ui set (`ui/`), `lib/utils.ts`, `hooks/`, and `styles/globals.css` with the neutral OKLCH tokens. Nothing needs `npx shadcn add`; pages import `@/ui/<name>` and compose.

You only write files under `pages/<id>/`. Never modify `package.json`, `open-pages.config.ts`, or existing pages.

## Step 1 — Pick a theme

List files under `themes/`. If any theme markdown files exist (anything other than `README.md`), call `AskUserQuestion` with each theme id as an option plus a final **"no theme — design from scratch"** option. (`AskUserQuestion` holds at most 4 options — with 4+ themes, offer the 3 most topic-relevant plus "no theme"; the auto-added "Other" lets the user name any omitted theme.)

- If the user picks a theme: read `themes/<id>.md` end-to-end. Its direction, fonts, and component notes are now authoritative. **Set `theme: '<theme-id>'` on the `meta` export** — the runtime injects `themes/<id>.css` (the token overrides) into the page, so you keep writing semantic token classes and never paste color values. In Step 2, skip the **visual direction** question (the theme already commits to one); confirm the page's purpose itself before moving on. Sections and interactivity are independent of theme — ask those normally.
- If the user picks "no theme", or `themes/` contains no theme markdown files: the page uses the default neutral tokens from `styles/globals.css`. Proceed to Step 2 unchanged.

If you skip the visual-direction question because a theme was picked, restate the theme name in Step 2 so the user can correct course before you start writing.

## Step 2 — Clarify requirements (MUST ask before writing code)

**Before writing any code, lock in the key decisions below via `AskUserQuestion`.** They shape every downstream choice, so locking them in up front avoids rework. Only skip a question when it's already unambiguously answered — by the user's original message, or by a theme picked in Step 1 — and if you skip, restate your assumption so they can correct it.

**Purpose comes first.** If the user's initial request is thin ("make me a page", "build a site"), make a *separate* `AskUserQuestion` call first to gather what the page is for, who lands on it, and what content they already have (copy, product names, prices, screenshots, links). Skip this only if already clear — then restate your reading so they can correct course.

Then ask these four in a single `AskUserQuestion` call (multi-question form):

1. **Page type** — offer the closest fits: landing / marketing page, product or pricing page, dashboard or app UI, docs or long-form content page, portfolio or personal site, form or signup flow, internal tool. Mark the best fit "(Recommended)". This drives structure and how much interactivity to expect.

2. **Visual direction** — propose 3 directions tailored to *this* page and its audience. Do **not** pull from a fixed preset list. Each option must combine a vibe word + a concrete visual cue (palette, weight, surfaces) so the user can picture it; bare labels like "modern" are too vague. The three options should feel meaningfully different.

   How options should shift with page type:
   - *SaaS landing page* → **dark launch** (near-black, one neon accent, large display type) · **clean product** (white, slate text, one indigo accent, soft cards) · **editorial** (warm off-white, serif display, generous whitespace)
   - *Dashboard* → **ops console** (dense, slate surfaces, status colors) · **calm workspace** (airy, rounded cards, one accent) · **data-forward** (tables and charts as the spine, mono numerals)
   - *Portfolio* → **gallery** (big imagery, minimal chrome) · **typographic** (type does the work, one accent) · **playful** (color blocks, rounded shapes, motion)

   Mark the best fit "(Recommended)". (`AskUserQuestion` auto-adds "Other" — don't add a catch-all yourself.)

3. **Sections / content** — offer bundles that fit the type, e.g. for a landing page: hero + features + pricing + FAQ + footer (Recommended); hero + social proof + CTA (short); hero + long-form explainer + CTA. The auto-added "Other" covers custom lists.

4. **Interactivity** — offer: static (links only), light (tabs, toggles, accordions, a pricing switch), form (a contact/signup form that mirrors state locally or posts to a URL they supply), app-like (filters, local state, multiple views). Note that no backend exists — anything that needs one requires a URL from the user.

After those, ask follow-ups **only if still unclear**: brand colors, logo/screenshots, real copy (headlines, prices, names). Real pages live on real content — placeholder copy like "Acme, $10/mo" is a last resort; prefer asking for the real values. Responsive is not a question: every page must work at Desktop, Tablet (820px), and Mobile (390px).

## Step 3 — Pick a page id

Use **kebab-case**, short, descriptive. Examples: `launch`, `pricing`, `status-board`, `founder-portfolio`, `waitlist`. Check `pages/` to avoid collisions.

## Step 4 — Plan the structure

Sketch the page as an ordered list of sections before writing code. Common shapes:

| Section | Purpose |
| --- | --- |
| Header / nav | Wordmark, 3–5 links, one CTA; collapses on mobile |
| Hero | One headline, one lede, primary + secondary CTA, optional visual |
| Social proof | Logos, a metric row, one quote |
| Features | 3–6 cards or alternating rows, each one benefit |
| Pricing | 2–3 tiers, a billing toggle, clear CTA per tier |
| FAQ | Accordion or plain list |
| CTA band | Restate the ask before the footer |
| Footer | Links, legal line |
| App shell | Sidebar/topbar + content area for dashboards and tools |

**Rule of thumb:** one idea per section, one CTA per screen. If a section lists things, it wants a grid or a table, not a paragraph.

Decide the data shape now: which sections render from a typed const array (`.map`), which are explicit component instances — `page-authoring` explains why this matters for the inspector.

## Step 5 — Compose from `ui/`

Before writing code, map every planned section to the shadcn components it should be built from. Pages compose `@/ui/*` first and hand-roll only what shadcn lacks (heroes, marketing feature grids, footers). Typical mappings:

| Page type | Reach for |
| --- | --- |
| Landing / marketing | `navigation-menu` or plain links + `sheet` for mobile nav, `button` (CTAs), `badge` (eyebrows), `card` (features, pricing tiers), `tabs` or `switch` (billing toggle), `accordion` (FAQ), `separator` |
| Dashboard / app UI | `sidebar` (`SidebarProvider` + `SidebarInset`), `table`, `chart`, `card` (KPIs), `tabs`, `select`, `dropdown-menu`, `badge` (status), `skeleton`, `empty` |
| Form / signup | `field`, `input`, `select`, `checkbox`, `radio-group`, `switch`, `textarea`, `button`, `alert` |
| Docs / long-form | `sidebar` or a sticky `scroll-area` TOC, `breadcrumb`, prose in a `max-w-[65ch]` column, `kbd`, `table`, `alert` (callouts) |
| Portfolio / gallery | `carousel`, `aspect-ratio`, `card`, `dialog` (lightbox), `hover-card` |
| Internal tool | `command` (palette), `combobox`, `resizable`, `context-menu`, `tooltip`, `sonner` (toasts), `alert-dialog` (confirm) |

Write the list down (component per section) so the structure in Step 4 and the code in Step 6 agree. If a section needs something shadcn only ships as a block (`dashboard-01`, `login-03`), the `shadcn` skill explains `npx shadcn@latest view` / `add` for blocks.

## Step 5b — Commit to a visual direction

One type scale, held for the whole page, expressed in the semantic tokens (`bg-background`, `bg-card`, `bg-primary`, `text-muted-foreground`, `border-border`) so a theme can repaint everything. Dark direction = `dark` on the root element, not a hand-picked dark palette. The constraints (web type scale, token system, contrast) live in `page-authoring` and its `references/typography-and-color.md` — apply them. Raw palette classes are for one deliberate brand moment, if any. Fonts: default to the token font; load a Google Font or self-hosted file only when the user names one or a theme requires it (`references/assets-and-fonts.md`).

## Step 6 — Write `pages/<id>/index.tsx`

Read the **`page-authoring`** skill before writing — file contract, `@/ui/*` composition, token styling, layout and responsive rules, interactivity constraints, assets. Its file-contract example is the starter template. Never edit files under `ui/`, `lib/`, `hooks/`, or `styles/` for a page; wrap components under `pages/<id>/components/` when they need a page-specific look. Split large pages into `pages/<id>/components/*.tsx` when a section is more than ~80 lines.

## Step 7 — Self-review

Run the checklist in `page-authoring` ("Self-review before finishing"): every button/input/card/dialog/tab is a `@/ui` component, colors are tokens, nothing under `ui/` changed. Check all three viewports.

## Step 8 — Hand off to the user

Tell the user:

- The page id and file path you created.
- The preview URL — `http://localhost:5173/p/<id>` — hot-reloads on every edit, with Desktop / Tablet / Mobile toggles and **Open** to view the page by itself.
- That they can hit **Inspect** (or `i`) in the preview, click any element or component, and leave comments — then ask you to run `apply-comments`.
- That the look is token-driven: `/create-theme` can restyle the whole page (and every other page) without touching its code.
- That `open-pages export <id>` writes `export/<id>/` — a static folder (index.html + assets) they can deploy to Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any static host.
- If dev isn't running: run the project's `dev` script from the project root with its package manager (`npm run dev`, `pnpm dev`, … — match the lockfile).

Don't run the dev server yourself unless asked.
