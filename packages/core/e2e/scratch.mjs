// Copies the fixture project into e2e/.scratch/<name> so tests that write to
// disk (inspector saves, dev API mutations) never touch the committed fixture
// sources. node_modules is a real directory whose entries link back to the
// fixture's install, so paths under it (the agent cursor file, export
// scratch dirs) resolve inside the scratch project rather than the fixture.
import { cpSync, mkdirSync, readdirSync, rmSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const fixtureDir = path.join(here, 'fixture');

export function prepareScratchProject(name) {
  const dir = path.join(here, '.scratch', name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  cpSync(fixtureDir, dir, {
    recursive: true,
    filter: (src) => path.basename(src) !== 'node_modules',
  });
  const fixtureModules = path.join(fixtureDir, 'node_modules');
  const scratchModules = path.join(dir, 'node_modules');
  mkdirSync(scratchModules);
  for (const entry of readdirSync(fixtureModules)) {
    if (entry === '.open-pages') continue;
    symlinkSync(path.join(fixtureModules, entry), path.join(scratchModules, entry), 'junction');
  }
  return dir;
}
