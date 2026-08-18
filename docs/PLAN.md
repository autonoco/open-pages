# open-pdf — Build Plan

**The PDF framework built for agents.** A clone of [open-slide](https://github.com/1weiho/open-slide) (MIT, 6.5k stars) where the artifact is a real PDF instead of a slide deck: an AI coding agent authors documents as React components, the human gets a live in-browser PDF preview with click-to-edit and click-to-comment, and the preview blob is byte-identical to the exported file.

Verified against open-slide source at v1.18.0 (`@open-slide/core` 1.18.0, `@open-slide/cli` 1.4.1, HEAD 2026-08-17), pdfcn (shadcn-labs/pdfcn, cloned 2026-08-17), and a hands-on engine bake-off (5 empirical spikes + adversarial audit, 2026-08-17 — evidence paths in §5/§9).

---

## 1. The two decisions that gate everything

### Decision A — Rendering engine: **Takumi (takumi-pdf)**, with a thin engine boundary

This decision was originally @react-pdf/renderer on a maturity heuristic. An adversarial audit plus head-to-head benchmarks reversed it — the "mature vs new" framing was half-false:

| | takumi-pdf 0.11.1 | @react-pdf/renderer 4.6.1 |
|---|---|---|
| Render speed (measured) | 22ms warm / 2 pages; **318ms / 20 pages** | 103ms / 2 pages; **1,580ms / 20 pages** (~5x slower, superlinear: 52k elements = 36s per issue #2032) |
| Authoring dialect | Real HTML `<table>` + Tailwind — the distribution LLMs emit constantly; thead repetition, page counters engine-provided | Proprietary primitives + StyleSheet, flexbox-only, no grid (5-year-old request), hand-rolled tables, silent prop dropping — every failure mode is an authoring mistake an LLM plausibly makes |
| Document features | PDF/UA-1/2 + PDF/A-2/3/4 (veraPDF-validated in CI), TOC target page numbers, widows/orphans, repeating `<thead>`, ZUGFeRD | None of these; open silent-corruption bugs in our exact domain: table rows split across pages corrupt columns (#2470, open 2+ yrs), `wrap={false}` silently compresses instead of breaking (#2763) |
| Maintenance | Bus-factor 1 (Kane Wang), but median issue close **11.8h**, external PRs merged in hours; layout core is 14 months old, 280k weekly downloads, prod users: TanStack, Dcard, Nuxt OG Image (recommended over Vercel's own satori), Fumadocs; Vercel OSS Program | **Also bus-factor 1** (diegomura: 778 commits vs 72 for next human) and went dark ~10 months of 2025 (1 maintainer commit Mar–Dec); 53% of 351 open issues predate 2024; ESM/SSR declared broken since Feb 2024 (#2624), unanswered |
| Ecosystem | pdfcn: 24 components, 10 blocks, 9 themes, MIT — verified running unmodified across 0.4.1→0.11.1 | None ready-made |
| Known risks | PDF serializer is ~2 weeks old; 2 confirmed silent layout bugs (§8); poppler mis-renders text (§8); 0.x churn (measured additive-only so far) | Stable API; clean in every rasterizer tested |

Both engines produced correct 2- and 20-page invoices with identical pagination density, right-aligned money columns, and footers on every page. Fidelity was triangulated across five rasterizers: Takumi renders perfectly in pdf.js, macOS Quartz, and pdfium (Chrome/Edge/Windows — verified locally on this machine); it mis-renders **only in poppler** (Linux Evince/Okular/CUPS — dropped glyphs, intra-word gaps, no warnings). react-pdf is clean in all five.

**Hedge:** pdfcn proved components can be engine-decoupled (its components never import takumi — plain React through a `pdf-primitives` shim). open-pdf keeps that boundary: engine touches the app at ~2 functions (`fromJsx` + `render`), so react-pdf or Forme can be added as a second "base" later. The bet is revisable, not irreversible.

### Decision B — Pagination model: **content-flow with explicit page sections**

open-slide's fixed page-per-component model exists because slides are fixed canvases. Takumi paginates flowing content natively and correctly (repeating `<thead>`, `break-inside`, widows/orphans, page counters via `<PageNumber/>`/`<TotalPages/>`) — so open-pdf documents are flowing HTML-shaped trees with explicit `break-before` where the author wants hard page starts. The authoring skill teaches break control rather than per-page vertical-budget math. (This diverges from the original plan, which assumed react-pdf where auto-flow is bug-ridden.)

## 2. What we're cloning (open-slide architecture, verified at source)

- **Two packages.** `@open-pdf/core` — runtime viewer app (shipped as *source* in the npm tarball; Vite root points at `node_modules/@open-pdf/core/src/app`), Vite plugins, and the `open-pdf` bin (`dev`/`build`/`preview`/`export`/`sync:skills`). `@open-pdf/cli` — init-only scaffolder (commander + prompts): copies `template/`, rewrites package.json (core version baked at build time via tsdown `define` — don't forget this), symlinks `CLAUDE.md → AGENTS.md` and `.claude/skills/* → .agents/skills/*` (file copies on Windows), runs install + git init.
- **Scaffolded workspace** contains only content + a typed config; all React/Vite plumbing hidden in core:
  ```
  docs/<kebab-id>/index.tsx      # default export: the document component + meta export
  docs/<kebab-id>/assets/
  themes/<id>.md + <id>.demo.tsx # agent-readable design recipe + preview card
  assets/                        # global, via @assets alias
  open-pdf.config.ts             # docsDir, themesDir, port, pageSize, margins, build flags
  AGENTS.md (+ CLAUDE.md symlink)
  .agents/skills/ (+ .claude/skills symlinks)
  vercel.json, netlify.toml
  ```
- **Doc discovery + HMR:** virtual modules (`virtual:open-pdf/docs|config|themes|folders`), fast-glob `*/index.{tsx,jsx}`, meta extracted by **regex, never evaluated server-side**, debounced custom WS event → client cache-bust token → `/@fs/` dynamic re-import.
- **Dev-server API surface** (all mutating routes behind open-slide's request-guard: content-type + sec-fetch-site/origin checks vs DNS-rebinding/CSRF): `/__edit(+/batch)`, `/__comments`, `/__docs/:id` (rename/delete/duplicate/reorder), `/__assets`, `/__svgl` proxy (logo search stays useful in documents), `/__design`, `/__current`, `/__update-package` + supervised-child self-restart.
- **Five skills**, canonical in `packages/core/skills/`, mirrored into the CLI template at build time, kept fresh via `sync:skills` with hash-based drift check on `dev`:
  - `/create-pdf` — theme scan → 4 scoping questions (visual direction, page size/margins, content density, headers/footers) → kebab-case id → outline → author `docs/<id>/index.tsx`
  - `/pdf-authoring` — the technical contract: HTML-shaped JSX + Tailwind `tw` prop (Takumi dialect), real `<table>` for tabular data, `break-before`/`break-inside` control, `<PageNumber/>`/`<TotalPages/>` in footer bands, pt-based print type scale, font registration, **known-bug avoidances** (§8: no explicit widths on `<th>`, tables at flow root not inside flex wrappers until upstream fixes land)
  - `/apply-comments` — find `@pdf-comment` markers by authoritative regex, base64url-decode, apply in reverse line order, delete markers, report applied/skipped
  - `/current-page` — re-read `node_modules/.open-pdf/current.json` every deictic turn
  - `/create-theme` — extract `themes/<id>.md + demo.tsx` from an existing doc
- **Themes as markdown recipes** (palette, type stacks, layout guidance, voice), not tokens — deliberately agent-consumable. Plus per-doc `export const design` object rewritten via AST by a Design panel (open-slide's design-plugin pattern).
- **Agent-state cursor:** dev server writes `current.json` on every navigation/inspector pick: `{docId, pageIndex, pagePath, selection: {line, column, tagName, text}}`.

## 3. Preview & export (PDF-native, replaces open-slide's weakest part)

open-slide renders DOM and exports PDF via a hidden-print-root + `window.print()` hack (browser-only, Safari-broken, no headless export). open-pdf:

- **Preview:** agent's TSX → Vite HMR → `fromJsx()` → takumi-pdf WASM render **in a web worker** (pdfcn's playground proved this loop: sucrase + worker + WASM + `<object type="application/pdf">`; we use Vite HMR instead of sucrase and pdf.js instead of `<object>` for overlay access). 20-page docs re-render in ~320ms — a real-time loop.
- **Viewer:** wojtekmaj/react-pdf (pdf.js canvas) — not an iframe — because the inspector needs coordinate access and stale-while-revalidate page swapping.
- **Export:** `open-pdf export` CLI runs the same render in Node. Same bytes as preview. Tagged/accessible PDF by default; PDF/A profiles as a config flag.
- **Component kit:** vendor pdfcn's takumi base (MIT) — 24 components, invoice/report blocks, 9 themes — pinned at a verified commit, smoke-tested on engine upgrades.

## 4. The inspector on a PDF (the novel engineering)

open-slide maps clicks to source via DOM attributes. A PDF canvas isn't DOM, and takumi-pdf exposes no in-memory layout tree — but the spike proved a **deterministic, no-fork channel through the PDF itself**:

1. **Loc-tags plugin:** Babel/Vite pre-transform injects `data-loc="line:col"` on every JSX element (survives `fromJsx()` into `node.attributes` — verified) and an `id` prop, whose presence makes the engine emit a StructElem `/ID(Un.<tree-index-path>)` for every node — literal input-tree index paths, surviving pagination with per-page `/Pg` + MCID refs.
2. **Hit-map:** a ~15-line inflate parse of the output PDF recovers ID→MCID→page; `pdfjs getTextContent({includeMarkedContent:true})` gives per-MCID text runs with exact x/y/w/h in PDF points. Click → hit-test run box → MCID → tree path → `data-loc` → source location. Exact, not fuzzy. (Containers without text: union of descendant runs; fallback: link-annotation wrapping gives true per-node rects.)
3. **Overlay:** transparent divs over the pdf.js canvas, canvas-px ↔ PDF-pt scaling.
4. **Write-back:** port open-slide's `edit-ops.ts` — `POST /__edit/batch`, typed EditOps (`set-text`, `set-style` as Tailwind-class/inline-style rewrites, `set-attr-asset`), server re-parses with Babel, splices at line:col, one fs write per batch → one HMR tick.
5. **Comments:** identical to open-slide — `{/* @pdf-comment id ts text=base64url({note,hint}) */}` inserted as first child of nearest container.

Also worth an early upstream ask: a layout-geometry/debug API in takumi-pdf (maintainer merges external PRs in hours; this would collapse step 2 into a clean in-memory read).

## 5. Evidence (all hands-on, scratchpad paths session-local)

- **Bake-off benchmark** (`scratchpad/engine-bench/`): same 2-page and 20-page invoice implemented idiomatically in both engines; timings, pdfjs inspection JSON, rasterizer PNGs, minimal repros for every defect found.
- **Takumi inspector spike** (`scratchpad/takumi-spike/`): 6 numbered experiments proving attribute survival, StructElem `/ID` emission, MCID geometry extraction, link-annotation rects.
- **pdfcn drift spike** (`scratchpad/pdfcn-drift/`): invoice-minimal + core components rendered unmodified on takumi-pdf 0.4.1, 0.4.2, and 0.11.1; tsc clean on 0.11.1; API diff shows zero removed/renamed exports across 7 minors.
- **pdfium fidelity check** (`scratchpad/pdfium-check/`): Takumi 2-page invoice rasterized via @hyzyla/pdfium — pixel-perfect, all glyphs intact; 20-page doc opens clean.
- **react-pdf spike** (`scratchpad/rpdf-spike/`): the original data-loc layout-tree proof (kept for the second-base option).

## 6. Build order

1. **Core viewer (week 1):** monorepo (pnpm + turbo + biome + vitest, mirroring open-slide), `@open-pdf/core` Vite plugin + virtual modules + doc discovery, viewer SPA (port open-slide's app shell), worker-side takumi render → pdf.js canvas with stale-while-revalidate. Milestone: edit `docs/demo/index.tsx`, PDF preview hot-updates in <500ms.
2. **Inspector (week 2):** loc-tags plugin + id injection, struct-tree hit-map + overlay, comments route + `@pdf-comment` markers, `current.json`, then direct-edit ops (`set-text` first). File the two takumi layout bugs upstream (§8) with the minimal repros from the bake-off.
3. **CLI + skills (week 3):** `@open-pdf/cli init`, template, AGENTS.md, five skills (adapt open-slide's; `/pdf-authoring` teaches the Takumi dialect + bug avoidances), `sync:skills` + drift check, vendored pdfcn component kit + fonts.
4. **Export formats (Bobak, 2026-08-18):** beyond PDF — export to **Word (.docx)** and **Google Docs**. Path: text-preserving DOCX via hand-rolled OOXML + fflate (open-slide's PPTX trick, but mapping Takumi's struct tree to real paragraphs/tables rather than page images); Google Docs = upload the .docx via Drive API with conversion, or share-link flow. Slot after the export CLI lands.
5. **Export + polish (week 4):** `open-pdf export` CLI, PDF/A config, themes + `/create-theme`, assets manager + svgl, demo workspace (invoice, report, proposal, contract), docs site (Next + fumadocs, llms.txt + per-page .md), changesets + CI **with a poppler-render smoke test** and veraPDF validation (takumi's own CI pattern), MIT, `demo.open-pdf.dev`.

## 7. Positioning

- Tagline: **"The PDF framework built for agents."** CTA: `npx @open-pdf/cli init my-doc`. MIT, demo subdomain, docs with llms.txt.
- Wedge (verified nobody does all three): AI-writes-code + live *real-PDF* preview + visual write-back. react-pdf REPL = preview only; molefrog's Claude skill = generation only; PDFx Builder = closed/commercial; htmldocs = HTML route, no agent loop; Fileforge = dormant since Sept 2024.
- pdfcn relationship: **ally, not competitor** — we build the agent+inspector product layer above their component layer, vendor their MIT components, contribute fixes upstream. Their MCP + agent-skills endpoints show the ecosystem is already agent-native.

## 8. Open risks (all with named mitigations)

1. **Two silent takumi 0.11.1 layout bugs** (minimal repros in `engine-bench/`): (a) explicit width on `<th>` leaves an unpainted notch in the header-row background; (b) `break-inside: avoid` on `<tr>` is silently ignored when the table sits inside a flex-col wrapper — the README quickstart's own pattern. *Mitigate:* file upstream (median fix latency is hours-to-days), encode avoidances in `/pdf-authoring`, regression smoke tests.
2. **Poppler text corruption** (dropped glyphs, intra-word gaps; Linux Evince/Okular/CUPS only — pdf.js, Quartz, and pdfium verified clean). *Mitigate:* file upstream with repro; poppler render check in CI; ship gate for v1 announce.
3. **0.x churn / bus factor 1.** Measured additive-only across 7 minors, but behavior defaults can shift (margin default changed in 0.10). *Mitigate:* exact-pin engine versions, smoke-test on bump, thin engine boundary keeps react-pdf/Forme as swappable second base (react-pdf spike already proves that path).
4. **takumi-pdf youth:** the PDF serializer is ~2 weeks old and hasn't absorbed the long tail of real-document bugs (CSS table support was "naive"-merged 2026-08-16, no border-collapse; blocked upstream on taffy#467). *Mitigate:* demo-workspace docs double as a rendering test corpus; stay on the maintainer's fast fix loop.

## 9. Reference checkouts (research artifacts)

- open-slide fresh clone (v1.18.0): `scratchpad/open-slide`
- pdfcn clone: `scratchpad/pdfcn`
- All spikes: copied into this repo at `docs/research/spikes/{engine-bench,takumi-spike,pdfcn-drift,pdfium-check,rpdf-spike}` (code, output PDFs, rasterizer PNGs, bench results; node_modules stripped — reinstall per-dir to re-run).
- Stale local open-slide checkout at `~/Documents/Projects/open-slide` (v1.14.0) — prefer the fresh clone.
- Scratchpad root (session-local, may be cleaned): `/private/tmp/claude-501/-Users-bobakemaiman-Documents-Projects-open-pdf/5e331d5c-6a77-43fd-86ee-79b06e5d14bb/scratchpad` — also holds the open-slide and pdfcn clones.
