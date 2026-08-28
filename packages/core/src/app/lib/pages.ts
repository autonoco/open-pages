import {
  pageCreatedAt as createdAt,
  pageIds as ids,
  pageKinds as kinds,
  loadPage as load,
  pageThemes as themes,
} from 'virtual:open-pages/pages';
import type { PageKind, PageModule } from './sdk';

export const pageIds: string[] = ids;
export const pageKinds: Record<string, PageKind> = kinds;
export const pageThemes: Record<string, string> = themes;
export const pageCreatedAt: Record<string, number> = createdAt;

export function pagesByTheme(themeId: string): string[] {
  return pageIds.filter((id) => pageThemes[id] === themeId);
}

export async function loadPage(id: string): Promise<PageModule> {
  return load(id);
}

export function pageChangeIncludes(data: unknown, pageId: string): boolean {
  if (!data || typeof data !== 'object') return false;
  const payload = data as { pageId?: unknown; pageIds?: unknown };
  if (payload.pageId === pageId) return true;
  return Array.isArray(payload.pageIds) && payload.pageIds.includes(pageId);
}
