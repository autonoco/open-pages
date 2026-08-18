import type { ComponentType } from 'react';
import type { DesignSystem } from './design.ts';
import type { DocTransition } from './transition.ts';

export type Page = ComponentType & { transition?: DocTransition };

export type DocMeta = {
  title?: string;
  theme?: string;
  /** ISO 8601 timestamp. Set once at scaffold time; used to sort the doc list. */
  createdAt?: string;
};

export type DocModule = {
  default: Page[];
  meta?: DocMeta;
  design?: DesignSystem;
  // Index-aligned with `default`.
  notes?: (string | undefined)[];
  transition?: DocTransition;
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

export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;
