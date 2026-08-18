import type { Locale } from './locale/types';

export type OpenPdfBuildConfig = {
  showDocBrowser?: boolean;
  showDocUi?: boolean;
  allowHtmlDownload?: boolean;
};

export type OpenPdfConfig = {
  base?: string;
  docsDir?: string;
  themesDir?: string;
  assetsDir?: string;
  port?: number;
  allowedHosts?: string[] | true;
  /**
   * @deprecated Pick the UI language from the language switcher in the doc UI
   * instead. When set, this only seeds the initial language until the user
   * chooses one (their choice is then remembered locally).
   */
  locale?: Locale;
  build?: OpenPdfBuildConfig;
};
