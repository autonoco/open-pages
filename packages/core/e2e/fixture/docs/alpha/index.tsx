import { type DocMeta, PageNumber, type PageOptions, TotalPages } from '@autono/open-pdf';

export const meta: DocMeta = {
  title: 'Alpha Doc',
  theme: 'plain',
  createdAt: '2026-01-03T00:00:00.000Z',
};

export const pageOptions: PageOptions = {
  size: 'a4',
  margin: { top: 56, right: 64, bottom: 72, left: 64 },
  footer: (
    <div tw="flex w-full justify-end text-[9px] text-slate-400">
      <span tw="flex">
        Page <PageNumber /> of <TotalPages />
      </span>
    </div>
  ),
};

export default function Alpha() {
  return (
    <main tw="flex flex-col text-[12px] text-slate-800">
      <h1 tw="text-[32px] font-bold">Alpha page one</h1>
      <p tw="mt-4">Opening content</p>
      <div tw="flex flex-col" style={{ breakBefore: 'page' }}>
        <h1 tw="text-[32px] font-bold">Alpha page two</h1>
        <p tw="mt-4">Middle content</p>
      </div>
      <div tw="flex flex-col" style={{ breakBefore: 'page' }}>
        <h1 tw="text-[32px] font-bold">Alpha page three</h1>
        <p tw="mt-4">Closing content</p>
      </div>
    </main>
  );
}
