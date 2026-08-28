import type { PageMeta } from '@autono/open-pages';

export const meta: PageMeta = {
  title: 'Hot Page',
  createdAt: '2025-12-31T00:00:00.000Z',
};

export default function HotSwap() {
  return (
    <main className="min-h-screen bg-white px-8 py-16 text-slate-800">
      <h1 className="text-4xl font-bold">Hot swap headline</h1>
      <p className="mt-4">Hot swap body copy</p>
    </main>
  );
}
