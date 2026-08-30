import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import fg from 'fast-glob';
import { loadConfigFromFile, normalizePath, type Plugin, type ViteDevServer } from 'vite';
import type { OpenPagesConfig } from '../config.ts';
import { PAGE_ID_RE } from '../editing/page-ops.ts';

export type { OpenPagesConfig };

export type PageKind = 'react' | 'html';

export type PageEntry = { id: string; kind: PageKind; file: string };

export type OpenPagesPluginOptions = {
  userCwd: string;
  config: OpenPagesConfig;
  coreVersion: string;
};

const CONFIG_FILE = 'open-pages.config.ts';

const PAGES_VMOD = 'virtual:open-pages/pages';
const CONFIG_VMOD = 'virtual:open-pages/config';
const FOLDERS_VMOD = 'virtual:open-pages/folders';
const PAGES_CSS_VMOD = 'virtual:open-pages/pages.css';

const WORKSPACE_SOURCE_DIRS = ['ui', 'lib', 'hooks'];

const ENTRY_GLOB = '*/index.{tsx,jsx,ts,js,html}';
const REACT_ENTRY_RE = /^index\.(tsx|jsx|ts|js)$/;

type FoldersManifest = {
  folders: unknown[];
  assignments: Record<string, string>;
};

async function readFoldersManifest(file: string): Promise<FoldersManifest> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as Partial<FoldersManifest>;
    return {
      folders: Array.isArray(parsed.folders) ? parsed.folders : [],
      assignments:
        parsed.assignments && typeof parsed.assignments === 'object'
          ? (parsed.assignments as Record<string, string>)
          : {},
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { folders: [], assignments: {} };
    }
    throw err;
  }
}

function resolved(id: string): string {
  return `\0${id}`;
}

// Page folders come and go through the dev API as well as the editor. The
// watcher is not a reliable signal for that on Linux (a removed directory
// surfaces as unlinkDir, not per-file unlinks), so mutations call this
// directly: drop the generated module and reload every client.
export function invalidatePagesModule(server: ViteDevServer): void {
  const mod = server.moduleGraph.getModuleById(resolved(PAGES_VMOD));
  if (mod) server.moduleGraph.invalidateModule(mod);
  server.ws.send({ type: 'full-reload' });
}

/**
 * Every `pages/<id>/index.*` entry. A folder with both a React entry and an
 * `index.html` is a React page — the HTML is then a plain asset of the page.
 */
