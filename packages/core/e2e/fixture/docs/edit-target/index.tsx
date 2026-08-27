import type { DocMeta } from '@autono/open-pdf';

export const meta: DocMeta = {
  title: 'Edit Target',
  createdAt: '2026-01-01T00:00:00.000Z',
};

export default function EditTarget() {
  return (
    <main tw="flex flex-col text-[12px] text-slate-800">
      <h1 tw="text-[32px] font-bold">Editable headline</h1>
      <p tw="mt-4">Editable body copy</p>
    </main>
  );
}
