import fs from 'node:fs/promises';
import type { ViteDevServer } from 'vite';
import {
  b64urlEncode,
  findInsertion,
  markerDeleteRegex,
  newCommentId,
  offsetToLine,
  parseMarkers,
} from '../../editing/comments.ts';
import { validateMutationRequest } from '../../http/request-guard.ts';
import {
  type ApiContext,
  type CommentTarget,
  json,
  readBody,
  resolveCommentEntryPath,
} from './context.ts';

// GET    /__comments        list markers for ?pageId=…[&target=email]
// POST   /__comments/add    add marker { pageId, target?, line, column?, text, hint? }
// DELETE /__comments/:id    remove marker (?pageId=…[&target=email])
//
// `target` defaults to `page`; `email` addresses `emails/<id>/index.tsx` with
// the same id rules and marker format.

type AddCommentBody = {
  pageId?: string;
  target?: string;
  line?: number;
  column?: number;
  text?: string;
  hint?: string;
};

function parseTarget(raw: unknown): CommentTarget {
  return raw === 'email' ? 'email' : 'page';
}

export function registerCommentRoutes(server: ViteDevServer, ctx: ApiContext): void {
  server.middlewares.use('/__comments', async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://local');
    const method = req.method ?? 'GET';

    try {
      if (method === 'GET' && url.pathname === '/') {
        const pageId = url.searchParams.get('pageId') ?? '';
        const file = resolveCommentEntryPath(
          ctx,
          pageId,
          parseTarget(url.searchParams.get('target')),
        );
        if (!file) return json(res, 400, { error: 'invalid pageId' });
        let source: string;
        try {
          source = await fs.readFile(file, 'utf8');
        } catch {
          return json(res, 404, { error: 'page not found' });
        }
        return json(res, 200, { comments: parseMarkers(source) });
      }

      if (method === 'POST' && url.pathname === '/add') {
        const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const body = (await readBody(req)) as AddCommentBody;
        const pageId = body.pageId ?? '';
        const file = resolveCommentEntryPath(ctx, pageId, parseTarget(body.target));
        if (!file) return json(res, 400, { error: 'invalid pageId' });
        if (!body.line || body.line < 1) return json(res, 400, { error: 'invalid line' });
        if (!body.text || typeof body.text !== 'string') {
          return json(res, 400, { error: 'missing text' });
        }

        let source: string;
        try {
          source = await fs.readFile(file, 'utf8');
        } catch {
          return json(res, 404, { error: 'page not found' });
        }

        const plan = findInsertion(source, body.line, body.column);
        if (!plan) {
          return json(res, 422, {
            error:
              'could not find a JSX container around line ' +
              `${body.line}. Try clicking a different element.`,
          });
        }

        const id = newCommentId();
        const ts = new Date().toISOString();
        const payload = b64urlEncode(JSON.stringify({ note: body.text, hint: body.hint }));
        const marker = `\n${plan.indent}{/* @page-comment id="${id}" ts="${ts}" text="${payload}" */}`;

        const next = source.slice(0, plan.offset) + marker + source.slice(plan.offset);
        await fs.writeFile(file, next, 'utf8');
        const markerLine = offsetToLine(next, plan.offset + 1);
        return json(res, 200, { id, line: markerLine });
      }

      if (method === 'DELETE' && url.pathname.startsWith('/')) {
        const requestCheck = validateMutationRequest(req);
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const id = url.pathname.slice(1);
        if (!/^c-[a-f0-9]+$/.test(id)) return json(res, 400, { error: 'invalid id' });
        const pageId = url.searchParams.get('pageId') ?? '';
        const file = resolveCommentEntryPath(
          ctx,
          pageId,
          parseTarget(url.searchParams.get('target')),
        );
        if (!file) return json(res, 400, { error: 'invalid pageId' });

        let source: string;
        try {
          source = await fs.readFile(file, 'utf8');
        } catch {
          return json(res, 404, { error: 'page not found' });
        }

        const lines = source.split('\n');
        const idRe = markerDeleteRegex(id);
        const hit = lines.findIndex((l) => idRe.test(l));
        if (hit === -1) return json(res, 404, { error: 'marker not found' });
        lines.splice(hit, 1);
        await fs.writeFile(file, lines.join('\n'), 'utf8');
        return json(res, 200, { ok: true });
      }

      next();
    } catch (err) {
      json(res, 500, { error: String((err as Error).message ?? err) });
    }
  });
}
