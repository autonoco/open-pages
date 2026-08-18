// takumi-pdf implementation of the benchmark invoice.
// Idiomatic: HTML <table> markup with Tailwind classes, footer option with
// PageNumber/TotalPages primitives, repeating <thead> handled by the engine.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from 'takumi-pdf';
import { PageNumber, TotalPages } from 'takumi-pdf/primitives';
import { BILL_TO, COMPANY, META, money, totals } from './data.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const interDir = path.join(here, 'node_modules/@fontsource/inter/files');

// Font bytes loaded once at module scope so render timing excludes disk IO.
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

function LineItemsTable({ items }) {
  return (
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
}

function Invoice({ items }) {
  const t = totals(items);
  return (
    <main tw="flex flex-col text-[12px] text-gray-900">
      <div tw="flex justify-between mb-6">
        <div tw="flex flex-col">
          <h1 tw="text-[21px] font-bold m-0">{COMPANY.name}</h1>
          <span tw="text-slate-500">{COMPANY.addr1}</span>
          <span tw="text-slate-500">{COMPANY.addr2}</span>
          <span tw="text-slate-500">{COMPANY.email}</span>
        </div>
        <div tw="w-[72px] h-[72px] border border-dashed border-slate-400 flex items-center justify-center text-slate-500">
          LOGO
        </div>
      </div>

      <div tw="flex justify-between mb-5">
        <div tw="flex flex-col">
          <span tw="text-[13px] font-bold text-slate-700 mb-1">BILL TO</span>
          <span>{BILL_TO.name}</span>
          <span>{BILL_TO.contact}</span>
          <span>{BILL_TO.addr1}</span>
          <span>{BILL_TO.addr2}</span>
        </div>
        <div tw="flex flex-col items-end">
          <span tw="text-[27px] font-bold mb-1">INVOICE</span>
          <span>Invoice #: {META.number}</span>
          <span>Date: {META.date}</span>
          <span>Due: {META.due}</span>
          <span>Terms: {META.terms}</span>
        </div>
      </div>

      <LineItemsTable items={items} />

      <div tw="flex justify-end mt-4" style={{ breakInside: 'avoid' }}>
        <div tw="flex flex-col w-[290px]">
          <div tw="flex justify-between py-1">
            <span>Subtotal</span>
            <span>{money(t.subtotal)}</span>
          </div>
          <div tw="flex justify-between py-1">
            <span>Sales Tax (7%)</span>
            <span>{money(t.tax)}</span>
          </div>
          <div tw="flex justify-between border-t border-slate-700 mt-1 pt-2 font-bold text-[14px]">
            <span>Total Due</span>
            <span>{money(t.total)}</span>
          </div>
        </div>
      </div>

      <p tw="mt-6 text-slate-600">
        Payment is due within 30 days of the invoice date. Please reference the invoice number on
        all remittances. ACH details available on request. A 1.5% monthly finance charge applies to
        past-due balances.
      </p>
    </main>
  );
}

export async function renderInvoice(items) {
  return render(<Invoice items={items} />, {
    size: 'a4',
    margin: { top: 48, right: 53, bottom: 64, left: 53 },
    fonts,
    fontFamilies: ['Inter'],
    metadata: {
      title: `Invoice ${META.number}`,
      authors: [COMPANY.name],
      creationDate: '2026-08-17',
    },
    footer: (
      <div tw="flex w-full justify-center text-[10px] text-slate-400">
        Page <PageNumber /> of <TotalPages />
      </div>
    ),
  });
}