export async function findPages(userCwd: string, pagesDir: string): Promise<PageEntry[]> {
  const abs = path.resolve(userCwd, pagesDir);
  if (!existsSync(abs)) return [];
  const hits = await fg(ENTRY_GLOB, { cwd: abs, absolute: true, onlyFiles: true });
  const byId = new Map<string, PageEntry>();
  for (const file of hits.sort()) {
    const rel = path.relative(abs, file);
    const [id, name] = rel.split(path.sep);
    const kind: PageKind = REACT_ENTRY_RE.test(name) ? 'react' : 'html';
    const existing = byId.get(id);
    if (!existing || (existing.kind === 'html' && kind === 'react')) {
      byId.set(id, { id, kind, file });
    }
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

const META_THEME_RE = /(?:^|[\s,{])theme\s*:\s*['"]([^'"]+)['"]/;
const META_CREATED_AT_RE = /(?:^|[\s,{])createdAt\s*:\s*['"]([^'"]+)['"]/;
const META_TITLE_RE = /(?:^|[\s,{])title\s*:\s*['"]([^'"]+)['"]/;
const HTML_TITLE_RE = /<title[^>]*>([^<]*)<\/title>/i;

type ExtractedMeta = { title: string | null; theme: string | null; createdAt: string | null };

const EMPTY_META: ExtractedMeta = { title: null, theme: null, createdAt: null };

export function extractMeta(src: string): ExtractedMeta {
  const metaStart = src.search(/export\s+const\s+meta\b/);
  if (metaStart === -1) return EMPTY_META;
  const eqIdx = src.indexOf('=', metaStart);
  if (eqIdx === -1) return EMPTY_META;
  const openBrace = src.indexOf('{', eqIdx);
  if (openBrace === -1) return EMPTY_META;
  let depth = 0;
  let closeBrace = -1;
  for (let i = openBrace; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        closeBrace = i;
        break;
      }
    }
  }
  if (closeBrace === -1) return EMPTY_META;
  const body = src.slice(openBrace + 1, closeBrace);
  return {
    title: body.match(META_TITLE_RE)?.[1] ?? null,
    theme: body.match(META_THEME_RE)?.[1] ?? null,
    createdAt: body.match(META_CREATED_AT_RE)?.[1] ?? null,
  };
}

export function extractHtmlMeta(src: string): ExtractedMeta {
  const title = src.match(HTML_TITLE_RE)?.[1]?.trim() ?? null;
  return { title: title || null, theme: null, createdAt: null };
}

async function readPageMeta(entry: PageEntry): Promise<ExtractedMeta> {
  try {
    const src = await fs.readFile(entry.file, 'utf8');
    return entry.kind === 'html' ? extractHtmlMeta(src) : extractMeta(src);
  } catch {
    return EMPTY_META;
  }
}

function parseCreatedAtMs(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

// Deduped across repeated virtual-module regenerations so dev HMR doesn't
// re-log the same ignored folder on every page change.
const warnedInvalidPageIds = new Set<string>();

export async function generatePagesModule(
  entries: PageEntry[],
  isDev: boolean,
): Promise<{ code: string; ignored: string[] }> {
  const scanned = await Promise.all(
    entries.map(async (entry) => {
      const importPath = isDev
        ? `@fs/${normalizePath(entry.file).replace(/^\/+/, '')}`
        : entry.file;
      const meta = await readPageMeta(entry);
      return { ...entry, importPath, meta, createdAt: parseCreatedAtMs(meta.createdAt) };
    }),
  );

  // Discovery globs every `pages/*/index.*`, but a page id is used in URLs,
  // filesystem paths, and the editing routes — all guarded by PAGE_ID_RE. Drop
  // folders with an unusable id instead of listing them as pages that then
  // fail every folder/edit action; `load` warns about each ignored folder.
  const valid = scanned.filter((e) => PAGE_ID_RE.test(e.id));
  const ignored = scanned.filter((e) => !PAGE_ID_RE.test(e.id)).map((e) => e.id);

  const kinds: Record<string, PageKind> = {};
  const themesMap: Record<string, string> = {};
  const createdAtMap: Record<string, number> = {};
  for (const e of valid) {
    kinds[e.id] = e.kind;
    if (e.meta.theme) themesMap[e.id] = e.meta.theme;
    if (e.createdAt !== null) createdAtMap[e.id] = e.createdAt;
  }
  const importTokens = JSON.stringify(
    Object.fromEntries(valid.filter((e) => e.kind === 'react').map((e) => [e.id, 0])),
  );
  const devRuntime = isDev
    ? `
const pageImportTokens = ${importTokens};
if (import.meta.hot) {
  import.meta.hot.on('open-pages:page-changed', (data) => {
    const ids = Array.isArray(data?.pageIds) ? data.pageIds : data?.pageId ? [data.pageId] : [];
    const token = Date.now();
    for (const id of ids) {
      if (Object.prototype.hasOwnProperty.call(pageImportTokens, id)) pageImportTokens[id] = token;
    }
  });
}
`
    : '';
  const cases = valid
    .map((e) => {
      if (e.kind === 'html') {
        const mod = { meta: { title: e.meta.title ?? e.id } };
        return `    case ${JSON.stringify(e.id)}: return Promise.resolve(${JSON.stringify(mod)});`;
      }
      const importExpr = isDev
        ? `import(/* @vite-ignore */ import.meta.env.BASE_URL + ${JSON.stringify(`${e.importPath}?t=`)} + pageImportTokens[${JSON.stringify(e.id)}])`
        : `import(${JSON.stringify(e.importPath)})`;
      return `    case ${JSON.stringify(e.id)}: return ${importExpr};`;
    })
    .join('\n');

  const code = `// virtual:open-pages/pages — generated
export const pageIds = ${JSON.stringify(valid.map((e) => e.id))};
export const pageKinds = ${JSON.stringify(kinds)};
export const pageThemes = ${JSON.stringify(themesMap)};
export const pageCreatedAt = ${JSON.stringify(createdAtMap)};
${devRuntime}

export async function loadPage(id) {
  switch (id) {
${cases}
    default: throw new Error('Page not found: ' + id);
  }
}
`;
  return { code, ignored };
}

/**
 * Tailwind for page source. The workspace UI has its own stylesheet rooted
 * at the core app; pages live in the user's project, so they get a generated
 * stylesheet whose `@source` points at their directories. Written under
 * node_modules so Tailwind resolves `tailwindcss` from the workspace.
 */
export function pagesCssFile(userCwd: string): string {
  return path.join(userCwd, 'node_modules', '.open-pages', 'pages.css');
}

/**
 * The workspace's own stylesheet when it has one (the shadcn `tailwind.css`
 * entry from components.json, default `styles/globals.css`) — it carries the
 * theme tokens every installed component reads. Falls back to the generated
 * file for workspaces scaffolded without one.
 */
export function workspaceCssFile(userCwd: string): string | null {
  let rel = 'styles/globals.css';
  try {
    const cfg = JSON.parse(readFileSync(path.join(userCwd, 'components.json'), 'utf8')) as {
      tailwind?: { css?: string };
    };
    if (typeof cfg.tailwind?.css === 'string' && cfg.tailwind.css) rel = cfg.tailwind.css;
  } catch {}
  const abs = path.resolve(userCwd, rel);
  return existsSync(abs) ? abs : null;
}

// Resolved from this package, not the workspace: pnpm does not hoist
// tailwindcss into the user's node_modules, and the CSS lives there.
const TAILWIND_CSS = normalizePath(createRequire(import.meta.url).resolve('tailwindcss/index.css'));

function writePagesCss(userCwd: string, sources: string[]): string {
  const file = pagesCssFile(userCwd);
  const lines = [`@import ${JSON.stringify(TAILWIND_CSS)} source(none);`];
  for (const dir of sources) {
    lines.push(`@source ${JSON.stringify(normalizePath(dir))};`);
  }
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${lines.join('\n')}\n`, 'utf8');
  return file;
}

// Relative `src`/`href` in a served index.html would resolve against the
// `/__page/<id>/` URL, which is not a directory Vite knows. Point them at
// the page folder through /@fs so Vite serves and transforms them.
export function rewriteHtmlUrls(html: string, pageDir: string): string {
  const prefix = `/@fs/${normalizePath(pageDir).replace(/^\/+/, '')}/`;
  return html.replace(
    /(\s(?:src|href)=)(["'])(?!\/|[a-z][a-z0-9+.-]*:|#|\2)(?:\.\/)?([^"']+)\2/gi,
    (_m, attr: string, quote: string, rel: string) => `${attr}${quote}${prefix}${rel}${quote}`,
  );
}

// The file is part of the signature so that replacing a page's entry with a
// same-kind file (index.tsx -> index.jsx) still invalidates the module, whose
// import path embeds the old file.
export function pagesSignature(entries: PageEntry[]): string {
  return entries.map((e) => `${e.id}:${e.kind}:${e.file}`).join(',');
}

export function openPagesPlugin(opts: OpenPagesPluginOptions): Plugin {
  const { userCwd, config, coreVersion } = opts;
  const pagesDir = config.pagesDir ?? 'pages';
  const themesDir = config.themesDir ?? 'themes';
  const pagesRoot = path.resolve(userCwd, pagesDir);
  const themesRoot = path.resolve(userCwd, themesDir);
  const foldersManifestPath = path.join(pagesRoot, '.folders.json');

  let isDev = false;
  let cssFile = '';
  let generatedSignature = '';

  const pageIdForEntry = (p: string): { id: string; kind: PageKind } | null => {
    const rel = path.relative(pagesRoot, p);
    if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
    const parts = rel.split(path.sep);
    if (parts.length !== 2) return null;
    if (REACT_ENTRY_RE.test(parts[1])) return { id: parts[0], kind: 'react' };
    if (parts[1] === 'index.html') return { id: parts[0], kind: 'html' };
    return null;
  };
  let pageChangeTimer: ReturnType<typeof setTimeout> | null = null;
  const pendingPageChanges = new Set<string>();
  const queuePageChanged = (server: ViteDevServer, id: string) => {
    pendingPageChanges.add(id);
    if (pageChangeTimer) clearTimeout(pageChangeTimer);
    pageChangeTimer = setTimeout(() => {
      pageChangeTimer = null;
      const mod = server.moduleGraph.getModuleById(resolved(PAGES_VMOD));
      if (mod) server.moduleGraph.invalidateModule(mod);
      const pageIds = Array.from(pendingPageChanges);
      pendingPageChanges.clear();
      server.ws.send({
        type: 'custom',
        event: 'open-pages:page-changed',
        data: { pageIds },
      });
    }, 100);
  };

  return {
    name: 'open-pages',
    config(_c, env) {
      isDev = env.command === 'serve';
      cssFile =
        workspaceCssFile(userCwd) ??
        writePagesCss(userCwd, [
          pagesRoot,
          themesRoot,
          ...WORKSPACE_SOURCE_DIRS.map((d) => path.join(userCwd, d)),
        ]);
      return {
        server: { fs: { allow: [userCwd] } },
      };
    },
    resolveId(id) {
      if (id === PAGES_VMOD) return resolved(PAGES_VMOD);
      if (id === CONFIG_VMOD) return resolved(CONFIG_VMOD);
      if (id === FOLDERS_VMOD) return resolved(FOLDERS_VMOD);
      if (id === PAGES_CSS_VMOD) return cssFile;
      return null;
    },
    async load(id) {
      if (id === resolved(PAGES_VMOD)) {
        const entries = await findPages(userCwd, pagesDir);
        generatedSignature = pagesSignature(entries);
        const { code, ignored } = await generatePagesModule(entries, isDev);
        for (const pageId of ignored) {
          if (warnedInvalidPageIds.has(pageId)) continue;
          warnedInvalidPageIds.add(pageId);
          this.warn(
            `Ignoring page folder "${pageId}": page ids must match ${PAGE_ID_RE} (lowercase/uppercase letters, digits, "-", "_"). Rename the folder under "${pagesDir}/" to a kebab-case id so it appears in the browser and can be moved into folders.`,
          );
        }
        return code;
      }
      if (id === resolved(CONFIG_VMOD)) {
        const userBuild = config.build ?? {};
        const buildResolved = isDev
          ? { showPageBrowser: true, showPageUi: true }
          : {
              showPageBrowser: userBuild.showPageBrowser ?? true,
              showPageUi: userBuild.showPageUi ?? true,
            };
        const resolvedConfig = { ...config, build: buildResolved, version: coreVersion };
        return `export default ${JSON.stringify(resolvedConfig)};\n`;
      }
      if (id === resolved(FOLDERS_VMOD)) {
        const manifest = await readFoldersManifest(foldersManifestPath);
        return `export default ${JSON.stringify(manifest)};\n`;
      }
      return null;
    },
    handleHotUpdate(ctx) {
      const entry = pageIdForEntry(ctx.file);
      if (!entry) return;
      // React entries mix a component with `meta` exports, which makes
      // react-refresh bail into a full reload; the frame re-imports the
      // module itself on this event instead. HTML entries are not in the
      // module graph at all — the viewer reloads the frame on the same event.
      queuePageChanged(ctx.server, entry.id);
      return [];
    },
    configureServer(server) {
      // The dev API already reloads clients when it adds or removes a page,
      // and the watcher then reports the same files a beat later. Reload only
      // when the page set differs from what the module was last generated
      // from, so one mutation is one reload.
      let reloadTimer: ReturnType<typeof setTimeout> | null = null;
      const reload = () => {
        if (reloadTimer) clearTimeout(reloadTimer);
        reloadTimer = setTimeout(async () => {
          reloadTimer = null;
          try {
            const entries = await findPages(userCwd, pagesDir);
            if (pagesSignature(entries) === generatedSignature) return;
          } catch (err) {
            // Invalidate anyway: the module's load path rescans and surfaces
            // the error through Vite instead of leaving stale pages.
            server.config.logger.error(`[open-pages] failed to rescan pages: ${err}`, {
              error: err instanceof Error ? err : undefined,
            });
          }
          invalidatePagesModule(server);
        }, 150);
      };
      const isPageDir = (p: string) => path.dirname(p) === pagesRoot;
      // Vite's `root` is the core app dir, so chokidar doesn't watch the
      // user's pages folder by default. Add it explicitly — and pass the
      // directory itself, since Vite sets `disableGlobbing: true` and would
      // otherwise treat a glob pattern as a literal path.
      if (existsSync(pagesRoot)) server.watcher.add(pagesRoot);
      server.watcher.on('add', (p) => {
        if (pageIdForEntry(p)) reload();
      });
      server.watcher.on('unlink', (p) => {
        if (pageIdForEntry(p)) reload();
      });
      server.watcher.on('addDir', (p) => {
        if (isPageDir(p)) reload();
      });
      server.watcher.on('unlinkDir', (p) => {
        if (isPageDir(p)) reload();
      });
      server.watcher.on('change', (p) => {
        // index.html is served by the middleware below, not the module graph,
        // so handleHotUpdate never sees it.
        const entry = pageIdForEntry(p);
        if (entry?.kind === 'html') queuePageChanged(server, entry.id);
      });

      let foldersTimer: ReturnType<typeof setTimeout> | null = null;
      const invalidateFolders = () => {
        if (foldersTimer) clearTimeout(foldersTimer);
        foldersTimer = setTimeout(() => {
          foldersTimer = null;
          const mod = server.moduleGraph.getModuleById(resolved(FOLDERS_VMOD));
          if (mod) server.moduleGraph.invalidateModule(mod);
        }, 100);
      };
      server.watcher.add(foldersManifestPath);
      server.watcher.on('change', (p) => {
        if (p === foldersManifestPath) invalidateFolders();
      });
      server.watcher.on('add', (p) => {
        if (p === foldersManifestPath) invalidateFolders();
      });
      server.watcher.on('unlink', (p) => {
        if (p === foldersManifestPath) invalidateFolders();
      });

      // GET /__page/:id/index.html — a plain HTML page, served through Vite's
      // HTML pipeline (client injection, script transforms) from outside root.
      server.middlewares.use('/__page', async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://local');
        const m = url.pathname.match(/^\/([^/]+)\/(?:index\.html)?$/);
        if (!m || (req.method ?? 'GET') !== 'GET') return next();
        const pageId = decodeURIComponent(m[1]);
        if (!PAGE_ID_RE.test(pageId)) return next();
        const pageDir = path.join(pagesRoot, pageId);
        const file = path.join(pageDir, 'index.html');
        let raw: string;
        try {
          raw = await fs.readFile(file, 'utf8');
        } catch {
          return next();
        }
        try {
          const html = await server.transformIndexHtml(
            `/__page/${pageId}/index.html`,
            rewriteHtmlUrls(raw, pageDir),
            req.originalUrl,
          );
          res.statusCode = 200;
          res.setHeader('content-type', 'text/html');
          res.end(html);
        } catch (err) {
          next(err);
        }
      });
    },
  };
}

export async function loadUserConfig(userCwd: string): Promise<OpenPagesConfig> {
  const file = path.join(userCwd, CONFIG_FILE);
  if (!existsSync(file)) return {};
  const loaded = await loadConfigFromFile(
    { command: 'serve', mode: 'development' },
    file,
    userCwd,
    'silent',
  );
  return (loaded?.config ?? {}) as OpenPagesConfig;
}
