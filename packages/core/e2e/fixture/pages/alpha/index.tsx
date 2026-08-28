import type { PageMeta } from '@autono/open-pages';

export const meta: PageMeta = {
  title: 'Alpha Page',
  description: 'Alpha fixture landing page.',
  theme: 'plain',
  createdAt: '2026-01-03T00:00:00.000Z',
};

export default function Alpha() {
  return (
    <main className="min-h-screen bg-white px-8 py-16 text-slate-800">
      <h1 className="text-4xl font-bold tracking-tight">Alpha headline</h1>
      <p className="mt-4 text-lg text-slate-600">Opening content</p>
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Alpha second section</h2>
        <p className="mt-2">Middle content</p>
      </section>
      <footer className="mt-24 text-sm text-slate-400">Closing content</footer>
    </main>
  );
}
