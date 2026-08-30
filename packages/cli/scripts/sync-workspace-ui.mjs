// Mirrors the template's shadcn set (ui/, lib/, hooks/, styles/, components.json)
// into the in-repo workspaces. Copies, not symlinks: Vite resolves symlinked
// files to their real path and would then look for deps under packages/cli.
import { cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.resolve(HERE, '..', 'template');
const ROOT = path.resolve(HERE, '..', '..', '..');
const WORKSPACES = ['apps/demo', 'packages/core/e2e/fixture'];
const ENTRIES = ['ui', 'lib', 'hooks', 'styles', 'components.json'];

for (const ws of WORKSPACES) {
  for (const entry of ENTRIES) {
    const dst = path.join(ROOT, ws, entry);
    await rm(dst, { recursive: true, force: true });
    await cp(path.join(TEMPLATE, entry), dst, { recursive: true });
  }
  process.stdout.write(`synced ${ENTRIES.join(', ')} → ${ws}\n`);
}
