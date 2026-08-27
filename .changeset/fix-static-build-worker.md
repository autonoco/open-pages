---
"@autono/open-pdf": patch
---

Fix `open-pdf build`: the render worker now ships as ESM and bundles docs, so static builds render. Unknown doc ids show an error instead of rendering forever.
