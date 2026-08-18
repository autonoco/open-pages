import { type Context, createContext, type PropsWithChildren, useContext, useMemo } from 'react';

type DocPageContextValue = {
  index: number;
  total: number;
};

// Stored on globalThis so dev (src) and published (dist) copies of this module
// share one context instance — otherwise the provider writes to one context and
// the hook reads from another, and `useDocPageNumber` always sees null.
const GLOBAL_KEY = '__open_pdf_page_context__';
type GlobalWithCtx = typeof globalThis & {
  [GLOBAL_KEY]?: Context<DocPageContextValue | null>;
};
const g = globalThis as GlobalWithCtx;
if (!g[GLOBAL_KEY]) {
  g[GLOBAL_KEY] = createContext<DocPageContextValue | null>(null);
}
const DocPageContext = g[GLOBAL_KEY];

export function DocPageProvider({
  index,
  total,
  children,
}: PropsWithChildren<{ index: number; total: number }>) {
  const value = useMemo(() => ({ index, total }), [index, total]);
  return <DocPageContext.Provider value={value}>{children}</DocPageContext.Provider>;
}

export function useDocPageNumber(): { current: number; total: number } {
  const ctx = useContext(DocPageContext);
  if (!ctx) {
    throw new Error('useDocPageNumber must be called from a doc page rendered by @open-pdf/core');
  }
  return { current: ctx.index + 1, total: ctx.total };
}
