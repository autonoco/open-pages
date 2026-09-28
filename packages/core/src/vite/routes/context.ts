import type { ServerResponse } from 'node:http';
import path from 'node:path';
import type { Connect } from 'vite';
import { PAGE_ID_RE } from '../../editing/page-ops.ts';
import { foldersManifestPath } from '../../files/folders.ts';

export type ApiContext = {
  userCwd: string;
  pagesDir: string;
  pagesRoot: string;
  emailsDir: string;
  emailsRoot: string;
  globalAssetsRoot: string;
  manifestPath: string;
  coreVersion: string;
};

export type ApiPluginOptions = {
  userCwd: string;
  pagesDir?: string;
  emailsDir?: string;
  assetsDir?: string;
  coreVersion: string;
};

export function makeContext(opts: ApiPluginOptions): ApiContext {
  const userCwd = opts.userCwd;
  const pagesDir = opts.pagesDir ?? 'pages';
  const emailsDir = opts.emailsDir ?? 'emails';
  const assetsDir = opts.assetsDir ?? 'assets';
  const pagesRoot = path.resolve(userCwd, pagesDir);
  const emailsRoot = path.resolve(userCwd, emailsDir);
  const globalAssetsRoot = path.resolve(userCwd, assetsDir);
  const manifestPath = foldersManifestPath(pagesRoot);
  return {
    userCwd,
    pagesDir,
    pagesRoot,
    emailsDir,
    emailsRoot,
    globalAssetsRoot,
    manifestPath,
    coreVersion: opts.coreVersion,
  };
}

export async function readBody(req: Connect.IncomingMessage): Promise<unknown> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

export function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

export function resolvePagePath(userCwd: string, pagesDir: string, pageId: string): string | null {
  if (!PAGE_ID_RE.test(pageId)) return null;
  const pagesRoot = path.resolve(userCwd, pagesDir);
  const full = path.resolve(pagesRoot, pageId, 'index.tsx');
  if (!full.startsWith(pagesRoot + path.sep)) return null;
  return full;
}

export function resolvePageEntryPath(ctx: ApiContext, pageId: string): string | null {
  return resolvePagePath(ctx.userCwd, ctx.pagesDir, pageId);
}

export type CommentTarget = 'page' | 'email';

/** The `index.tsx` a comment marker lands in: a page entry, or an email entry. */
export function resolveCommentEntryPath(
  ctx: ApiContext,
  id: string,
  target: CommentTarget,
): string | null {
  return resolvePagePath(ctx.userCwd, target === 'email' ? ctx.emailsDir : ctx.pagesDir, id);
}
