import type { ViteDevServer } from 'vite';
import { validateMutationRequest } from '../../http/request-guard.ts';
import {
  detectPackageManager,
  fetchLatest,
  formatCommand,
  invalidateLatestCache,
  isOutdated,
  localOpenPagesCommand,
  type PackageManager,
  runCommand,
  updateCommandFor,
} from '../../shared/update-package.ts';
import { type ApiContext, json } from './context.ts';

export { detectPackageManager, updateCommandFor };

// GET /__update-check  → { current, latest, outdated }
//   Compares the running @autono/open-pages version against the npm `latest`
//   dist-tag. Network/parse failures degrade to { latest: null, outdated: false }.
// POST /__update-package → { packageManager, command, latest, message }
//   Installs @autono/open-pages@latest with the detected package manager, then
//   runs `open-pages sync:skills`.

type CheckResult = { current: string; latest: string | null; outdated: boolean };
type UpdateResult = {
  packageManager: PackageManager;
  command: string;
  latest: string | null;
  message: string;
};

let updateInFlight: Promise<UpdateResult> | null = null;

async function updatePackage(ctx: ApiContext): Promise<UpdateResult> {
  const packageManager = await detectPackageManager(ctx.userCwd);
  const updateCommand = await updateCommandFor(packageManager, ctx.userCwd);
  const syncCommand = localOpenPagesCommand(ctx.userCwd, ['sync:skills']);

  await runCommand(updateCommand, ctx.userCwd);
  await runCommand(syncCommand, ctx.userCwd);

  invalidateLatestCache();
  const latest = await fetchLatest();
  return {
    packageManager,
    command: `${formatCommand(updateCommand)} && open-pages sync:skills`,
    latest,
    message: 'Updated @autono/open-pages and synced skills.',
  };
}

export function registerUpdateRoutes(server: ViteDevServer, ctx: ApiContext): void {
  server.middlewares.use('/__update-check', async (req, res, next) => {
    if ((req.method ?? 'GET') !== 'GET') return next();
    const latest = await fetchLatest();
    const result: CheckResult = {
      current: ctx.coreVersion,
      latest,
      outdated: latest ? isOutdated(ctx.coreVersion, latest) : false,
    };
    res.setHeader('cache-control', 'no-store');
    json(res, 200, result);
  });

  server.middlewares.use('/__update-package', async (req, res, next) => {
    if ((req.method ?? 'GET') !== 'POST') return next();

    const guard = validateMutationRequest(req);
    if (!guard.ok) return json(res, guard.status, { error: guard.error });

    try {
      updateInFlight ??= updatePackage(ctx).finally(() => {
        updateInFlight = null;
      });
      const result = await updateInFlight;
      json(res, 200, result);
    } catch (err) {
      json(res, 500, { error: err instanceof Error ? err.message : 'update failed' });
    }
  });
}
