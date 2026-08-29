declare module 'virtual:open-pages/pages' {
  import type { PageKind, PageModule } from './lib/sdk';
  export const pageIds: string[];
  export const pageKinds: Record<string, PageKind>;
  export const pageThemes: Record<string, string>;
  export const pageCreatedAt: Record<string, number>;
  export function loadPage(id: string): Promise<PageModule>;
}

declare module 'virtual:open-pages/pages.css' {}

declare module 'virtual:open-pages/config' {
  import type { Locale } from '../locale/types';

  const config: {
    base?: string;
    pagesDir?: string;
    port?: number;
    locale?: Locale;
    version: string;
    build: {
      showPageBrowser: boolean;
      showPageUi: boolean;
    };
  };
  export default config;
}

declare module 'virtual:open-pages/folders' {
  import type { FoldersManifest } from './lib/sdk';

  const manifest: FoldersManifest;
  export default manifest;
}

declare module 'virtual:open-pages/themes' {
  import type { DesignSystem } from './lib/design';
  import type { PageComponent } from './lib/sdk';

  export type ThemeMeta = {
    id: string;
    name: string;
    description: string;
    body: string;
    hasDemo: boolean;
    hasCss: boolean;
  };

  export const themes: ThemeMeta[];
  export const themeCssIds: string[];
  export function loadThemeCss(id: string): Promise<void>;
  export function loadThemeDemo(id: string): Promise<{
    default: PageComponent;
    design?: DesignSystem;
  }>;
}
