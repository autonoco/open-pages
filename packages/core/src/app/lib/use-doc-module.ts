import { useCallback, useEffect, useRef, useState } from 'react';
import { docChangeIncludes, loadDoc } from './docs';
import type { DocModule } from './sdk';

export function useDocModule(docId: string) {
  const [doc, setDoc] = useState<DocModule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadSeqRef = useRef(0);

  const reload = useCallback(
    (reset: boolean) => {
      const seq = ++loadSeqRef.current;
      if (reset) setDoc(null);
      setError(null);
      loadDoc(docId)
        .then((mod) => {
          if (seq === loadSeqRef.current) setDoc(mod);
        })
        .catch((e) => {
          if (seq === loadSeqRef.current) setError(String(e?.message ?? e));
        });
    },
    [docId],
  );

  useEffect(() => {
    reload(true);
  }, [reload]);

  useEffect(() => {
    if (!import.meta.hot) return;
    let cancelled = false;
    const handler = (data: unknown) => {
      if (docChangeIncludes(data, docId)) {
        queueMicrotask(() => {
          if (!cancelled) reload(false);
        });
      }
    };
    import.meta.hot.on('open-pdf:doc-changed', handler);
    return () => {
      cancelled = true;
      import.meta.hot?.off('open-pdf:doc-changed', handler);
    };
  }, [docId, reload]);

  return { doc, error, reload };
}
