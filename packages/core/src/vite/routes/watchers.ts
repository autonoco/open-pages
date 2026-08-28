import path from 'node:path';
import type { ViteDevServer } from 'vite';
import { PAGE_ID_RE } from '../../editing/page-ops.ts';
import { GLOBAL_SCOPE } from '../../files/assets.ts';
import type { ApiContext } from './context.ts';

// Surface folder-manifest and asset-tree mutations as HMR pings so the
// editor's panels can refresh without a full reload.
export function registerWatchers(server: ViteDevServer, ctx: ApiContext): void {
  server.watcher.add(ctx.manifestPath);
  server.watcher.on('change', (p) => {
    if (p === ctx.manifestPath) {
      server.ws.send({ type: 'custom', event: 'open-pages:files-changed' });
    }
  });

  server.watcher.add(ctx.globalAssetsRoot);
  const onAssetChange = (p: string) => {
    if (p.startsWith(ctx.globalAssetsRoot + path.sep) || p === ctx.globalAssetsRoot) {
      server.ws.send({
        type: 'custom',
        event: 'open-pages:assets-changed',
        data: { pageId: GLOBAL_SCOPE },
      });
      return;
    }
    if (!p.startsWith(ctx.pagesRoot + path.sep)) return;
    const rel = p.slice(ctx.pagesRoot.length + 1);
    const parts = rel.split(path.sep);
    if (parts.length < 3 || parts[1] !== 'assets') return;
    const pageId = parts[0];
    if (!PAGE_ID_RE.test(pageId)) return;
    server.ws.send({
      type: 'custom',
      event: 'open-pages:assets-changed',
      data: { pageId },
    });
  };
  server.watcher.on('add', onAssetChange);
  server.watcher.on('change', onAssetChange);
  server.watcher.on('unlink', onAssetChange);
}
