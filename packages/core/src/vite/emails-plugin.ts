import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fg from 'fast-glob';
import type { EnvironmentModuleNode, Plugin, ViteDevServer } from 'vite';
import type { EmailModule } from '../app/lib/sdk.ts';
import type { OpenPagesConfig } from '../config.ts';
import { PAGE_ID_RE } from '../editing/page-ops.ts';
import { metaObjectBody } from './open-pages-plugin.ts';

export type EmailEntry = { id: string; file: string };

export type EmailsPluginOptions = {
  userCwd: string;
  config: OpenPagesConfig;
};

export const EMAILS_VMOD = 'virtual:open-pages/emails';
const ENTRY_GLOB = '*/index.{tsx,jsx}';
const ENTRY_RE = /^index\.(tsx|jsx)$/;
export const EMAIL_LOC_ATTR_RE = / data-op-loc="\d+:\d+"/g;

function resolved(id: string): string {
  return `\0${id}`;
}

export function invalidateEmailsModule(server: ViteDevServer): void {
  const mod = server.moduleGraph.getModuleById(resolved(EMAILS_VMOD));
  if (mod) server.moduleGraph.invalidateModule(mod);
  server.ws.send({ type: 'full-reload' });
}

export async function findEmails(userCwd: string, emailsDir: string): Promise<EmailEntry[]> {
  const abs = path.resolve(userCwd, emailsDir);
  if (!existsSync(abs)) return [];
  const hits = await fg(ENTRY_GLOB, { cwd: abs, absolute: true, onlyFiles: true });
  const byId = new Map<string, EmailEntry>();
  for (const file of hits.sort()) {
    const id = path.relative(abs, file).split(path.sep)[0];
    if (!byId.has(id) && PAGE_ID_RE.test(id)) byId.set(id, { id, file });
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export type ExtractedEmailMeta = {
  title: string | null;
  subject: string | null;
  description: string | null;
  createdAt: string | null;
};

const EMPTY_META: ExtractedEmailMeta = {
  title: null,
  subject: null,
  description: null,
  createdAt: null,
};

function metaField(body: string, key: string): string | null {
  return body.match(new RegExp(`(?:^|[\\s,{])${key}\\s*:\\s*['"]([^'"]+)['"]`))?.[1] ?? null;
}

export function extractEmailMeta(src: string): ExtractedEmailMeta {
  const body = metaObjectBody(src);
  if (body === null) return EMPTY_META;
  return {
    title: metaField(body, 'title'),
    subject: metaField(body, 'subject'),
    description: metaField(body, 'description'),
    createdAt: metaField(body, 'createdAt'),
  };
}

export async function generateEmailsModule(entries: EmailEntry[]): Promise<string> {
  const meta: Record<
    string,
    { title: string; subject: string | null; description: string | null }
  > = {};
  const createdAt: Record<string, number> = {};
  for (const entry of entries) {
    let extracted = EMPTY_META;
    try {
      extracted = extractEmailMeta(await fs.readFile(entry.file, 'utf8'));
    } catch {}
    meta[entry.id] = {
      title: extracted.title ?? entry.id,
      subject: extracted.subject,
      description: extracted.description,
    };
    const ms = extracted.createdAt ? Date.parse(extracted.createdAt) : Number.NaN;
    if (Number.isFinite(ms)) createdAt[entry.id] = ms;
  }
  return `// virtual:open-pages/emails — generated
export const emailIds = ${JSON.stringify(entries.map((e) => e.id))};
export const emailMeta = ${JSON.stringify(meta)};
export const emailCreatedAt = ${JSON.stringify(createdAt)};
`;
}

export function emailsSignature(entries: EmailEntry[]): string {
  return entries.map((e) => `${e.id}:${e.file}`).join(',');
}

export type RenderedEmail = {
  html: string;
  text: string;
  title: string;
  subject: string | null;
  /** Tailwind utilities the email compiler left as `class` names: they resolved to nothing. */
  unresolved: string[];
};

// The email Tailwind compiler inlines what it can and leaves the rest as a
// `class` attribute. Variants (`mobile:`) legitimately stay as classes backed
// by a `<style>` block, so only bare names count as unresolved.
export function unresolvedClasses(html: string): string[] {
  const seen = new Set<string>();
  for (const match of html.matchAll(/\sclass="([^"]*)"/g)) {
    for (const name of match[1].split(/\s+/)) {
      if (name && !name.includes(':')) seen.add(name);
    }
  }
  return [...seen].sort();
}

type ReactEmailRuntime = {
  createElement: (type: unknown) => unknown;
  render: (
    element: unknown,
    options?: { pretty?: boolean; plainText?: boolean },
  ) => Promise<string>;
};

const runtimes = new Map<string, Promise<ReactEmailRuntime>>();

// Emails render with the workspace's own `react` and `react-email`, the same
// copies the SSR-loaded module imports, so the element and the renderer never
// disagree about which React they belong to.
function workspaceRuntime(userCwd: string): Promise<ReactEmailRuntime> {
  let cached = runtimes.get(userCwd);
  if (!cached) {
    cached = (async () => {
      const require = createRequire(path.join(userCwd, 'package.json'));
      let reactPath: string;
      let reactEmailPath: string;
      try {
        reactPath = require.resolve('react');
        reactEmailPath = require.resolve('react-email');
      } catch {
        throw new Error(
          'Emails need the `react-email` package in this workspace. Install it with your package manager (for example `npm install react-email`), then reload.',
        );
      }
      const react = (await import(pathToFileURL(reactPath).href)) as {
        default?: ReactEmailRuntime;
        createElement?: ReactEmailRuntime['createElement'];
      };
      const reactEmail = (await import(pathToFileURL(reactEmailPath).href)) as {
        render?: ReactEmailRuntime['render'];
        default?: { render?: ReactEmailRuntime['render'] };
      };
      const createElement = react.createElement ?? react.default?.createElement;
      const render = reactEmail.render ?? reactEmail.default?.render;
      if (!createElement || !render) {
        throw new Error('Could not load `react` and `react-email` from this workspace.');
      }
      return { createElement, render };
    })();
    runtimes.set(userCwd, cached);
    cached.catch(() => runtimes.delete(userCwd));
  }
  return cached;
}

export async function renderEmail(
  server: ViteDevServer,
  userCwd: string,
  entry: EmailEntry,
): Promise<RenderedEmail> {
  const runtime = await workspaceRuntime(userCwd);
  const mod = (await server.ssrLoadModule(entry.file)) as Partial<EmailModule>;
  if (typeof mod.default !== 'function') {
    throw new Error(
      `emails/${entry.id}/index.tsx must default-export a component. Got: ${typeof mod.default}`,
    );
  }
  const element = runtime.createElement(mod.default);
  const [html, text] = await Promise.all([
    runtime.render(element, { pretty: true }),
    runtime.render(element, { plainText: true }),
  ]);
  return {
    html,
    text,
    title: mod.meta?.title ?? entry.id,
    subject: mod.meta?.subject ?? null,
    unresolved: unresolvedClasses(html),
  };
}

export function stripLocTags(html: string): string {
  return html.replace(EMAIL_LOC_ATTR_RE, '');
}

// emailcn's react-email sections and blocks style themselves with
// `bg-background`, `text-foreground`, `bg-primary`, `max-w-container`, and
// friends, but the `email-theme.ts` the same registry installs only defines
// `bg`, `fg`, `brand`, and `email`, so a freshly installed block renders
// without its colors. Until the registry agrees with itself, the theme
// module is patched at load time: every alias is added only when the theme
// config does not define it, so an upstream fix makes this a no-op.
const EMAIL_THEME_FILE_RE = /(^|\/)components\/email\/email-theme\.(ts|tsx|js|jsx|mjs)$/;
const CREATE_CONFIG_RE = /export\s+const\s+createEmailTailwindConfig\s*=/;

const EMAIL_THEME_ALIASES = `
export const createEmailTailwindConfig = (theme) =>
  __openPagesAliasEmailTheme(__openPagesCreateEmailTailwindConfig(theme), theme);

function __openPagesAliasEmailTheme(config, theme) {
  if (!config || typeof config !== 'object' || !theme || typeof theme !== 'object') return config;
  const extend = (config.theme ??= {}).extend ??= {};
  const colors = (extend.colors ??= {});
  const aliases = {
    background: theme.colorBackground,
    'background-muted': theme.colorBackgroundMuted,
    foreground: theme.colorText,
    'foreground-muted': theme.colorTextMuted,
    primary: theme.colorPrimary,
    'primary-fg': theme.colorPrimaryForeground,
    border: theme.colorBorder,
  };
  for (const [name, value] of Object.entries(aliases)) {
    if (!(name in colors) && typeof value === 'string') colors[name] = value;
  }
  const maxWidth = (extend.maxWidth ??= {});
  if (!('container' in maxWidth) && typeof theme.containerWidth === 'string') {
    maxWidth.container = theme.containerWidth;
  }
  return config;
}
`;

export function isEmailThemeModule(id: string, userCwd: string): boolean {
  const file = id.split(/[?#]/)[0].replace(/\\/g, '/');
  const root = userCwd.replace(/\\/g, '/');
  return file.startsWith(`${root}/`) && EMAIL_THEME_FILE_RE.test(file.slice(root.length + 1));
}

export function aliasEmailThemeModule(code: string): string | null {
  if (!CREATE_CONFIG_RE.test(code)) return null;
  return (
    code.replace(CREATE_CONFIG_RE, 'const __openPagesCreateEmailTailwindConfig =') +
    EMAIL_THEME_ALIASES
  );
}

function injectBeforeBodyEnd(html: string, snippet: string): string {
  const idx = html.lastIndexOf('</body>');
  return idx === -1 ? html + snippet : html.slice(0, idx) + snippet + html.slice(idx);
}

function errorDocument(message: string): string {
  const escaped = message.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Email error</title></head><body style="margin:0"><pre style="margin:0;padding:16px 20px;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;color:#b91c1c;background:#fef2f2;white-space:pre-wrap">${escaped}</pre></body></html>`;
}

export function emailsPlugin(opts: EmailsPluginOptions): Plugin {
  const { userCwd, config } = opts;
  const emailsDir = config.emailsDir ?? 'emails';
  const emailsRoot = path.resolve(userCwd, emailsDir);

  let generatedSignature = '';

  const emailIdForFile = (p: string): string | null => {
    const rel = path.relative(emailsRoot, p);
    if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
    const [id] = rel.split(path.sep);
    return id && PAGE_ID_RE.test(id) ? id : null;
  };
  const isEntryFile = (p: string): boolean => {
    const rel = path.relative(emailsRoot, p);
    const parts = rel.split(path.sep);
    return parts.length === 2 && ENTRY_RE.test(parts[1]);
  };

  // Which emails import a changed module: walk importers up to the entries.
  // Modules under `components/email/` or `lib/` reach several emails at once.
  const emailsImporting = (modules: EnvironmentModuleNode[]): Set<string> => {
    const ids = new Set<string>();
    const seen = new Set<EnvironmentModuleNode>();
    const queue = [...modules];
    while (queue.length) {
      const mod = queue.pop();
      if (!mod || seen.has(mod)) continue;
      seen.add(mod);
      if (mod.file) {
        const id = emailIdForFile(mod.file);
        if (id && isEntryFile(mod.file)) ids.add(id);
      }
      for (const importer of mod.importers) queue.push(importer);
    }
    return ids;
  };

  let changeTimer: ReturnType<typeof setTimeout> | null = null;
  const pendingChanges = new Set<string>();
  const queueEmailChanged = (server: ViteDevServer, ids: Iterable<string>) => {
    for (const id of ids) pendingChanges.add(id);
    if (changeTimer) clearTimeout(changeTimer);
    changeTimer = setTimeout(() => {
      changeTimer = null;
      const emailIds = Array.from(pendingChanges);
      pendingChanges.clear();
      if (emailIds.length === 0) return;
      server.ws.send({ type: 'custom', event: 'open-pages:email-changed', data: { emailIds } });
    }, 100);
  };

  return {
    name: 'open-pages:emails',
    resolveId(id) {
      return id === EMAILS_VMOD ? resolved(EMAILS_VMOD) : null;
    },
    async load(id) {
      if (id !== resolved(EMAILS_VMOD)) return null;
      const entries = await findEmails(userCwd, emailsDir);
      generatedSignature = emailsSignature(entries);
      return generateEmailsModule(entries);
    },
    transform(code, id) {
      if (!isEmailThemeModule(id, userCwd)) return null;
      const next = aliasEmailThemeModule(code);
      return next === null ? null : { code: next, map: null };
    },
    hotUpdate({ file, modules, server }) {
      if (this.environment.name !== 'ssr') return;
      const ids = emailsImporting(modules);
      const direct = emailIdForFile(file);
      if (direct) ids.add(direct);
      if (ids.size > 0) queueEmailChanged(server, ids);
    },
    configureServer(server) {
      let reloadTimer: ReturnType<typeof setTimeout> | null = null;
      const rescan = () => {
        if (reloadTimer) clearTimeout(reloadTimer);
        reloadTimer = setTimeout(async () => {
          reloadTimer = null;
          try {
            const entries = await findEmails(userCwd, emailsDir);
            if (emailsSignature(entries) === generatedSignature) return;
          } catch (err) {
            server.config.logger.error(`[open-pages] failed to rescan emails: ${err}`, {
              error: err instanceof Error ? err : undefined,
            });
          }
          invalidateEmailsModule(server);
        }, 150);
      };
      if (existsSync(emailsRoot)) server.watcher.add(emailsRoot);
      const onEntryEvent = (p: string) => {
        if (emailIdForFile(p) && isEntryFile(p)) rescan();
      };
      server.watcher.on('add', onEntryEvent);
      server.watcher.on('unlink', onEntryEvent);
      server.watcher.on('addDir', (p) => {
        if (path.dirname(p) === emailsRoot) rescan();
      });
      server.watcher.on('unlinkDir', (p) => {
        if (path.dirname(p) === emailsRoot) rescan();
      });
      // `meta` is read off the source, not the module, so a title or subject
      // edit needs the registry regenerated even though the entry set is the
      // same. The viewer re-renders the frame on the same event.
      server.watcher.on('change', (p) => {
        if (!emailIdForFile(p) || !isEntryFile(p)) return;
        const mod = server.moduleGraph.getModuleById(resolved(EMAILS_VMOD));
        if (mod) server.moduleGraph.invalidateModule(mod);
      });

      // GET /__email/:id/index.html — the rendered email, with the inspector
      // attached when the workspace embeds it (`?raw` for the shippable document).
      // GET /__email/:id/index.txt  — the plain-text alternative.
      // GET /__email/:id/index.json — title, subject, and unresolved utilities.
      server.middlewares.use('/__email', async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://local');
        const m = url.pathname.match(/^\/([^/]+)\/(index\.html|index\.txt|index\.json)$/);
        if (!m || (req.method ?? 'GET') !== 'GET') return next();
        const emailId = decodeURIComponent(m[1]);
        if (!PAGE_ID_RE.test(emailId)) return next();
        const entries = await findEmails(userCwd, emailsDir);
        const entry = entries.find((e) => e.id === emailId);
        if (!entry) {
          res.statusCode = 404;
          res.setHeader('content-type', 'text/plain; charset=utf-8');
          res.end(`Email not found: ${emailId}`);
          return;
        }
        const wantText = m[2] === 'index.txt';
        const wantJson = m[2] === 'index.json';
        const raw = url.searchParams.has('raw');
        try {
          const rendered = await renderEmail(server, userCwd, entry);
          if (rendered.unresolved.length > 0) {
            server.config.logger.warn(
              `[open-pages] email "${emailId}": ${rendered.unresolved.length} Tailwind ${rendered.unresolved.length === 1 ? 'class' : 'classes'} did not compile to inline styles: ${rendered.unresolved.join(' ')}`,
            );
          }
          res.statusCode = 200;
          res.setHeader('cache-control', 'no-store');
          if (wantJson) {
            res.setHeader('content-type', 'application/json');
            res.end(
              JSON.stringify({
                title: rendered.title,
                subject: rendered.subject,
                unresolved: rendered.unresolved,
              }),
            );
            return;
          }
          if (wantText) {
            res.setHeader('content-type', 'text/plain; charset=utf-8');
            res.end(rendered.text);
            return;
          }
          res.setHeader('content-type', 'text/html; charset=utf-8');
          if (raw) {
            res.end(stripLocTags(rendered.html));
            return;
          }
          const script = `<script type="module" src="${server.config.base}frame/email-inspect.ts"></script>`;
          res.end(injectBeforeBodyEnd(rendered.html, script));
        } catch (err) {
          const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
          server.config.logger.error(
            `[open-pages] email "${emailId}" failed to render:\n${message}`,
          );
          res.statusCode = 500;
          res.setHeader('cache-control', 'no-store');
          if (wantJson) {
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ error: message }));
            return;
          }
          if (wantText) {
            res.setHeader('content-type', 'text/plain; charset=utf-8');
            res.end(message);
            return;
          }
          const script = `<script type="module" src="${server.config.base}frame/email-inspect.ts"></script>`;
          res.setHeader('content-type', 'text/html; charset=utf-8');
          res.end(injectBeforeBodyEnd(errorDocument(message), script));
        }
      });
    },
  };
}
