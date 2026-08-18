import type { ComponentType, ReactNode } from 'react';
import type { DesignSystem } from './design.ts';

/**
 * A document is one React component returning HTML-shaped JSX in the Takumi
 * dialect (div/span/table/p with `tw` Tailwind props and/or `style`). Content
 * flows; the engine paginates. Hard page starts use `breakBefore: 'page'`.
 */
export type DocComponent = ComponentType;

export type DocMeta = {
  title?: string;
  theme?: string;
  /** ISO 8601 timestamp. Set once at scaffold time; used to sort the doc list. */
  createdAt?: string;
};

export type PageMarginSide = number | string;

/** Per-document page geometry and running bands, passed to the PDF engine. */
export type PageOptions = {
  /** Page size preset ('a4', 'letter', ...) or {width, height} in CSS px. */
  size?: string | { width: number; height: number };
  margin?:
    | PageMarginSide
    | {
        top?: PageMarginSide;
        right?: PageMarginSide;
        bottom?: PageMarginSide;
        left?: PageMarginSide;
      };
  /** Running header band, rendered on every page. */
  header?: ReactNode;
  /** Running footer band, rendered on every page. May use <PageNumber/> / <TotalPages/>. */
  footer?: ReactNode;
};

export type DocModule = {
  default: DocComponent;
  meta?: DocMeta;
  design?: DesignSystem;
  pageOptions?: PageOptions;
};

export type FolderIcon = { type: 'emoji'; value: string } | { type: 'color'; value: string };

export type Folder = {
  id: string;
  name: string;
  icon: FolderIcon;
};

export type FoldersManifest = {
  folders: Folder[];
  assignments: Record<string, string>;
};
