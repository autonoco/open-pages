import { type DocMeta, PageNumber, type PageOptions, TotalPages } from '@autono/open-pdf';

export const meta: DocMeta = {
  title: 'Tables Doc',
  createdAt: '2026-01-02T00:00:00.000Z',
};

export const pageOptions: PageOptions = {
  size: 'a4',
  margin: { top: 56, right: 64, bottom: 72, left: 64 },
  footer: (
    <div tw="flex w-full justify-center text-[9px] text-slate-400">
      <span tw="flex">
        Page <PageNumber /> of <TotalPages />
      </span>
    </div>
  ),
};

const rows = Array.from({ length: 60 }, (_, i) => ({
  sku: `SKU-${String(i + 1).padStart(3, '0')}`,
  name: `Line item ${i + 1}`,
  amount: `$${((i + 1) * 12.5).toFixed(2)}`,
}));

export default function Tables() {
  return (
    <main tw="flex flex-col text-[11px] text-slate-800">
      <h1 tw="text-[28px] font-bold">Tables page one</h1>
      <table tw="mt-6 w-full border border-slate-200">
        <thead>
          <tr tw="bg-slate-50 font-bold">
            <th tw="border-b border-slate-200 p-2 text-left">SKU</th>
            <th tw="border-b border-slate-200 p-2 text-left">Item</th>
            <th tw="border-b border-slate-200 p-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.sku} tw="border-b border-slate-100">
              <td tw="p-2">{row.sku}</td>
              <td tw="p-2">{row.name}</td>
              <td tw="p-2 text-right">{row.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
