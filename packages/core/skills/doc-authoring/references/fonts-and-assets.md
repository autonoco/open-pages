# Fonts and assets — current status

Be straight with the user about what is wired today. This file is the truth;
do not promise features it says are pending.

## Fonts

- Documents render with the engine's **bundled Geist** fallback: full Latin
  coverage, weights honored via `font-bold` etc., embedded and subset into
  the PDF automatically. Zero configuration.
- **Custom fonts are not wired up yet.** `tw` font-family utilities and
  `fontFamily` styles have no font to resolve against and will fail or fall
  back. Do not declare them.
- **Glyph coverage is a hard constraint**: a character the active font cannot
  cover fails the render with a missing-glyph error (by engine design — no
  silent tofu). Stick to Latin scripts, common punctuation, and ordinary
  symbols. Avoid emoji, CJK, Arabic, and decorative Unicode until custom
  fonts land.
- Typographic niceties that work now: real quotes “ ”, en/em dashes, bullets
  •, section §, currency symbols $, €, £.

## Images

- **File and URL images are not wired up yet.** Asset imports (`./assets/…`,
  `@assets/…`) resolve to dev-server URL strings, but the render worker does
  not fetch and hand image bytes to the engine, so an `<img>` with a URL
  source renders blank.
- **`data:` URI images DO render** — the engine decodes them internally
  (PNG/WebP/GIF). Fine for small marks the user supplies as base64; avoid
  for anything large (bloats the source file and every render).
- Until then, represent marks and figures with what works:
  - **Inline `<svg>`** — renders as crisp vector paths. Logos you can
    express as simple paths, rules, checkmarks, and simple charts are all
    viable today.
  - **Styled placeholders** for things only the user can supply — a bordered
    box with a label:

    ```tsx
    <div tw="flex h-[64px] w-[110px] items-center justify-center rounded border border-dashed border-slate-300 text-[10px] text-slate-400">
      LOGO
    </div>
    ```

- When the user asks for a photo or brand asset, say plainly that image
  embedding is coming and offer the SVG or placeholder route.

## Anti-patterns

- ❌ `fontFamily: 'Inter'` or any custom family — nothing backs it.
- ❌ Emoji or non-Latin glyphs (render fails, by design).
- ❌ `<img>` with file or URL sources until embedding lands (`data:` URIs are the one working form).
- ❌ Inventing stock-photo filler where type and layout would carry the page.
