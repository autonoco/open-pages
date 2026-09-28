import { existsSync } from 'node:fs';
import { mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import chalk from 'chalk';
import { createServer, build as viteBuild } from 'vite';
import { createViteConfig } from '../vite/config.ts';
import { type EmailEntry, findEmails, renderEmail, stripLocTags } from '../vite/emails-plugin.ts';
import {
  extractMeta,
  findPages,
  loadUserConfig,
  type OpenPagesConfig,
  openPagesPlugin,
  type PageEntry,
} from '../vite/open-pages-plugin.ts';

export interface ExportOptions {
  /** Page or email ids to export. Empty/omitted = everything in the workspace. */
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

/**
 * Render emails without a browser: a middleware-mode dev server loads each
 * entry through Vite SSR, and `react-email` from the workspace renders it.
 * Each email lands as `<outDir>/<id>/index.html` plus `index.txt`.
 */
export async function exportEmails(opts: {
  userCwd: string;
  config: OpenPagesConfig;
  entries: EmailEntry[];
  outDir: string;
  onDone?: (entry: EmailEntry, target: string, ms: number) => void;
}): Promise<void> {
  const { userCwd, config, entries, outDir } = opts;
  if (entries.length === 0) return;
  const base = await createViteConfig({ userCwd, config, mode: 'serve' });
  // Rendering only needs the SSR environment. A second optimizer on the dev
  // server's cache dir would replace its deps folder mid-session and leave
  // every open page requesting outdated chunks, so this server gets its own
  // cache and never discovers or pre-bundles anything.
  const server = await createServer({
    ...base,
    logLevel: 'error',
    appType: 'custom',
    cacheDir: path.join(userCwd, 'node_modules', '.open-pages', 'email-render'),
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { ...base.server, middlewareMode: true, watch: null, hmr: false },
  });
  try {
    for (const entry of entries) {
      const started = performance.now();
      const rendered = await renderEmail(server, userCwd, entry);
      const target = path.join(outDir, entry.id);
      await mkdir(target, { recursive: true });
      await writeFile(path.join(target, 'index.html'), stripLocTags(rendered.html), 'utf8');
      await writeFile(path.join(target, 'index.txt'), rendered.text, 'utf8');
      opts.onDone?.(entry, target, Math.round(performance.now() - started));
    }
  } finally {
    await server.close();
  }
}

export async function exportPages(opts: ExportOptions = {}): Promise<void> {
  const userCwd = process.cwd();
  const config = await loadUserConfig(userCwd);
  const pagesDir = config.pagesDir ?? 'pages';
  const emailsDir = config.emailsDir ?? 'emails';
  const outDir = path.resolve(userCwd, opts.outDir ?? 'export');

  const entries = await findPages(userCwd, pagesDir);
  const emailEntries = await findEmails(userCwd, emailsDir);
  const pageIds = entries.map((e) => e.id);
  const emailIds = emailEntries.map((e) => e.id);
  if (pageIds.length === 0 && emailIds.length === 0) {
    throw new Error(`No pages found under ${pagesDir}/ and no emails under ${emailsDir}/`);
  }

  const explicit = opts.pages && opts.pages.length > 0 ? opts.pages : null;
  const unknown = (explicit ?? []).filter((id) => !pageIds.includes(id) && !emailIds.includes(id));
  if (unknown.length > 0) {
    const available = [...pageIds, ...emailIds.map((id) => `${id} (email)`)].join(', ');
    throw new Error(`Page not found: ${unknown.join(', ')} (available: ${available})`);
  }
  const requestedPages = explicit ? pageIds.filter((id) => explicit.includes(id)) : pageIds;
  const requestedEmails = explicit ? emailIds.filter((id) => explicit.includes(id)) : emailIds;

  const { readCoreVersion } = await import('../vite/version.ts');
  const coreVersion = readCoreVersion();

  await mkdir(outDir, { recursive: true });
  for (const id of requestedPages) {
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

  await exportEmails({
    userCwd,
    config,
    entries: emailEntries.filter((e) => requestedEmails.includes(e.id)),
    outDir: path.join(outDir, 'emails'),
    onDone: (_entry, target, ms) => {
      process.stdout.write(
        `${chalk.green('ok')}  ${path.relative(userCwd, target)}/  ${chalk.dim(`email · ${ms}ms`)}\n`,
      );
    },
  });

  const parts: string[] = [];
  if (requestedPages.length > 0) {
    parts.push(`${requestedPages.length} ${requestedPages.length === 1 ? 'page' : 'pages'}`);
  }
  if (requestedEmails.length > 0) {
    parts.push(`${requestedEmails.length} ${requestedEmails.length === 1 ? 'email' : 'emails'}`);
  }
  process.stdout.write(chalk.dim(`${parts.join(', ')} → ${path.relative(userCwd, outDir)}/\n`));
}
