import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';

// The scaffolded shadcn set (ui/, lib/, hooks/) is the user's source, so a
// plain overwrite would eat their edits. The manifest remembers the canonical
// hash each file had when it was last written by us; a file that still
// matches is safe to replace, anything else is theirs and gets skipped.
export const UI_MANIFEST = path.join('ui', '.sync-manifest.json');

const ENTRIES = ['ui', 'lib', 'hooks'];

export interface SyncUiOptions {
  dryRun?: boolean;
  force?: boolean;
}

export interface UiSyncResult {
  added: string[];
  updated: string[];
  unchanged: string[];
  skipped: string[];
  forced: string[];
  removedUpstream: string[];
  addedDeps: string[];
}

function hashOf(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

async function collectFiles(dir: string, prefix = ''): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = prefix ? path.join(prefix, entry.name) : entry.name;
    if (entry.isDirectory()) {
      out.push(...(await collectFiles(path.join(dir, entry.name), rel)));
    } else if (entry.isFile()) {
      out.push(rel);
    }
  }
  return out;
}

type Manifest = Record<string, string>;

async function readManifest(file: string): Promise<Manifest | null> {
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8')) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Manifest;
    }
  } catch {}
  return null;
}

/** Hashes of the canonical set, keyed by workspace-relative path. */
export async function canonicalHashes(canonicalDir: string): Promise<Manifest> {
  const hashes: Manifest = {};
  for (const entry of ENTRIES) {
    const root = path.join(canonicalDir, entry);
    if (!existsSync(root)) continue;
    for (const rel of await collectFiles(root)) {
      const wsRel = path.join(entry, rel).split(path.sep).join('/');
      hashes[wsRel] = hashOf(await readFile(path.join(root, rel)));
    }
  }
  return hashes;
}

export async function syncUi(
  workspaceDir: string,
  canonicalDir: string,
  opts: SyncUiOptions = {},
): Promise<UiSyncResult> {
  const { dryRun = false, force = false } = opts;
  const result: UiSyncResult = {
    added: [],
    updated: [],
    unchanged: [],
    skipped: [],
    forced: [],
    removedUpstream: [],
    addedDeps: [],
  };

  const manifestPath = path.join(workspaceDir, UI_MANIFEST);
  const manifest = (await readManifest(manifestPath)) ?? {};
  const next: Manifest = {};
  const canonical = await canonicalHashes(canonicalDir);

  for (const [rel, canonicalHash] of Object.entries(canonical)) {
    const dst = path.join(workspaceDir, rel);
    const src = path.join(canonicalDir, rel);
    const write = async () => {
      if (dryRun) return;
      await mkdir(path.dirname(dst), { recursive: true });
      await writeFile(dst, await readFile(src));
    };

    if (!existsSync(dst)) {
      await write();
      next[rel] = canonicalHash;
      result.added.push(rel);
      continue;
    }
    const currentHash = hashOf(await readFile(dst));
    if (currentHash === canonicalHash) {
      next[rel] = canonicalHash;
      result.unchanged.push(rel);
      continue;
    }
    const pristine = manifest[rel] !== undefined && manifest[rel] === currentHash;
    if (pristine || force) {
      await write();
      next[rel] = canonicalHash;
      (pristine ? result.updated : result.forced).push(rel);
      continue;
    }
    // Edited by the user (or predates the manifest): theirs to keep.
    if (manifest[rel] !== undefined) next[rel] = manifest[rel];
    result.skipped.push(rel);
  }

  for (const rel of Object.keys(manifest)) {
    if (!(rel in canonical) && existsSync(path.join(workspaceDir, rel))) {
      next[rel] ??= manifest[rel];
      result.removedUpstream.push(rel);
    }
  }

  result.addedDeps = await ensureDeps(workspaceDir, canonicalDir, dryRun);

  if (!dryRun) {
    const sorted = Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)));
    await mkdir(path.dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');
  }
  return result;
}

async function ensureDeps(
  workspaceDir: string,
  canonicalDir: string,
  dryRun: boolean,
): Promise<string[]> {
  const depsFile = path.join(canonicalDir, 'deps.json');
  const pkgFile = path.join(workspaceDir, 'package.json');
  if (!existsSync(depsFile) || !existsSync(pkgFile)) return [];
  const wanted = JSON.parse(await readFile(depsFile, 'utf8')) as Record<string, string>;
  const pkg = JSON.parse(await readFile(pkgFile, 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const missing = Object.entries(wanted).filter(
    ([name]) => !pkg.dependencies?.[name] && !pkg.devDependencies?.[name],
  );
  if (missing.length === 0) return [];
  if (!dryRun) {
    pkg.dependencies ??= {};
    for (const [name, range] of missing) pkg.dependencies[name] = range;
    pkg.dependencies = Object.fromEntries(
      Object.entries(pkg.dependencies).sort(([a], [b]) => a.localeCompare(b)),
    );
    await writeFile(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
  }
  return missing.map(([name]) => name);
}

export function printUiSummary(result: UiSyncResult, dryRun: boolean): void {
  const header = dryRun
    ? chalk.bold('Dry run — no files written:')
    : chalk.bold('Synced the workspace ui set:');
  process.stdout.write(`${header}\n`);
  const row = (symbol: string, rel: string, label: string) =>
    process.stdout.write(`  ${symbol} ${rel} ${chalk.dim(`(${label})`)}\n`);
  for (const rel of result.added) row(chalk.green('+'), rel, 'added');
  for (const rel of result.updated) row(chalk.yellow('~'), rel, 'updated');
  for (const rel of result.forced) row(chalk.red('!'), rel, 'overwrote your edits (--force)');
  for (const rel of result.skipped) row(chalk.dim('#'), rel, 'edited by you — skipped');
  for (const rel of result.removedUpstream)
    row(chalk.dim('-'), rel, 'no longer shipped — yours to keep or delete');
  process.stdout.write(
    chalk.dim(
      `\n${result.added.length} added, ${result.updated.length + result.forced.length} updated, ${result.unchanged.length} unchanged, ${result.skipped.length} skipped.\n`,
    ),
  );
  if (result.skipped.length > 0 && result.forced.length === 0) {
    process.stdout.write(
      chalk.dim(
        'Skipped files differ from what was scaffolded. Re-run with --force to overwrite them.\n',
      ),
    );
  }
  if (result.addedDeps.length > 0) {
    process.stdout.write(
      `${chalk.yellow('!')} Added ${result.addedDeps.map((d) => chalk.bold(d)).join(', ')} to package.json — run your package manager's install.\n`,
    );
  }
}
