// Spike 1: Do custom props like data-loc survive fromJsx() into the Takumi node tree?
import { fromJsx } from '@takumi-rs/helpers/jsx';
import { createElement as h } from 'react';

const doc = h(
  'main',
  {
    'data-loc': 'src/Invoice.tsx:5:3',
    style: { display: 'flex', flexDirection: 'column', gap: 16 },
  },
  h(
    'h1',
    { 'data-loc': 'src/Invoice.tsx:6:5', 'data-custom': 42, tw: 'text-2xl' },
    'Invoice INV-001',
  ),
  h(
    'section',
    { 'data-loc': 'src/Invoice.tsx:7:5', id: 'totals', className: 'totals-row' },
    h('span', { 'data-loc': 'src/Invoice.tsx:8:7' }, 'Total'),
    h('span', { 'data-loc': 'src/Invoice.tsx:9:7', 'data-flag': true }, '$1,250.00'),
  ),
);

const result = await fromJsx(doc);
console.log(JSON.stringify(result, null, 2));
