import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PackageManager } from './package-manager.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = resolve(HERE, '..', 'template');
const IS_WINDOWS = process.platform === 'win32';

export interface ScaffoldOptions {
  target: string;
  force: boolean;
  name: string | undefined;
}

export function sanitizeDirName(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '.' || trimmed === '..') return trimmed;
  const cleaned = trimmed
    .replace(/\s+/g, '-')
    .replace(/[^\\\p{L}\p{N}_./-]/gu, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/-*([/\\])-*/g, '$1');
  if (cleaned === '' || /^[/\\]+$/.test(cleaned)) return 'my-pages';
  return cleaned;
}

export async function isDirNonEmpty(target: string): Promise<boolean> {
  if (!existsSync(target)) return false;
  const entries = await readdir(target);
  return entries.some((e) => !e.startsWith('.'));
}

declare const __CORE_VERSION_AT_BUILD__: string;

function coreVersionRange(): string {
  return `^${__CORE_VERSION_AT_BUILD__}`;
}

async function linkOrCopy(relSrc: string, dst: string): Promise<void> {
  await rm(dst, { recursive: true, force: true });
  if (IS_WINDOWS) {
    await cp(resolve(dirname(dst), relSrc), dst, { recursive: true });
    return;
  }
  await symlink(relSrc, dst);
}

async function materializeTemplateLinks(target: string): Promise<void> {
  const claudeMd = join(target, 'CLAUDE.md');
  if (!existsSync(claudeMd) && existsSync(join(target, 'AGENTS.md'))) {
    await linkOrCopy('AGENTS.md', claudeMd);
  }

  const agentsSkills = join(target, '.agents', 'skills');
  if (!existsSync(agentsSkills)) return;

  const claudeSkills = join(target, '.claude', 'skills');
  await mkdir(claudeSkills, { recursive: true });

  const entries = await readdir(agentsSkills, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    await linkOrCopy(
      join('..', '..', '.agents', 'skills', entry.name),
      join(claudeSkills, entry.name),
    );
  }
}

// `open-pages sync:ui` only replaces files whose content still matches this
// manifest, so the user's edits survive updates. Recorded at scaffold time,
// when every file is pristine by definition.
async function writeUiManifest(target: string): Promise<void> {
  const manifest: Record<string, string> = {};
  for (const entry of ['ui', 'lib', 'hooks']) {
    const root = join(target, entry);
    if (!existsSync(root)) continue;
    for (const rel of await collectFiles(root)) {
      const wsRel = join(entry, rel).split(sep).join('/');
      manifest[wsRel] = createHash('sha256')
        .update(await readFile(join(root, rel)))
        .digest('hex');
    }
  }
  const sorted = Object.fromEntries(
    Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)),
  );
  await writeFile(
    join(target, 'ui', '.sync-manifest.json'),
    `${JSON.stringify(sorted, null, 2)}\n`,
  );
}

async function collectFiles(dir: string, prefix = ''): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = prefix ? join(prefix, entry.name) : entry.name;
    if (entry.isDirectory()) out.push(...(await collectFiles(join(dir, entry.name), rel)));
    else if (entry.isFile()) out.push(rel);
  }
  return out;
}

export async function scaffold(opts: ScaffoldOptions): Promise<void> {
  const { target, force, name } = opts;

  if (!existsSync(TEMPLATE_DIR)) {
    throw new Error(
      `Template missing at ${TEMPLATE_DIR}. If you are running from source, run \`pnpm --filter @autono/create-open-pages build\` first.`,
    );
  }

  await mkdir(target, { recursive: true });

  if ((await isDirNonEmpty(target)) && !force) {
    throw new Error(`Target ${target} is not empty. Pass --force to scaffold into it anyway.`);
  }

  await cp(TEMPLATE_DIR, target, { recursive: true });
  await materializeTemplateLinks(target);
  await writeUiManifest(target);

  const pkgPath = join(target, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as Record<string, unknown> & {
      dependencies?: Record<string, string>;
    };
    pkg.name = name ?? basename(target);
    pkg.version = '0.0.0';
    pkg.private = true;
    if (pkg.dependencies?.['@autono/open-pages']) {
      pkg.dependencies['@autono/open-pages'] = coreVersionRange();
    }
    await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  }

  await writeFile(join(target, '.gitignore'), 'node_modules\ndist\nexport\n.DS_Store\n');
}

export type InstallResult = { ok: true } | { ok: false; output: string };

// Output is captured rather than inherited so the package manager's own
// progress UI doesn't fight the spinner; it is shown only on failure.
export function installDependencies(pm: PackageManager, cwd: string): Promise<InstallResult> {
  return new Promise((res) => {
    let output = '';
    const child = spawn(pm, ['install'], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: IS_WINDOWS,
    });
    child.stdout?.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.on('error', (err) => res({ ok: false, output: err.message }));
    child.on('close', (code) => {
      if (code === 0) res({ ok: true });
      else res({ ok: false, output: output.trim() || `${pm} install exited with code ${code}` });
    });
  });
}
