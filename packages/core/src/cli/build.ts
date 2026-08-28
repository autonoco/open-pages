import path from 'node:path';
import { mergeConfig, build as viteBuild } from 'vite';
import { createViteConfig } from '../vite/config.ts';
import { findPages, loadUserConfig } from '../vite/open-pages-plugin.ts';
import { readCoreVersion } from '../vite/version.ts';
import { buildPage } from './export.ts';

export interface BuildOptions {
  outDir?: string;
}

export async function build(opts: BuildOptions = {}): Promise<void> {
  const userCwd = process.cwd();
  const config = await loadUserConfig(userCwd);
  const outDir = path.resolve(userCwd, opts.outDir ?? 'dist');
  const base = await createViteConfig({ userCwd, config, mode: 'build' });
  await viteBuild(mergeConfig(base, { build: { outDir } }));

  // HTML pages are served verbatim in dev; a static build gets each one
  // built into the spot the viewer's frame URL points at.
  const htmlPages = (await findPages(userCwd, config.pagesDir ?? 'pages')).filter(
    (e) => e.kind === 'html',
  );
  const coreVersion = readCoreVersion();
  const siteBase = config.base ?? '/';
  for (const entry of htmlPages) {
    await buildPage({
      userCwd,
      config,
      coreVersion,
      entry,
      outDir: path.join(outDir, '__page', entry.id),
      base: `${siteBase.replace(/\/$/, '')}/__page/${entry.id}/`,
    });
  }
}
