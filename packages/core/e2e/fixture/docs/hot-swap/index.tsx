import type { DocMeta } from '@autono/open-pdf';

export const meta: DocMeta = {
  title: 'Hot Doc',
  createdAt: '2025-12-31T00:00:00.000Z',
};

export default function HotSwap() {
  return (
    <main tw="flex flex-col text-[12px] text-slate-800">
      <h1 tw="text-[32px] font-bold">Hot swap headline</h1>
      <p tw="mt-4">Hot swap body copy</p>
    </main>
  );
}
