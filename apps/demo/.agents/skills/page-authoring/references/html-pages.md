# Plain HTML pages

A page folder may hold an `index.html` instead of a React module. The
workspace serves it as-is (through Vite, so scripts and styles are
processed), the home card previews it live, and `open-pages export <id>`
builds it into a static folder like any other page.

## When to use it

- The user hands you existing HTML/CSS/JS to host or tweak.
- A tiny page where React is overhead: a one-screen announcement, a redirect
  page, an embed target.
- Prototypes that intentionally avoid a framework.

For anything with real layout, state, or reuse, prefer `index.tsx`.

## Contract

```
pages/<id>/
  index.html     entry — must contain <title>
  style.css      optional, referenced with a relative href
  main.js        optional, referenced with a relative src (type="module" recommended)
  assets/        images, fonts
```

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Launch week</title>
    <link rel="stylesheet" href="./style.css" />
  </head>
  <body>
    <main>…</main>
    <script type="module" src="./main.js"></script>
  </body>
</html>
```

- Reference siblings with **relative** URLs (`./style.css`, `./assets/logo.svg`,
  `main.js`). Absolute paths (`/style.css`) do not resolve in the preview or
  the export.
- `<title>` is the card label in the workspace. There is no `meta` export;
  the folder name is the page id.
- If both `index.tsx` and `index.html` exist, the React entry wins and the
  HTML is treated as a plain asset.
- Tailwind is **not** wired into HTML pages. Write CSS, or use the React
  entry when you want utilities.

## What you do not get

- No inspector, no click-to-comment, no `@page-comment` markers. Feedback on
  an HTML page comes as plain requests; apply them by editing the file.
- No hot module replacement for the HTML itself — the preview reloads the
  frame on save. CSS and JS changes still hot-update.

## Anti-patterns

- ❌ Absolute or root-relative asset paths.
- ❌ Inline `<script>` blobs of application logic — put them in `main.js`.
- ❌ Reaching for `index.html` when the request is "a landing page with a
  pricing toggle". That is a React page.
