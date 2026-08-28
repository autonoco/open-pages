import type { ComponentType } from 'react';
import type { DesignSystem } from './design.ts';

/**
 * A page is one React component rendered into a real browser document. It
 * owns the whole viewport: layout, styling (Tailwind via `className` or a
 * sibling stylesheet), interactivity, and any client-side routing it wants.
 */
export type PageComponent = ComponentType;

export type PageMeta = {
  /** Document title (browser tab, workspace card). Default: the folder name. */
  title?: string;
  /** `<meta name="description">` in the exported HTML. */
  description?: string;
  /** Id of a theme under `themes/` this page was built from. */
  theme?: string;
  /** ISO 8601 timestamp. Set once at scaffold time; used to sort the page list. */
  createdAt?: string;
};

/** How a page entry is authored: a React module or a plain HTML file. */
export type PageKind = 'react' | 'html';

export type PageModule = {
  /** Absent for `index.html` pages, which the workspace serves as-is. */
  default?: PageComponent;
  meta?: PageMeta;
  design?: DesignSystem;
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
