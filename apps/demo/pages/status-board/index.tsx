import type { PageMeta } from '@autono/open-pages';
import { useMemo, useState } from 'react';

export const meta: PageMeta = {
  title: 'Status board',
  description: 'Live service status with incident history.',
  createdAt: '2026-08-27T00:00:00.000Z',
};

type Status = 'operational' | 'degraded' | 'outage';

const services: { name: string; status: Status; uptime: number }[] = [
  { name: 'API', status: 'operational', uptime: 99.98 },
  { name: 'Dashboard', status: 'operational', uptime: 99.95 },
  { name: 'Webhooks', status: 'degraded', uptime: 99.4 },
  { name: 'Email delivery', status: 'operational', uptime: 99.99 },
  { name: 'Data exports', status: 'outage', uptime: 97.2 },
];

const incidents = [
  { date: '2026-08-27', title: 'Data exports queue stalled', status: 'investigating' },
  { date: '2026-08-25', title: 'Webhook retries delayed up to 4 min', status: 'monitoring' },
  { date: '2026-08-19', title: 'Elevated API latency in eu-west', status: 'resolved' },
];

const tone: Record<Status, string> = {
  operational: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  outage: 'bg-rose-500',
};

export default function StatusBoard() {
  const [filter, setFilter] = useState<'all' | Status>('all');
  const visible = useMemo(
    () => (filter === 'all' ? services : services.filter((s) => s.status === filter)),
    [filter],
  );
  const worst = services.some((s) => s.status === 'outage')
    ? 'Partial outage'
    : services.some((s) => s.status === 'degraded')
      ? 'Degraded performance'
      : 'All systems operational';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Acme status</h1>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-4 text-lg font-medium">
          {worst}
        </div>

        <div className="mt-8 flex gap-2 text-sm">
          {(['all', 'operational', 'degraded', 'outage'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={
                filter === f
                  ? 'rounded-full bg-slate-900 px-3 py-1 text-white'
                  : 'rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:border-slate-400'
              }
            >
              {f}
            </button>
          ))}
        </div>

        <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {visible.map((s) => (
            <li key={s.name} className="flex items-center gap-3 px-5 py-3">
              <span className={`size-2.5 rounded-full ${tone[s.status]}`} aria-hidden />
              <span className="flex-1 font-medium">{s.name}</span>
              <span className="text-sm capitalize text-slate-500">{s.status}</span>
              <span className="w-16 text-right font-mono text-sm tabular-nums text-slate-500">
                {s.uptime.toFixed(2)}%
              </span>
            </li>
          ))}
        </ul>

        <h2 className="mt-12 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Recent incidents
        </h2>
        <ol className="mt-3 space-y-3">
          {incidents.map((i) => (
            <li key={i.date + i.title} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-medium">{i.title}</span>
                <span className="shrink-0 font-mono text-xs text-slate-400">{i.date}</span>
              </div>
              <span className="mt-1 inline-block text-xs capitalize text-slate-500">
                {i.status}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
