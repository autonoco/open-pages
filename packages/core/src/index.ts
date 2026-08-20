// Page-counter primitives, resolved by the PDF engine at render time. Use in
// running header/footer bands (`pageOptions.header` / `pageOptions.footer`).
export type { CounterProps, CounterStyle } from 'takumi-pdf/primitives';
export { PageNumber, TargetPageNumber, TotalPages } from 'takumi-pdf/primitives';
export type {
  DesignFonts,
  DesignPalette,
  DesignSystem,
  DesignTypeScale,
} from './app/lib/design.ts';
export { cssVarsToString, defaultDesign, designToCssVars } from './app/lib/design.ts';
export type {
  DocComponent,
  DocMeta,
  DocModule,
  PageFont,
  PageMarginSide,
  PageOptions,
} from './app/lib/sdk.ts';
export type { OpenPdfConfig } from './config.ts';
export type { Locale, Plural } from './locale/types.ts';

// Docs style with Tailwind via the `tw` prop (Takumi dialect). Importing
// '@autono/open-pdf' applies this JSX augmentation to the doc module.
declare module 'react' {
  interface HTMLAttributes<T> {
    /** Tailwind utility classes, resolved by the PDF engine at render time. */
    tw?: string;
  }
}
