import type { PageMeta } from '@autono/open-pages';

export const meta: PageMeta = {
  title: 'Edit Target',
  createdAt: '2026-01-01T00:00:00.000Z',
};

export default function EditTarget() {
  return (
    <main className="min-h-screen bg-white px-8 py-16 text-slate-800">
      <h1 className="text-4xl font-bold">Editable headline</h1>
      <p className="mt-4">Editable body copy</p>
    </main>
  );
}
