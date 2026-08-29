import { existsSync } from 'node:fs';
import { mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import chalk from 'chalk';
import { build as viteBuild } from 'vite';
import {
  extractMeta,
  findPages,
  loadUserConfig,
  type OpenPagesConfig,
  openPagesPlugin,
  type PageEntry,
} from '../vite/open-pages-plugin.ts';

export interface ExportOptions {
  /** Page ids to export. Empty/omitted = every page in the workspace. */
  pages?: string[];
  /** Output directory, relative to the project root. Default: `export`. */
  outDir?: string;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/**
 * Build one page into a self-contained static folder: `index.html` plus
 * hashed assets, with relative URLs so the folder deploys from any path.
 * React pages get a generated entry that mounts the component; HTML pages
 * build straight from their folder.
 */
export async function buildPage(opts: {
  userCwd: string;
  config: OpenPagesConfig;
  coreVersion: string;
  entry: PageEntry;
  outDir: string;
  base?: string;
}): Promise<void> {
  const { userCwd, config, coreVersion, entry, outDir } = opts;
  const base = opts.base ?? './';
  const assetsAbs = path.resolve(userCwd, config.assetsDir ?? 'assets');

  let root: string;
  if (entry.kind === 'html') {
    root = path.dirname(entry.file);
  } else {
    root = path.join(userCwd, 'node_modules', '.open-pages', 'export', entry.id);
    await rm(root, { recursive: true, force: true });
    await mkdir(root, { recursive: true });
    // Vite realpaths `root` but not the html input; a symlinked node_modules
    // would otherwise leave Rollup with a relative, escaping entry name.
    root = await realpath(root);
    const meta = extractMeta(await readFile(entry.file, 'utf8'));
    const title = escapeHtml(meta.title ?? entry.id);
    const description = extractDescription(await readFile(entry.file, 'utf8'));
    const themeCss = meta.theme
      ? path.resolve(userCwd, config.themesDir ?? 'themes', `${meta.theme}.css`)
      : null;
    const themeImport =
      themeCss && existsSync(themeCss) ? `import ${JSON.stringify(themeCss)};` : '';
    await writeFile(
      path.join(root, 'index.html'),
      [
        '<!doctype html>',
        '<html lang="en">',
        '  <head>',
        '    <meta charset="UTF-8" />',
        '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        `    <title>${title}</title>`,
        description ? `    <meta name="description" content="${escapeHtml(description)}" />` : '',
        '  </head>',
        '  <body>',
        '    <div id="root"></div>',
        '    <script type="module" src="./entry.tsx"></script>',
        '  </body>',
        '</html>',
        '',
      ]
        .filter((l) => l !== '')
        .join('\n'),
      'utf8',
    );
    await writeFile(
      path.join(root, 'entry.tsx'),
      [
        "import 'virtual:open-pages/pages.css';",
        themeImport,
        "import { StrictMode } from 'react';",
        "import { createRoot } from 'react-dom/client';",
        `import Page from ${JSON.stringify(entry.file)};`,
        '',
        "createRoot(document.getElementById('root')!).render(",
        '  <StrictMode>',
        '    <Page />',
        '  </StrictMode>,',
        ');',
        '',
      ]
        .filter((l) => l !== '')
        .join('\n'),
      'utf8',
    );
  }

  await viteBuild({
    root,
    base,
    configFile: false,
    envDir: userCwd,
    logLevel: 'error',
    plugins: [react(), tailwindcss(), openPagesPlugin({ userCwd, config, coreVersion })],
    resolve: { alias: { '@': userCwd, '@assets': assetsAbs } },
    build: {
      outDir,
      emptyOutDir: true,
      target: 'es2022',
    },
  });
}

const META_DESCRIPTION_RE = /(?:^|[\s,{])description\s*:\s*['"]([^'"]+)['"]/;

function extractDescription(src: string): string | null {
  const metaStart = src.search(/export\s+const\s+meta\b/);
  if (metaStart === -1) return null;
  const end = src.indexOf('};', metaStart);
  const body = src.slice(metaStart, end === -1 ? undefined : end);
  return body.match(META_DESCRIPTION_RE)?.[1] ?? null;
}

export async function exportPages(opts: ExportOptions = {}): Promise<void> {
  const userCwd = process.cwd();
  const config = await loadUserConfig(userCwd);
  const pagesDir = config.pagesDir ?? 'pages';
  const outDir = path.resolve(userCwd, opts.outDir ?? 'export');

  const entries = await findPages(userCwd, pagesDir);
  const idsOnDisk = entries.map((e) => e.id);
  if (idsOnDisk.length === 0) {
    throw new Error(`No pages found under ${pagesDir}/`);
  }

  const requested = opts.pages && opts.pages.length > 0 ? opts.pages : idsOnDisk;
  const unknown = requested.filter((id) => !idsOnDisk.includes(id));
  if (unknown.length > 0) {
    throw new Error(`Page not found: ${unknown.join(', ')} (available: ${idsOnDisk.join(', ')})`);
  }

  const { readCoreVersion } = await import('../vite/version.ts');
  const coreVersion = readCoreVersion();

  await mkdir(outDir, { recursive: true });
  for (const id of requested) {
    const entry = entries.find((e) => e.id === id);
    if (!entry) continue;
    const started = performance.now();
    const target = path.join(outDir, id);
    await buildPage({ userCwd, config, coreVersion, entry, outDir: target });
    const ms = Math.round(performance.now() - started);
    process.stdout.write(
      `${chalk.green('ok')}  ${path.relative(userCwd, target)}/  ${chalk.dim(`${entry.kind} · ${ms}ms`)}\n`,
    );
  }

  const n = requested.length;
  process.stdout.write(
    chalk.dim(`${n} ${n === 1 ? 'page' : 'pages'} → ${path.relative(userCwd, outDir)}/\n`),
  );
}
