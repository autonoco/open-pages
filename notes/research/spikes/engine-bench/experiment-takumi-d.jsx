// D: the invoice's exact table, standalone, 36 rows — does a row split at the boundary?
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from 'takumi-pdf';
import { makeItems, money } from './data.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const interDir = path.join(here, 'node_modules/@fontsource/inter/files');
const fonts = [
  {
    name: 'Inter',
    weight: 400,
    data: await readFile(path.join(interDir, 'inter-latin-400-normal.woff2')),
  },
  {
    name: 'Inter',
    weight: 700,
    data: await readFile(path.join(interDir, 'inter-latin-700-normal.woff2')),
  },
];

const items = makeItems(3);

const table = (
  <table tw="w-full border border-slate-300 text-[12px]" style={{ borderCollapse: 'collapse' }}>
    <thead>
      <tr tw="bg-slate-100 font-bold">
        <th tw="p-2 text-left border-b border-slate-300">SKU</th>
        <th tw="p-2 text-left border-b border-slate-300 w-[45%]">Description</th>
        <th tw="p-2 text-right border-b border-slate-300">Qty</th>
        <th tw="p-2 text-right border-b border-slate-300">Unit Price</th>
        <th tw="p-2 text-right border-b border-slate-300">Amount</th>
      </tr>
    </thead>
    <tbody>
      {items.map((it, i) => (
        <tr key={i} tw="border-b border-slate-200" style={{ breakInside: 'avoid' }}>
          <td tw="p-2 align-top">{it.sku}</td>
          <td tw="p-2 align-top">
            <div tw="flex flex-col">
              <span>{it.name}</span>
              <span tw="text-slate-500 text-[10px] mt-0.5">{it.detail}</span>
            </div>
          </td>
          <td tw="p-2 text-right align-top">{String(it.qty)}</td>
          <td tw="p-2 text-right align-top">{money(it.unit)}</td>
          <td tw="p-2 text-right align-top">{money(it.qty * it.unit)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

await writeFile(
  'exp-d-invoicetable.pdf',
  await render(table, {
    size: 'a4',
    fonts,
    fontFamilies: ['Inter'],
  }),
);
console.log('done');
