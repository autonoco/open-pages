const DATE = 'August 28, 2026';

const LINE_ITEMS = [
  {
    loc: 'index.tsx:41',
    name: 'Live preview that is the page',
    detail: 'The page runs in a real browser frame. What you see is what you ship.',
    qty: 'every save',
    amount: 'hot reload',
  },
  {
    loc: 'index.tsx:48',
    name: 'Click-to-source inspector',
    detail: 'Click any element on the page. Get its exact source line. Leave a comment.',
    qty: 'press i',
    amount: 'included',
  },
  {
    loc: 'index.tsx:55',
    name: 'Agent-applied comments',
    detail: 'Notes persist as markers in source. Your agent applies them and re-renders.',
    qty: '/apply-comments',
    amount: 'included',
  },
  {
    loc: 'index.tsx:62',
    name: 'React or plain HTML',
    detail: 'Tailwind via className, hooks, state, routing. Or drop in an index.html.',
    qty: 'pages/<id>/',
    amount: 'included',
  },
  {
    loc: 'index.tsx:69',
    name: 'Export: a static folder',
    detail: 'index.html plus hashed assets. Netlify, Vercel, Cloudflare, GitHub Pages, S3.',
    qty: 'open-pages export',
    amount: 'included',
  },
];

const SOURCE = [
  'import type { PageMeta }',
  "  from '@autono/open-pages';",
  "import { useState } from 'react';",
  '',
  'export const meta: PageMeta = {',
  "  title: 'The pitch',",
  '};',
  '',
  'export default function Page() {',
  '  const [open, setOpen] =',
  '    useState(false);',
  '  return (',
  '    <main className="px-6 py-24">',
  '      <h1 className="text-6xl',
  '        font-bold tracking-tight">',
  '        The web page framework',
  '        built for agents',
  '      </h1>',
  '      <button onClick={() =>',
  '        setOpen((v) => !v)}>',
  '        Start free',
  '      </button>',
  '    </main>',
  '  );',
  '}',
];

function Toolbar() {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] items-center gap-3 px-5 py-3 text-[13px]">
      {/* biome-ignore lint: static marketing img */}
      <img src="/mark.svg" alt="" width={22} height={22} />
      <span className="font-medium text-[#e8e5dd]">open-pages</span>
      <span className="hidden text-[#66625a] sm:inline">/</span>
      <span className="hidden text-[#8a867d] sm:inline">the-pitch</span>
      <span className="ml-auto hidden tabular-nums text-[#66625a] md:inline">
        hot reload · 24ms
      </span>
      <a
        href="https://docs.openpages.sh"
        className="rounded-md border border-[#33322e] px-3 py-1.5 text-[#c9c5bc] transition-colors hover:border-[#4a4842] hover:text-white"
      >
        Docs
      </a>
      <a
        href="https://github.com/autonoco/open-pages"
        className="rounded-md border border-[#33322e] px-3 py-1.5 text-[#c9c5bc] transition-colors hover:border-[#4a4842] hover:text-white"
      >
        GitHub
      </a>
    </div>
  );
}

