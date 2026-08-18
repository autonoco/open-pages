import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import fg from 'fast-glob';
import { createElement } from 'react';
import { render } from 'takumi-pdf';
import { createServer, mergeConfig } from 'vite';
import { createViteConfig } from '../vite/config.ts';
import { loadUserConfig } from '../vite/open-pdf-plugin.ts';

export interface ExportOptions {
  /** Doc ids to export. Empty/omitted = every doc in the workspace. */
  docs?: string[];
  /** Output directory, relative to the project root. Default: `export`. */
  outDir?: string;
}

// Keep in sync with the preview worker's defaults
// (src/app/lib/pdf/render-worker.ts) — preview and export must agree.
const DEFAULT_PAGE = { size: 'a4', margin: 48 } as const;

const ENTRY_GLOB = '*/index.{tsx,jsx,ts,js}';

export async function exportPdfs(opts: ExportOptions = {}): Promise<void> {
  const userCwd = process.cwd();
  const config = await loadUserConfig(userCwd);
  const docsDir = config.docsDir ?? 'docs';
  const docsRoot = path.resolve(userCwd, docsDir);
  const outDir = path.resolve(userCwd, opts.outDir ?? 'export');

  const entries = await fg(ENTRY_GLOB, { cwd: docsRoot });
  const idsOnDisk = entries.map((e) => e.split('/')[0]).sort();
  if (idsOnDisk.length === 0) {
    throw new Error(`No docs found under ${docsDir}/`);
  }

  const requested = opts.docs && opts.docs.length > 0 ? opts.docs : idsOnDisk;
  const unknown = requested.filter((id) => !idsOnDisk.includes(id));
  if (unknown.length > 0) {
    throw new Error(`Doc not found: ${unknown.join(', ')} (available: ${idsOnDisk.join(', ')})`);
  }

  // A middleware-mode Vite server compiles the doc TSX with the exact same
  // pipeline the preview uses (plugins, aliases, JSX transform) — no port.
  const base = await createViteConfig({ userCwd, config });
  const server = await createServer(
    mergeConfig(base, {
      server: { middlewareMode: true },
      appType: 'custom',
      logLevel: 'error',
    }),
  );

  try {
    await mkdir(outDir, { recursive: true });
    for (const id of requested) {
      const entry = entries.find((e) => e.split('/')[0] === id);
      if (!entry) continue;
      const abs = path.join(docsRoot, entry);
      const started = performance.now();
      const mod = (await server.ssrLoadModule(abs)) as {
        default?: unknown;
        pageOptions?: Record<string, unknown>;
      };
      if (typeof mod.default !== 'function') {
        throw new Error(`${docsDir}/${entry} must default-export a component`);
      }
      const element = createElement(mod.default as Parameters<typeof createElement>[0]);
      const bytes: Uint8Array = await render(element, {
        ...DEFAULT_PAGE,
        ...(mod.pageOptions ?? {}),
      });
      const outFile = path.join(outDir, `${id}.pdf`);
      await writeFile(outFile, bytes);
      const ms = Math.round(performance.now() - started);
      const kb = (bytes.length / 1024).toFixed(1);
      process.stdout.write(
        `${chalk.green('ok')}  ${path.relative(userCwd, outFile)}  ${chalk.dim(`${kb} KB · ${ms}ms`)}\n`,
      );
    }
  } finally {
    await server.close();
  }

  const n = requested.length;
  process.stdout.write(
    chalk.dim(`${n} ${n === 1 ? 'document' : 'documents'} → ${path.relative(userCwd, outDir)}/\n`),
  );
}
