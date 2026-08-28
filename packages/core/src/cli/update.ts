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

export async function update(opts: UpdateOptions): Promise<void> {
  const cwd = process.cwd();
  const latest = await fetchLatest();

  if (latest && !isOutdated(opts.current, latest) && !opts.force) {
    process.stdout.write(
      `${chalk.green('✓')} ${PKG} ${chalk.bold(opts.current)} is the latest version.\n`,
    );
    return;
  }

  const target = latest ? chalk.bold(latest) : chalk.bold('latest');
  process.stdout.write(`Updating ${PKG} ${chalk.dim(opts.current)} → ${target}\n`);

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
