// Spike 3: Does the JSX `id` prop land in the PDF structure tree's IDTree?
import { writeFile } from 'node:fs/promises';
import { createElement as h } from 'react';
import { render } from 'takumi-pdf';

const doc = h(
  'main',
  { id: 'loc--src-App.tsx-5-3' },
  h('h1', { id: 'loc--src-App.tsx-6-5' }, 'Heading with id'),
  h('p', { id: 'loc--src-App.tsx-7-5' }, 'Paragraph with id UNIQUE-P1'),
  h(
    'div',
    { id: 'loc--src-App.tsx-8-5', style: { display: 'flex', gap: 12 } },
    h('span', { id: 'loc--src-App.tsx-9-7' }, 'SpanA'),
    h('span', { id: 'loc--src-App.tsx-10-7' }, 'SpanB'),
  ),
);

const pdf = await render(doc, { size: 'a4', tagged: true });
await writeFile(new URL('./out-ids.pdf', import.meta.url), pdf);
console.log('wrote out-ids.pdf', pdf.length);
