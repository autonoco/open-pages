# Fonts and assets

Both fonts and images work in the preview and in `open-pdf export`, and both
follow the same rule: put the file under `docs/<id>/assets/`, import it, and
reference the imported value. The import resolves to a URL the renderer
knows how to fetch (preview) or read (export).

## Images

```tsx
import logo from './assets/logo.png';

<img src={logo} width={64} height={64} tw="rounded-lg" />
```

- **Always give `width` and `height`** (CSS px). The engine sizes the box
  from them; an unsized image is a layout surprise.
- Doc-local images live in `docs/<id>/assets/`; assets shared across docs
  live in the project root `assets/` and import via `@assets/...`.
- PNG, JPEG, WebP, GIF decode; `data:` URIs also work (fine for tiny marks,
  wasteful for anything else).
- Inline `<svg>` elements render as crisp vector paths — prefer them for
  rules, checkmarks, and simple charts.
- Keep source images reasonably sized (a logo does not need 2000px) — image
  bytes embed into every rendered PDF.

## Fonts

Register per-document fonts on `pageOptions.fonts`; reference them by the
family name inside the font file:

```tsx
import display from './assets/PlayfairDisplay.woff2';

export const pageOptions: PageOptions = {
  size: 'a4',
  margin: 64,
  fonts: [display],
};

<h1 tw="text-[28px] font-bold" style={{ fontFamily: 'Playfair Display' }}>…</h1>
```

- Entries are asset-import URLs (`.woff2`/`.ttf`/`.otf` under the doc's
  assets), absolute `https:` URLs, or `{ name?, data, weight?, style? }`
  byte descriptors. The engine reads family name, weight, and style from
  the file when not given.
- **A registered font also takes priority over the bundled default for
  unstyled text.** Register only faces you want in the document; if some
  text must stay on the default face while a custom face is registered,
  there is no way to name the default — plan the registration around that.
- The default (no `fonts`) is the engine's bundled Geist: full Latin
  coverage, weights honored, embedded and subset automatically. It remains
  the right choice unless the user names a font or supplies brand files.
- **Glyph coverage is a hard constraint**: a character no registered font
  covers fails the render with a missing-glyph error (by design — no silent
  tofu). For emoji, CJK, Arabic, or other scripts, register a font that
  covers them; otherwise keep to Latin text and ordinary symbols.
- Ask the user for their font files rather than hotlinking; if they name a
  Google font, they can download the `.woff2` into the doc's assets.

## Anti-patterns

- ❌ `fontFamily` naming a font that was never registered — it silently
  falls back.
- ❌ Registering fonts "just in case" — they displace the default for all
  unstyled text.
- ❌ `<img>` without `width`/`height`.
- ❌ Multi-megapixel images for a letterhead logo.
- ❌ Emoji or non-Latin glyphs without a covering registered font (render
  fails, by design).
- ❌ Inventing stock-photo filler where type and layout would carry the page.
