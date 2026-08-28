import type { ServerResponse } from 'node:http';
import path from 'node:path';
import type { Connect } from 'vite';
import { PAGE_ID_RE } from '../../editing/page-ops.ts';

export type ApiContext = {
  userCwd: string;
  pagesDir: string;
  pagesRoot: string;
  globalAssetsRoot: string;
  manifestPath: string;
  coreVersion: string;
};

export type ApiPluginOptions = {
  userCwd: string;
  pagesDir?: string;
  assetsDir?: string;
  coreVersion: string;
};

export function makeContext(opts: ApiPluginOptions): ApiContext {
  const userCwd = opts.userCwd;
  const pagesDir = opts.pagesDir ?? 'pages';
  const assetsDir = opts.assetsDir ?? 'assets';
  const pagesRoot = path.resolve(userCwd, pagesDir);
  const globalAssetsRoot = path.resolve(userCwd, assetsDir);
  const manifestPath = path.join(pagesRoot, '.folders.json');
  return {
    userCwd,
    pagesDir,
    pagesRoot,
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
