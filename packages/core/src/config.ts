import type { Locale } from './locale/types';

export type OpenPagesBuildConfig = {
  showPageBrowser?: boolean;
  showPageUi?: boolean;
};

export type OpenPagesConfig = {
  base?: string;
  pagesDir?: string;
  themesDir?: string;
  assetsDir?: string;
  port?: number;
  allowedHosts?: string[] | true;
  /**
   * @deprecated Pick the UI language from the language switcher in the page UI
   * instead. When set, this only seeds the initial language until the user
   * chooses one (their choice is then remembered locally).
   */
  locale?: Locale;
  build?: OpenPagesBuildConfig;
};
