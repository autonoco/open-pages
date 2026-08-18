// takumi-pdf implementation of the invoice.
// Idiomatic: Tailwind `tw` props, a real <table> with <thead> (repeats across
// pages), footer option with PageNumber/TotalPages primitives.
import { readFile } from 'node:fs/promises';
import { PdfRenderer, render } from 'takumi-pdf';
import { PageNumber, TotalPages } from 'takumi-pdf/primitives';
import { BILL_TO, COMPANY, type LineItem, money, totals } from './invoice-data.js';

// Rehydrate the locally-cached Google Fonts subsets (no network at bench time).
export async function loadFonts() {
  const raw = JSON.parse(await readFile(new URL('./fonts/inter.json', import.meta.url), 'utf8'));
  return raw.map((f: any) => {
    const bytes = Buffer.from(f.data, 'base64');
    const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    return { ...f, data: () => Promise.resolve(buf) };
  });
}

function Invoice({ items }: { items: LineItem[] }) {
  const t = totals(items);
  return (
    <main tw="flex flex-col text-[13px] leading-[1.25] text-neutral-900">
      {/* Header: company name + logo placeholder */}
      <div tw="flex items-center justify-between mb-[27px]">
        <div tw="flex flex-col">
          <h1 tw="text-[27px] font-bold m-0">{COMPANY.name}</h1>
          <p tw="text-[12px] text-neutral-600 mt-[5px] m-0">{COMPANY.address}</p>
        </div>
        <div tw="flex h-[85px] w-[85px] items-center justify-center border border-dashed border-neutral-400 text-[11px] text-neutral-400">
          LOGO
        </div>
      </div>

      {/* Bill-to + invoice meta */}
      <div tw="flex justify-between mb-[27px]">
        <div tw="flex flex-col">
          <span tw="text-[11px] font-bold uppercase text-neutral-500 mb-[5px]">Bill To</span>
          <span tw="font-bold">{BILL_TO.name}</span>
          <span>{BILL_TO.contact}</span>
          <span>{BILL_TO.address1}</span>
          <span>{BILL_TO.address2}</span>
          <span>{BILL_TO.email}</span>
        </div>
        <div tw="flex flex-col items-end">
          <span tw="text-[11px] font-bold uppercase text-neutral-500 mb-[5px]">Invoice</span>
          <span tw="font-bold">{COMPANY.invoiceNo}</span>
          <span>Date: {COMPANY.date}</span>
          <span>Due: {COMPANY.due}</span>
        </div>
      </div>

      {/* Line-item table: real table markup, thead repeats on later pages */}
      <table tw="w-full border-t border-neutral-900" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr tw="bg-neutral-100 border-b border-neutral-900 text-[12px]">
            <th tw="py-[8px] pr-[11px] text-left">Description</th>
            <th tw="py-[8px] text-right">Qty</th>
            <th tw="py-[8px] text-right">Unit Price</th>
            <th tw="py-[8px] text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.sku} tw="border-b border-neutral-300" style={{ breakInside: 'avoid' }}>
              <td tw="py-[8px] pr-[11px]">
                <div tw="flex flex-col">
                  <span>{it.description}</span>
                  <span tw="text-[11px] text-neutral-500 mt-[3px]">
                    {it.sku} — {it.detail}
                  </span>
                </div>
              </td>
              <td tw="py-[8px] text-right align-top">{it.qty}</td>
              <td tw="py-[8px] text-right align-top">{money(it.unitPrice)}</td>
              <td tw="py-[8px] text-right align-top">{money(it.qty * it.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div tw="flex justify-end mt-[16px]" style={{ breakInside: 'avoid' }}>
        <div tw="flex w-[293px] flex-col">
          <div tw="flex justify-between py-[4px]">
            <span>Subtotal</span>
            <span>{money(t.subtotal)}</span>
          </div>
          <div tw="flex justify-between py-[4px]">
            <span>Tax (7%)</span>
            <span>{money(t.tax)}</span>
          </div>
          <div tw="mt-[3px] flex justify-between border-t border-neutral-900 pt-[7px] text-[16px] font-bold">
            <span>Total Due</span>
            <span>{money(t.total)}</span>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div
        tw="mt-[32px] flex flex-col border-t border-neutral-300 pt-[11px]"
        style={{ breakInside: 'avoid' }}
      >
        <span tw="text-[11px] font-bold uppercase text-neutral-500 mb-[5px]">
          Terms &amp; Conditions
        </span>
        <p tw="text-[11px] leading-relaxed text-neutral-600 m-0">
          Payment is due within 30 days of the invoice date. Late payments accrue interest at 1.5%
          per month. Please reference the invoice number on all remittances. Wire details available
          on request. All services are provided under the Master Services Agreement dated January
          12, 2026.
        </p>
      </div>
    </main>
  );
}

// NOTE: the footer band spans the FULL page width (left/right page margins do
// not apply to header/footer bands), so the horizontal padding must be
// re-stated here to align the footer with the content column.
const footer = (
  <div tw="flex w-full items-center justify-between border-t border-neutral-300 px-[53px] pt-[8px] text-[11px] text-neutral-500">
    <span>
      {COMPANY.name} — {COMPANY.invoiceNo}
    </span>
    <span tw="flex">
      Page <PageNumber /> of <TotalPages />
    </span>
  </div>
);

type Fonts = Awaited<ReturnType<typeof loadFonts>>;

const renderOptions = (fonts: Fonts) => ({
  size: 'a4' as const,
  margin: { top: 53, right: 53, bottom: 'auto' as const, left: 53 },
  fonts,
  fontFamilies: ['Inter', 'sans-serif'],
  footer,
});

export async function renderInvoice(items: LineItem[], fonts: Fonts): Promise<Uint8Array> {
  return render(<Invoice items={items} />, renderOptions(fonts));
}

// Reused-renderer variant for warm benchmarking of many documents.
export function makeRenderer() {
  return new PdfRenderer();
}
export async function renderInvoiceWith(
  r: PdfRenderer,
  items: LineItem[],
  fonts: Fonts,
): Promise<Uint8Array> {
  return r.render(<Invoice items={items} />, renderOptions(fonts));
}
