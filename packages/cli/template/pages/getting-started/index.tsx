import type { PageMeta } from '@autono/open-pages';
import { useState } from 'react';

export const meta: PageMeta = {
  title: 'Welcome to open-pages',
  description: 'The web page framework built for agents.',
  createdAt: '2026-08-28T00:00:00.000Z',
};

const steps = [
  {
    title: 'Describe',
    body: 'Tell your agent what the page is. It runs /create-page and writes the React.',
  },
  {
    title: 'Preview',
    body: 'This workspace renders the real page in a real browser tab on every save.',
  },
  {
    title: 'Annotate',
    body: 'Press i, click anything, leave a note. It lands in the source as a comment marker.',
  },
  {
    title: 'Ship',
    body: 'Your agent runs /apply-comments. open-pages export writes a static folder you can deploy anywhere.',
  },
];

export default function GettingStarted() {
  const [active, setActive] = useState(0);

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased">
      <section className="mx-auto max-w-3xl px-6 pt-24 pb-16">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
          open-pages
        </span>
        <h1 className="mt-4 text-5xl font-bold leading-[1.05] tracking-tight">
          The web page framework built for agents
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
          This page is a React component at{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em]">
            pages/getting-started/index.tsx
          </code>
          . Your coding agent writes it, the workspace previews it live, and the export is plain
          HTML, CSS, and JS.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="grid gap-3 sm:grid-cols-4">
          {steps.map((step, i) => (
            <button
              key={step.title}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              className={
                active === i
                  ? 'rounded-lg border border-indigo-600 bg-indigo-600 px-4 py-3 text-left text-white'
                  : 'rounded-lg border border-slate-200 px-4 py-3 text-left transition-colors hover:border-slate-400'
              }
            >
              <span className="block font-mono text-xs opacity-60">0{i + 1}</span>
              <span className="mt-1 block font-semibold">{step.title}</span>
            </button>
          ))}
        </div>
        <p className="mt-6 min-h-[3.5rem] text-base leading-relaxed text-slate-700">
          {steps[active].body}
        </p>

        <div className="mt-16 rounded-xl bg-slate-50 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Try the loop
          </h2>
          <ol className="mt-3 space-y-2 text-slate-700">
            <li>1. Change any text in this file and watch the preview update.</li>
            <li>2. Switch the viewport to mobile in the toolbar. The layout is responsive.</li>
            <li>
              3. Ask your agent for something bigger: a landing page, a pricing table, a whole new
              page with <code className="font-mono">/create-page</code>.
            </li>
          </ol>
        </div>
      </section>
    </main>
  );
}
