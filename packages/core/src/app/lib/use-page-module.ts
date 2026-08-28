import { useCallback, useEffect, useRef, useState } from 'react';
import { loadPage, pageChangeIncludes } from './pages';
import type { PageModule } from './sdk';

export function usePageModule(pageId: string) {
  const [page, setDoc] = useState<PageModule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadSeqRef = useRef(0);

  const reload = useCallback(
    (reset: boolean) => {
      const seq = ++loadSeqRef.current;
      if (reset) setDoc(null);
      setError(null);
      loadPage(pageId)
        .then((mod) => {
          if (seq === loadSeqRef.current) setDoc(mod);
        })
        .catch((e) => {
          if (seq === loadSeqRef.current) setError(String(e?.message ?? e));
        });
    },
    [pageId],
  );

  useEffect(() => {
    reload(true);
  }, [reload]);

  useEffect(() => {
    if (!import.meta.hot) return;
    let cancelled = false;
    const handler = (data: unknown) => {
      if (pageChangeIncludes(data, pageId)) {
        queueMicrotask(() => {
          if (!cancelled) reload(false);
        });
      }
    };
    import.meta.hot.on('open-pages:page-changed', handler);
    return () => {
      cancelled = true;
      import.meta.hot?.off('open-pages:page-changed', handler);
    };
  }, [pageId, reload]);

  return { page, error, reload };
}
