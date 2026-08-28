import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';
import { PAGE_ID_RE } from '../editing/page-ops.ts';

const TEXT_SNIPPET_MAX = 120;

export type CurrentPluginOptions = {
  userCwd: string;
  pagesDir?: string;
};

type IncomingPayload = {
  pageId?: unknown;
  pageTitle?: unknown;
  view?: unknown;
  selection?: unknown;
};

type IncomingSelection = {
  line?: unknown;
  column?: unknown;
  tagName?: unknown;
  text?: unknown;
};

type Selection = {
  line: number;
  column: number;
  tagName: string;
  text: string;
};

type Cached = {
  pageId: string;
  pageTitle: string;
  view: 'pages' | 'assets';
  pagePath: string;
  selection: Selection | null;
};

function parseSelection(raw: unknown): Selection | null {
  if (raw == null || typeof raw !== 'object') return null;
  const sel = raw as IncomingSelection;
  if (typeof sel.line !== 'number' || !Number.isFinite(sel.line)) return null;
  if (typeof sel.column !== 'number' || !Number.isFinite(sel.column)) return null;
  const tagName =
    typeof sel.tagName === 'string' ? sel.tagName.toLowerCase().slice(0, 32) : 'unknown';
  const text =
    typeof sel.text === 'string'
      ? sel.text.replace(/\s+/g, ' ').trim().slice(0, TEXT_SNIPPET_MAX)
      : '';
  return {
    line: Math.max(1, Math.floor(sel.line)),
    column: Math.max(0, Math.floor(sel.column)),
    tagName,
    text,
  };
}

export function currentPlugin(opts: CurrentPluginOptions): Plugin {
  const userCwd = opts.userCwd;
  const pagesDir = opts.pagesDir ?? 'pages';
  const outDir = path.join(userCwd, 'node_modules', '.open-pages');
  const outFile = path.join(outDir, 'current.json');
  const tmpFile = `${outFile}.tmp`;

  let cached: Cached | null = null;

  return {
    name: 'open-pages:current',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      server.ws.on('open-pages:current', async (raw: IncomingPayload) => {
        const next: Cached = cached
          ? { ...cached }
          : { pageId: '', pageTitle: '', view: 'pages', pagePath: '', selection: null };

        if (typeof raw?.pageId === 'string') {
          if (!PAGE_ID_RE.test(raw.pageId)) return;
          const pageTitle = typeof raw.pageTitle === 'string' ? raw.pageTitle : raw.pageId;
          const view = raw.view === 'assets' ? 'assets' : 'pages';
          const entry = existsSync(path.join(userCwd, pagesDir, raw.pageId, 'index.tsx'))
            ? 'index.tsx'
            : 'index.html';
          const pagePath = path.join(pagesDir, raw.pageId, entry).split(path.sep).join('/');

          if (cached?.pageId !== raw.pageId) next.selection = null;

          next.pageId = raw.pageId;
          next.pageTitle = pageTitle;
          next.view = view;
          next.pagePath = pagePath;
        }

        if ('selection' in raw) {
          next.selection = parseSelection(raw.selection);
        }

        if (!next.pageId) return;

        cached = next;

        const body = { ...next, updatedAt: new Date().toISOString() };
        try {
          await fs.mkdir(outDir, { recursive: true });
          await fs.writeFile(tmpFile, `${JSON.stringify(body, null, 2)}\n`, 'utf8');
          await fs.rename(tmpFile, outFile);
        } catch {
          // Best-effort: a transient FS error here shouldn't crash the dev server.
        }
      });
    },
  };
}
