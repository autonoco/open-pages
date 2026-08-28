import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { type InlineConfig, searchForWorkspaceRoot } from 'vite';
import { apiPlugin } from './api-plugin.ts';
import { currentPlugin } from './current-plugin.ts';
import { designPlugin } from './design-plugin.ts';
import { locTagsPlugin } from './loc-tags-plugin.ts';
import { loadUserConfig, type OpenPagesConfig, openPagesPlugin } from './open-pages-plugin.ts';
import { themesPlugin } from './themes-plugin.ts';

import { APP_ROOT, PKG_ROOT, readCoreVersion } from './version.ts';

const CORE_VERSION = readCoreVersion();

export type CreateViteConfigOptions = {
  userCwd: string;
  config?: OpenPagesConfig;
  mode?: 'serve' | 'build';
};

export async function createViteConfig(opts: CreateViteConfigOptions): Promise<InlineConfig> {
  const userCwd = path.resolve(opts.userCwd);
  const config = opts.config ?? (await loadUserConfig(userCwd));
  const pagesDir = config.pagesDir ?? 'pages';
  const themesDir = config.themesDir ?? 'themes';
  const assetsDir = config.assetsDir ?? 'assets';
  const pagesAbs = path.resolve(userCwd, pagesDir);
  const themesAbs = path.resolve(userCwd, themesDir);
  const assetsAbs = path.resolve(userCwd, assetsDir);

  return {
    base: config.base ?? '/',
    root: APP_ROOT,
    configFile: false,
    envDir: userCwd,
    plugins: [
      locTagsPlugin({ userCwd, pagesDir }),
      react(),
      tailwindcss(),
      openPagesPlugin({ userCwd, config, coreVersion: CORE_VERSION }),
      themesPlugin({ userCwd, config }),
      designPlugin({ userCwd }),
      apiPlugin({ userCwd, pagesDir, assetsDir, coreVersion: CORE_VERSION }),
      currentPlugin({ userCwd, pagesDir }),
    ],
    resolve: {
      alias: {
        '@': APP_ROOT,
        '@assets': assetsAbs,
      },
    },
    optimizeDeps: {
      entries: [path.join(APP_ROOT, 'main.tsx'), path.join(APP_ROOT, 'frame', 'main.tsx')],
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'next-themes',
        'react-router-dom',
        '@base-ui/react',
        // @base-ui/utils reaches for the CommonJS use-sync-external-store shim
        // (React 17 fallback). Left un-optimized, its named `useSyncExternalStore`
        // export fails ESM interop in the browser — pre-bundle it to fix that.
        // (@base-ui/utils itself has no "." export, so we can't list it here.)
        'use-sync-external-store/shim',
        'use-sync-external-store/shim/with-selector',
        'lucide-react',
        'clsx',
        'tailwind-merge',
        'class-variance-authority',
        'emoji-picker-react',
      ],
      // The app source ships inside node_modules/@autono/open-pages/src/app, so
      // Vite's dep scanner traverses it as if it were a third-party dep and
      // tries to bundle our virtual imports with esbuild. Mark them external.
      esbuildOptions: {
        target: 'es2022',
        plugins: [
          {
            name: 'open-pages:virtual-externals',
            setup(build) {
              build.onResolve({ filter: /^virtual:open-pages\// }, (args) => ({
                path: args.path,
                external: true,
              }));
            },
          },
        ],
      },
    },
    server: {
      port: config.port ?? 5173,
      ...(config.allowedHosts !== undefined ? { allowedHosts: config.allowedHosts } : {}),
      fs: {
        // The workspace root covers node_modules however the package manager
        // lays it out (incl. pnpm's virtual store realpaths for fonts).
        allow: [
          APP_ROOT,
          PKG_ROOT,
          searchForWorkspaceRoot(userCwd),
          userCwd,
          pagesAbs,
          themesAbs,
          assetsAbs,
        ],
      },
    },
    build: {
      outDir: path.resolve(userCwd, 'dist'),
      emptyOutDir: true,
      target: 'es2022',
      rollupOptions: {
        input: {
          index: path.join(APP_ROOT, 'index.html'),
          frame: path.join(APP_ROOT, 'frame.html'),
        },
      },
    },
  };
}
