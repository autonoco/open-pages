import path from 'node:path';
import * as readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { Command, Option } from 'commander';
import { assertViteResolvesToCore } from './preflight.ts';
import { detectSkillsDrift, syncSkills } from './sync.ts';
import { glyph, readVersion } from './ui.ts';

export function parsePort(value: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 65535) {
    throw new Error(`Invalid port: ${value}`);
  }
  return n;
}

interface ServerFlags {
  port?: number;
  host?: string | boolean;
  open?: boolean;
}

interface DevFlags extends ServerFlags {
  skillsCheck?: boolean;
}

async function runSkillsDriftCheck(skillsDir: string): Promise<void> {
  if (process.env.OPEN_PAGES_SKIP_SKILLS_CHECK === '1') return;

  let drift: Awaited<ReturnType<typeof detectSkillsDrift>>;
  try {
    drift = await detectSkillsDrift(skillsDir);
  } catch {
    return;
  }
  const stale = drift.filter((d) => d.status !== 'unchanged');
  if (stale.length === 0) return;

  const names = stale.map((d) => d.name).join(', ');
  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
  const notice = `${chalk.yellow(glyph.warn)} Built-in skills are out of date: ${chalk.bold(names)}`;

  if (!interactive) {
    process.stderr.write(
      `\n  ${notice}\n    ${chalk.dim('Run `open-pages sync:skills` to update.')}\n`,
    );
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question(`\n  ${notice}\n    Sync now? ${chalk.dim('(Y/n)')} `))
      .trim()
      .toLowerCase();
    if (answer === '' || answer === 'y' || answer === 'yes') {
      process.stdout.write('\n');
      await syncSkills(skillsDir);
    } else {
      process.stdout.write(
        chalk.dim('    Skipped. Run `open-pages sync:skills` later to update.\n'),
      );
    }
  } finally {
    rl.close();
  }
}

interface BuildFlags {
  outDir?: string;
}

interface SyncFlags {
  dryRun?: boolean;
}

function resolveWorkspaceSetDir(): string {
  // dist/cli/bin.js → ../../workspace (package root + /workspace)
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..', 'workspace');
}

function resolveBuiltinSkillsDir(): string {
  // dist/cli/bin.js → ../../skills (package root + /skills)
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..', 'skills');
}

export async function run(argv: string[]): Promise<void> {
  const version = readVersion();

  const program = new Command();
  program
    .name('open-pages')
    .description('Author web pages in React — open-pages runs the rest.')
    .version(version, '-v, --version', 'print version')
    .helpOption('-h, --help', 'show help')
    .showHelpAfterError(chalk.dim('(run `open-pages --help` for usage)'));

  program
    .command('dev')
    .description('Start the dev server')
    .addOption(new Option('-p, --port <port>', 'port to listen on').argParser(parsePort))
    .addOption(new Option('--host [host]', 'expose on the network (optional host)'))
    .option('--open', 'open the browser on start')
    .option('--no-skills-check', 'skip the built-in skills drift check')
    .action(async (flags: DevFlags) => {
      if (flags.skillsCheck !== false) {
        await runSkillsDriftCheck(resolveBuiltinSkillsDir());
      }
      await assertViteResolvesToCore();
      const { dev } = await import('./dev.ts');
      await dev(flags);
    });

  program
    .command('build')
    .description('Build the workspace as a static site')
    .option('--out-dir <dir>', 'output directory (defaults to `dist`)')
    .action(async (flags: BuildFlags) => {
      await assertViteResolvesToCore();
      const { build } = await import('./build.ts');
      await build(flags);
    });

  program
    .command('preview')
    .description('Preview the production build')
    .addOption(new Option('-p, --port <port>', 'port to listen on').argParser(parsePort))
    .addOption(new Option('--host [host]', 'expose on the network (optional host)'))
    .option('--open', 'open the browser on start')
    .action(async (flags: ServerFlags) => {
      await assertViteResolvesToCore();
      const { preview } = await import('./preview.ts');
      await preview(flags);
    });

  program
    .command('export')
    .description('Build pages and emails into static folders (one per id)')
    .argument('[pages...]', 'page or email ids to export (default: all)')
    .option('--out-dir <dir>', 'output directory (defaults to `export`)')
    .action(async (pages: string[], flags: { outDir?: string }) => {
      await assertViteResolvesToCore();
      const { exportPages } = await import('./export.ts');
      await exportPages({ pages, outDir: flags.outDir });
    });

  program
    .command('sync:skills')
    .description('Sync built-in skills from @autono/open-pages into this workspace')
    .option('--dry-run', 'show what would change without writing')
    .action(async (flags: SyncFlags) => {
      await syncSkills(resolveBuiltinSkillsDir(), flags);
    });

  program
    .command('sync:ui')
    .description('Sync ui/, lib/, and hooks/ from @autono/open-pages — files you edited are kept')
    .option('--dry-run', 'show what would change without writing')
    .option('--force', 'overwrite files even where you have edited them')
    .action(async (flags: { dryRun?: boolean; force?: boolean }) => {
      const { printUiSummary, syncUi } = await import('./sync-ui.ts');
      const result = await syncUi(process.cwd(), resolveWorkspaceSetDir(), flags);
      printUiSummary(result, flags.dryRun ?? false);
    });

  program
    .command('update')
    .description('Update @autono/open-pages to the latest version and sync skills')
    .option('--force', 'reinstall even if already on the latest version')
    .option('--no-skills', 'skip the skills sync after updating')
    .option('--no-ui', 'skip the ui set sync after updating')
    .action(async (flags: { force?: boolean; skills?: boolean; ui?: boolean }) => {
      const { update } = await import('./update.ts');
      await update({ current: version, ...flags });
    });

  await program.parseAsync(argv, { from: 'user' });
}
