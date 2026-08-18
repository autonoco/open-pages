// Spike 5: Encode source locations in <a href> -> do link annotations expose per-node /Rect boxes?
import { readFile, writeFile } from 'node:fs/promises';
import { createElement as h } from 'react';
import { render } from 'takumi-pdf';

const loc = (l, c) => `https://loc.invalid/src/App.tsx?l=${l}&c=${c}`;

const doc = h(
  'main',
  {},
  // anchor wrapping a heading
  h('a', { href: loc(6, 5), style: { display: 'block' } }, h('h1', {}, 'Wrapped heading')),
  // anchor wrapping a whole flex container (non-text node geometry)
  h(
    'a',
    {
      href: loc(8, 5),
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: 12,
        border: '1px solid #999',
      },
    },
    h('span', {}, 'boxed left'),
    h('span', {}, 'boxed right'),
  ),
  // force page 2
  h('p', { style: { breakBefore: 'page' } }, h('a', { href: loc(20, 7) }, 'page-2 inline link')),
);

const pdf = await render(doc, { size: 'a4' });
await writeFile(new URL('./out-links.pdf', import.meta.url), pdf);

const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
const pdoc = await getDocument({
  data: new Uint8Array(await readFile(new URL('./out-links.pdf', import.meta.url))),
}).promise;
for (let p = 1; p <= pdoc.numPages; p++) {
  const page = await pdoc.getPage(p);
  const annots = await page.getAnnotations();
  console.log(`PAGE ${p}:`);
  for (const a of annots) {
    console.log(
      '  ',
      a.subtype,
      'rect=',
      a.rect.map((n) => +n.toFixed(1)),
      'url=',
      a.url,
    );
  }
}
await pdoc.cleanup();
