# Assets and fonts

Both images and fonts follow the same rule: put the file under
`pages/<id>/assets/`, import it, and reference the imported value. Vite
resolves the import to a URL in the preview and to a hashed file in the
export.

## Images

```tsx
import hero from './assets/hero.png';

<img src={hero} alt="Dashboard showing the weekly brief" width={1200} height={720} className="w-full rounded-xl" />
```

- **Always give `width` and `height`** (intrinsic pixels) so the browser
  reserves space and the layout does not shift while loading. Let CSS
  (`w-full h-auto`) size it visually.
- **Always give `alt`**: descriptive for content images, `alt=""` for purely
  decorative ones.
- Below-the-fold images: `loading="lazy"`. The hero image: eager, and keep it
  reasonably sized (≤ 1600px wide, WebP or JPEG).
- Page-local images live in `pages/<id>/assets/`; images shared across pages
  live in the root `assets/` folder and import via `@assets/...`.
- Inline `<svg>` for logos, icons, and simple illustrations — crisp at any
  size and styleable with `fill-current`/`stroke-current`. Icon-only buttons
  need `aria-label`.
- Remote images (`https://…`) work but make the export depend on that host.
  Prefer local files; ask the user for their assets rather than inventing
  stock imagery.

## Fonts

The default is the system font stack — fast, no files, always correct.
Register a font only when the user names one or supplies files.

### Google Fonts

Render the link tags at the top of the page component:

```tsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
/>
```

Then use it: `className="font-[Inter,ui-sans-serif,system-ui,sans-serif]"` on
the root element, or in the page's `styles.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&display=swap');
```

### Self-hosted

```css
/* pages/<id>/styles.css */
@font-face {
  font-family: 'Satoshi';
  src: url('./assets/Satoshi-Variable.woff2') format('woff2');
  font-weight: 300 900;
  font-display: swap;
}
```

`import './styles.css'` in `index.tsx`, then `font-[Satoshi,sans-serif]`.
Always include a fallback family.

## Favicons and `<head>`

- `meta.title` and `meta.description` are written into the exported
  `<head>`. Other head tags (favicon, Open Graph) are not supported yet; note
  this to the user if they ask for them.

## Anti-patterns

- ❌ `<img>` without `alt`, or without `width`/`height`.
- ❌ Multi-megapixel PNG screenshots as hero images.
- ❌ `fontFamily` naming a font that was never loaded — it silently falls
  back and the page looks nothing like the theme.
- ❌ Loading four weights of two families for one heading.
- ❌ Hotlinking images from someone else's site.
