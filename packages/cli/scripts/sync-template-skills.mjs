// Mirrors the canonical agent skills and the workspace shadcn set from
// @autono/open-pages into the scaffold template. Runs on every cli build so
// the template can never drift from core.
import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CORE = path.resolve(HERE, '..', '..', 'core');
const TEMPLATE = path.resolve(HERE, '..', 'template');

const CORE_SKILLS = path.join(CORE, 'skills');
const TEMPLATE_SKILLS = path.join(TEMPLATE, '.agents', 'skills');

async function main() {
  if (!existsSync(CORE_SKILLS)) {
    throw new Error(`Canonical skills not found at ${CORE_SKILLS}.`);
  }

  const names = (await readdir(CORE_SKILLS, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  await mkdir(TEMPLATE_SKILLS, { recursive: true });
  for (const entry of await readdir(TEMPLATE_SKILLS)) {
    await rm(path.join(TEMPLATE_SKILLS, entry), { recursive: true, force: true });
  }
  for (const name of names) {
    await cp(path.join(CORE_SKILLS, name), path.join(TEMPLATE_SKILLS, name), { recursive: true });
  }

  const WORKSPACE = path.join(CORE, 'workspace');
  const entries = ['ui', 'lib', 'hooks', 'styles', 'components.json'];
  for (const entry of entries) {
    const src = path.join(WORKSPACE, entry);
    if (!existsSync(src)) throw new Error(`Canonical workspace entry missing: ${src}`);
    const dst = path.join(TEMPLATE, entry);
    await rm(dst, { recursive: true, force: true });
    await cp(src, dst, { recursive: true });
  }

  process.stdout.write(
    `Mirrored ${names.length} skills and the workspace set into the template.\n`,
  );
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`error: ${message}\n`);
  process.exit(1);
});
