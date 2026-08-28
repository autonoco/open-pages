import fs from 'node:fs/promises';
import type { ViteDevServer } from 'vite';
import {
  duplicatePageDir,
  PAGE_ID_RE,
  resolvePageEntry,
  rmPageDir,
  updateMetaTitleInSource,
  validatePageName,
} from '../../editing/page-ops.ts';
import { readManifest, writeManifest } from '../../files/folders.ts';
import { validateMutationRequest } from '../../http/request-guard.ts';
import { type ApiContext, json, readBody } from './context.ts';

// POST   /__pages/:id/duplicate          duplicate page directory { newId? }
// PATCH  /__pages/:id                    rename page (writes meta.title)
// DELETE /__pages/:id                    delete page directory + folder assignment

type DuplicatePageBody = { newId?: unknown };
type PagePatchBody = { name?: unknown };

export function registerPageRoutes(server: ViteDevServer, ctx: ApiContext): void {
  server.middlewares.use('/__pages', async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://local');
    const method = req.method ?? 'GET';

    try {
      const duplicateMatch = url.pathname.match(/^\/([^/]+)\/duplicate$/);
      if (duplicateMatch && method === 'POST') {
        const requestCheck = validateMutationRequest(req);
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const pageId = duplicateMatch[1];
        if (!PAGE_ID_RE.test(pageId)) return json(res, 400, { error: 'invalid pageId' });

        const body = (await readBody(req)) as DuplicatePageBody;
        if (body.newId !== undefined && typeof body.newId !== 'string') {
          return json(res, 400, { error: 'invalid newId' });
        }

        const duplicated = await duplicatePageDir(ctx.pagesRoot, pageId, body.newId);
        if (!duplicated.ok) return json(res, duplicated.status, { error: duplicated.error });

        const manifest = await readManifest(ctx.manifestPath);
        const folderId = manifest.assignments[pageId];
        if (folderId) {
          manifest.assignments[duplicated.pageId] = folderId;
          await writeManifest(ctx.manifestPath, manifest);
        }
        return json(res, 200, { ok: true, pageId: duplicated.pageId });
      }

      const idMatch = url.pathname.match(/^\/([^/]+)$/);
      if (!idMatch) return next();
      const pageId = idMatch[1];
      if (!PAGE_ID_RE.test(pageId)) return json(res, 400, { error: 'invalid pageId' });

      if (method === 'PATCH') {
        const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const body = (await readBody(req)) as PagePatchBody;
        const name = validatePageName(body.name);
        if (!name) return json(res, 400, { error: 'invalid name' });

        const entry = resolvePageEntry(ctx.pagesRoot, pageId);
        if (!entry) return json(res, 400, { error: 'invalid pageId' });

        let source: string;
        try {
          source = await fs.readFile(entry, 'utf8');
        } catch {
          return json(res, 404, { error: 'page not found' });
        }

        const updated = updateMetaTitleInSource(source, name);
        if (updated === null) {
          return json(res, 422, {
            error: 'could not locate a safe place to write meta.title in index.tsx',
          });
        }
        if (updated !== source) {
          await fs.writeFile(entry, updated, 'utf8');
        }
        // The TSX edit lands through Vite's normal HMR pipeline, but the
        // React state holding `page.meta` in the editor won't re-fetch on
        // its own — tell every client to refresh so the new title shows up.
        server.ws.send({ type: 'full-reload' });
        return json(res, 200, { ok: true, pageId, name });
      }

      if (method === 'DELETE') {
        const requestCheck = validateMutationRequest(req);
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const removed = await rmPageDir(ctx.pagesRoot, pageId);
        if (!removed) return json(res, 404, { error: 'page not found' });

        const manifest = await readManifest(ctx.manifestPath);
        delete manifest.assignments[pageId];
        await writeManifest(ctx.manifestPath, manifest);
        return json(res, 200, { ok: true });
      }

      return next();
    } catch (err) {
      json(res, 500, { error: String((err as Error).message ?? err) });
    }
  });
}