function Sheet() {
  return (
    <div className="sheet anim-sheet relative mx-auto w-full max-w-[680px] px-8 py-10 sm:px-14 sm:py-14">
      {/* Letterhead */}
      <div className="flex items-start justify-between border-b border-[var(--rule)] pb-5">
        <div>
          <div className="text-[15px] font-semibold tracking-tight">open-pages</div>
          <div className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
            github.com/autonoco/open-pages
          </div>
        </div>
        <div className="text-right text-[11px] leading-relaxed text-[var(--ink-muted)]">
          <div>
            Page <span className="text-[var(--ink)]">the-pitch</span>
          </div>
          <div>{DATE}</div>
          <div>localhost:5173/p/the-pitch</div>
        </div>
      </div>

      {/* Title block */}
      <div className="inspectable mt-9" data-loc="index.tsx:17 · h1">
        {/* The inspector comment pin — the signature element */}
        <div className="anim-pin absolute -left-[264px] top-[0.4rem] hidden w-[228px] -rotate-[0.5deg] rounded-lg border border-[#d8d4cb] bg-[#fffdf7] p-3 shadow-[0_10px_30px_rgb(0_0_0/0.35)] xl:block">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--inspect)]" />
            <span className="code-font text-[10px] text-[#57534a]">h1 · index.tsx:17</span>
          </div>
          <div className="mt-1.5 text-[12px] leading-snug text-[#33302a]">
            “make the headline bigger”
          </div>
          <div className="mt-2 border-t border-[#eae6dc] pt-1.5 text-[10px] text-[#8a8578]">
            applied by your agent · hot-reloaded in 24ms
          </div>
          <span className="absolute -right-[37px] top-5 hidden h-px w-9 bg-[var(--inspect)] opacity-60 xl:block" />
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--seal)]">
          A framework
        </div>
        <h1 className="mt-2 text-[34px] font-semibold leading-[1.08] tracking-tight sm:text-[42px]">
          The web page framework
          <br />
          built for agents.
        </h1>
        <p className="mt-4 max-w-[46ch] text-[14.5px] leading-relaxed text-[#3d3a34]">
          Your coding agent writes this page as a React component. The preview you are reading is
          the real page in a browser frame. Hover anything here to see what your agent sees.
        </p>
      </div>

      {/* Line items */}
      <table className="mt-9 w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="border-b-2 border-[var(--ink)] text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            <th className="py-2 pr-3 font-semibold">Item</th>
            <th className="hidden py-2 pr-3 text-right font-semibold sm:table-cell">Via</th>
            <th className="py-2 text-right font-semibold">Cost</th>
          </tr>
        </thead>
        <tbody>
          {LINE_ITEMS.map((item) => (
            <tr key={item.loc} className="border-b border-[var(--rule)] align-top">
              <td className="py-3 pr-3">
                <div className="inspectable" data-loc={item.loc}>
                  <div className="font-semibold">{item.name}</div>
                  <div className="mt-0.5 text-[11.5px] leading-snug text-[var(--ink-muted)]">
                    {item.detail}
                  </div>
                </div>
              </td>
              <td className="code-font hidden whitespace-nowrap py-3 pl-2 pr-3 text-right text-[10px] text-[var(--ink-muted)] sm:table-cell">
                {item.qty}
              </td>
              <td className="py-3 text-right text-[12px]">{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex items-baseline justify-end gap-8 text-[13px]">
        <span className="text-[var(--ink-muted)]">Total due</span>
        <span className="text-[16px] font-semibold">
          $0.00 <span className="text-[11px] font-normal text-[var(--ink-muted)]">· MIT</span>
        </span>
      </div>

      {/* Signature line = the install command */}
      <div className="mt-10 border-t border-[var(--rule)] pt-6">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          Sign here to begin
        </div>
        <div className="code-font mt-3 flex items-baseline gap-3 text-[15px] sm:text-[17px]">
          <span className="select-none text-[var(--seal)]">$</span>
          <span>npm create @autono/open-pages my-pages</span>
        </div>
      </div>

      {/* Folio */}
      <div className="mt-12 flex justify-between text-[9.5px] text-[var(--ink-muted)]">
        <span>open-pages · a real web page</span>
        <span>desktop · tablet · mobile</span>
      </div>
    </div>
  );
}

function SourceStrip() {
  return (
    <div className="anim-strip hidden w-[320px] shrink-0 xl:block">
      <div className="code-font sticky top-8 overflow-hidden rounded-lg border border-[#25241f] bg-[#171714] p-4 text-[10.5px] leading-[1.7] text-[#8a867a]">
        <div className="mb-3 flex items-center justify-between text-[10px]">
          <span className="text-[#605d54]">pages/the-pitch/index.tsx</span>
          <span className="text-[#4d4a42]">agent-written</span>
        </div>
        {SOURCE.map((line, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static source listing, line number IS the identity
          <div key={`L${i}`} className="whitespace-pre">
            <span className="mr-3 inline-block w-4 select-none text-right text-[#45423b]">
              {i + 1}
            </span>
            <span
              className={
                i === 13 || i === 14 || i === 15 || i === 16 ? 'text-[#d9d5ca]' : undefined
              }
            >
              {line || ' '}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Loop() {
  const steps: [string, string][] = [
    ['Describe', 'Tell your agent what the page is. It runs /create-page and writes the React.'],
    [
      'Preview',
      'The dev server runs the real page in a browser frame and hot-reloads on every save.',
    ],
    ['Annotate', 'Press i, click anything, leave a note. It lands in the source as a marker.'],
    ['Ship', 'open-pages export writes a static folder. Deploy it anywhere.'],
  ];
  return (
    <section className="mx-auto mt-24 w-full max-w-[880px] px-6">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[#7d7970]">
        The loop
      </h2>
      <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-[#26251f] bg-[#26251f] sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(([name, body]) => (
          <div key={name} className="bg-[#181815] p-5">
            <div className="text-[14px] font-medium text-[#e8e5dd]">{name}</div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-[#8a867d]">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Agents() {
  const agents = ['Claude Code', 'Cursor', 'Codex', 'Gemini CLI', 'OpenCode', 'Windsurf', 'Zed'];
  return (
    <section className="mx-auto mt-20 w-full max-w-[880px] px-6 text-center">
      <p className="text-[12.5px] text-[#7d7970]">
        File-based skills, no MCP server. Works with the agent you already use:
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-[#a8a49b]">
        {agents.map((a) => (
          <span key={a}>{a}</span>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto mt-24 w-full max-w-[880px] px-6 pb-16">
      <div className="flex flex-col items-center gap-3 border-t border-[#26251f] pt-8 text-[12.5px] text-[#7d7970] sm:flex-row sm:justify-between">
        <span>MIT · built on the open-pdf and open-slide architecture</span>
        <div className="flex gap-5">
          <a className="transition-colors hover:text-white" href="https://docs.openpages.sh">
            Docs
          </a>
          <a
            className="transition-colors hover:text-white"
            href="https://github.com/autonoco/open-pages"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <Toolbar />
      <main className="mx-auto mt-6 flex w-full max-w-[1180px] items-start justify-center gap-10 px-5 sm:mt-10">
        <div className="w-full max-w-[680px]">
          <Sheet />
          <p className="mt-4 text-center text-[11.5px] text-[#66625a]">
            Hover the page. In the product this is Inspect mode: every element knows its source
            line.
          </p>
        </div>
        <SourceStrip />
      </main>
      <Loop />
      <Agents />
      <Footer />
    </div>
  );
}
