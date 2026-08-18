import { useCallback, useEffect, useRef, useState } from 'react';

export type NoteSaveStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved' }
  | { kind: 'error'; message: string };

const DEBOUNCE_MS = 600;

type Target = { docId: string; index: number };

// HMR is suppressed for our writes, so the cached doc module's `notes`
// stays stale across navigation. Cache last-saved text per target so
// switching docs and back doesn't surface the old value.
const sessionCache = new Map<string, string>();
const cacheKey = (docId: string, index: number) => `${docId}:${index}`;

// Remap the per-target cache after a reorder. `order[i]` is the original
// page index that lands at new position `i`, matching the contract used by
// the `/__docs/:id/reorder` endpoint.
export function remapNotesSessionCacheAfterReorder(docId: string, order: number[]): void {
  const prev = new Map<number, string>();
  for (let i = 0; i < order.length; i++) {
    const cached = sessionCache.get(cacheKey(docId, i));
    if (cached !== undefined) prev.set(i, cached);
    sessionCache.delete(cacheKey(docId, i));
  }
  for (let newIdx = 0; newIdx < order.length; newIdx++) {
    const oldIdx = order[newIdx];
    const text = prev.get(oldIdx);
    if (text !== undefined) sessionCache.set(cacheKey(docId, newIdx), text);
  }
}

export function useNotes(docId: string, index: number, initial: string | undefined) {
  const initialText = sessionCache.get(cacheKey(docId, index)) ?? initial ?? '';
  const [value, setValueState] = useState(initialText);
  const [status, setStatus] = useState<NoteSaveStatus>({ kind: 'idle' });

  const lastSavedRef = useRef(initialText);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightRef = useRef<AbortController | null>(null);
  const targetRef = useRef<Target>({ docId, index });
  const valueRef = useRef(value);
  valueRef.current = value;

  const cancelTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const persist = useCallback(async (target: Target, text: string) => {
    inflightRef.current?.abort();
    const ctl = new AbortController();
    inflightRef.current = ctl;
    setStatus({ kind: 'saving' });
    try {
      const res = await fetch('/__notes', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ docId: target.docId, index: target.index, text }),
        signal: ctl.signal,
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? `PUT /__notes → ${res.status}`);
      sessionCache.set(cacheKey(target.docId, target.index), text);
      if (inflightRef.current !== ctl) return;
      lastSavedRef.current = text;
      dirtyRef.current = false;
      setStatus({ kind: 'saved' });
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return;
      setStatus({ kind: 'error', message: String((err as Error).message ?? err) });
    } finally {
      if (inflightRef.current === ctl) inflightRef.current = null;
    }
  }, []);

  const flush = useCallback(async () => {
    cancelTimer();
    if (!dirtyRef.current) return;
    const target = targetRef.current;
    await persist(target, valueRef.current);
  }, [cancelTimer, persist]);

  // When the (docId, index) target changes, flush pending edits for the
  // previous target before adopting the new initial text.
  useEffect(() => {
    const prev = targetRef.current;
    const targetChanged = prev.docId !== docId || prev.index !== index;
    if (targetChanged && dirtyRef.current) {
      cancelTimer();
      const pending = valueRef.current;
      if (lastSavedRef.current !== pending) void persist(prev, pending);
    }
    targetRef.current = { docId, index };
    cancelTimer();
    setValueState(initialText);
    lastSavedRef.current = initialText;
    dirtyRef.current = false;
    setStatus({ kind: 'idle' });
  }, [docId, index, initialText, persist, cancelTimer]);

  useEffect(() => {
    return () => {
      cancelTimer();
      inflightRef.current?.abort();
    };
  }, [cancelTimer]);

  const setValue = useCallback(
    (next: string) => {
      setValueState(next);
      dirtyRef.current = next !== lastSavedRef.current;
      cancelTimer();
      if (!dirtyRef.current) {
        setStatus({ kind: 'idle' });
        return;
      }
      const target = targetRef.current;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void persist(target, next);
      }, DEBOUNCE_MS);
    },
    [persist, cancelTimer],
  );

  return { value, setValue, status, flush };
}
