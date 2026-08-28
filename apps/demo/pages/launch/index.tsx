import type { PageMeta } from '@autono/open-pages';
import { useState } from 'react';

export const meta: PageMeta = {
  title: 'Meridian — Launch',
  description: 'Meridian turns your analytics into weekly decisions.',
  createdAt: '2026-08-28T00:00:00.000Z',
};

const features = [
  {
    title: 'One weekly brief',
    body: 'Every metric that moved, why it moved, and what to do next.',
  },
  { title: 'Sources you already have', body: 'Connect Mixpanel, Stripe, and Postgres in minutes.' },
  {
    title: 'Built for founders',
    body: 'No dashboards to babysit. Decisions arrive in your inbox.',
  },
];

const plans = [
  { name: 'Starter', price: 0, note: 'Up to 2 sources', cta: 'Start free' },
  { name: 'Growth', price: 49, note: 'Unlimited sources, Slack digest', cta: 'Start trial' },
  { name: 'Scale', price: 199, note: 'Custom models, SSO, priority support', cta: 'Talk to us' },
];

export default function Launch() {
  const [yearly, setYearly] = useState(false);

  return (
    <main className="min-h-screen bg-[#0b0b10] text-white antialiased">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-semibold tracking-tight">Meridian</span>
        <nav className="hidden gap-8 text-sm text-white/70 sm:flex">
          <a href="#features" className="hover:text-white">
            Features
          </a>
          <a href="#pricing" className="hover:text-white">
            Pricing
          </a>
          <a href="#faq" className="hover:text-white">
            FAQ
          </a>
        </nav>
        <a
          href="#pricing"
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
        >
          Get started
        </a>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
          Now in public beta
        </p>
        <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl">
          Your analytics, turned into decisions
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/60">
          Meridian reads your product data every week and writes the memo your team would have
          written, if it had the time.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <a
            href="#pricing"
            className="rounded-full bg-emerald-400 px-6 py-3 font-medium text-black hover:bg-emerald-300"
          >
            Start free
          </a>
          <a
            href="#features"
            className="rounded-full border border-white/20 px-6 py-3 font-medium text-white/80 hover:border-white/40"
          >
            See how it works
          </a>
        </div>
      </section>

      <section id="features" className="border-t border-white/10">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title}>
              <h2 className="text-xl font-semibold">{f.title}</h2>
              <p className="mt-2 text-white/60">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Pricing</h2>
            <button
              type="button"
              onClick={() => setYearly((v) => !v)}
              aria-pressed={yearly}
              className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/80"
            >
              {yearly ? 'Billed yearly · 2 months free' : 'Billed monthly'}
            </button>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {plans.map((p) => (
              <div key={p.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="font-semibold">{p.name}</h3>
                <p className="mt-4 text-4xl font-bold tabular-nums">
                  ${yearly ? Math.round(p.price * 10) : p.price}
                  <span className="text-base font-normal text-white/50">
                    {p.price === 0 ? '' : yearly ? '/yr' : '/mo'}
                  </span>
                </p>
                <p className="mt-2 text-sm text-white/60">{p.note}</p>
                <a
                  href="#top"
                  className="mt-6 block rounded-full bg-white/10 py-2 text-center text-sm font-medium hover:bg-white/20"
                >
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer id="faq" className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-white/40">
          <span>© 2026 Meridian Systems</span>
          <span>Built with open-pages</span>
        </div>
      </footer>
    </main>
  );
}
