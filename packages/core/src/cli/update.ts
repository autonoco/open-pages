import { readFile } from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import {
  detectPackageManager,
  fetchLatest,
  formatCommand,
  isOutdated,
  localOpenPdfCommand,
  PKG,
  runCommand,
  updateCommandFor,
} from '../shared/update-package.ts';

export interface UpdateOptions {
  current: string;
  force?: boolean;
  skills?: boolean;
}

// The workspace's installed copy, not the CLI driving the update — they differ
// when this runs from a checkout or a global install.
async function installedVersion(cwd: string): Promise<string | null> {
  try {
    const raw = await readFile(
      path.join(cwd, 'node_modules', ...PKG.split('/'), 'package.json'),
      'utf8',
    );
    return (JSON.parse(raw) as { version?: string }).version ?? null;
  } catch {
    return null;
  }
}

export async function update(opts: UpdateOptions): Promise<void> {
  const cwd = process.cwd();
  const [latest, installed] = await Promise.all([fetchLatest(), installedVersion(cwd)]);
  const current = installed ?? opts.current;

  if (latest && !isOutdated(current, latest) && !opts.force) {
    process.stdout.write(
      `${chalk.green('✓')} ${PKG} ${chalk.bold(current)} is the latest version.\n`,
    );
    return;
  }

  const target = latest ? chalk.bold(latest) : chalk.bold('latest');
  process.stdout.write(`Updating ${PKG} ${chalk.dim(current)} → ${target}\n`);

  const packageManager = await detectPackageManager(cwd);
  const install = updateCommandFor(packageManager);
  process.stdout.write(chalk.dim(`$ ${formatCommand(install)}\n`));
  await runCommand(install, cwd, { stdio: 'inherit' });

  if (opts.skills !== false) {
    process.stdout.write(chalk.dim('$ open-pdf sync:skills\n'));
    await runCommand(localOpenPdfCommand(cwd, ['sync:skills']), cwd, { stdio: 'inherit' });
  }

  process.stdout.write(
    `${chalk.green('✓')} Updated ${PKG} to ${target}. Restart \`open-pdf dev\` to use it.\n`,
  );
}
