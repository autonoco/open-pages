import type { PageMeta } from '@autono/open-pages';
import { useState } from 'react';

export const meta: PageMeta = {
  title: 'Pricing Page',
  createdAt: '2026-01-02T00:00:00.000Z',
};

const plans = [
  { name: 'Starter', monthly: 0 },
  { name: 'Growth', monthly: 49 },
  { name: 'Scale', monthly: 199 },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  return (
    <main className="min-h-screen bg-white px-8 py-16 text-slate-800">
      <h1 className="text-4xl font-bold">Pricing headline</h1>
      <button
        type="button"
        onClick={() => setYearly((v) => !v)}
        aria-pressed={yearly}
        className="mt-6 rounded-full border border-slate-300 px-4 py-1 text-sm"
      >
        {yearly ? 'Billed yearly' : 'Billed monthly'}
      </button>
      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <li key={plan.name} className="rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold">{plan.name}</h2>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              ${yearly ? plan.monthly * 10 : plan.monthly}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
