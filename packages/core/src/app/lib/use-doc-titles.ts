import { useEffect, useRef, useState } from 'react';
import { docIds, loadDoc } from './docs';

/**
 * Resolves every deck's display title once `enabled` first turns true. The home
 * grid only mounts the cards of the selected folder, so cross-folder search
 * needs its own pass over the doc modules — kept lazy since it imports them all.
 */
export function useDocTitles(enabled: boolean): Record<string, string> {
  const [titles, setTitles] = useState<Record<string, string>>({});
  const startedRef = useRef(false);

  useEffect(() => {
    if (!enabled || startedRef.current) return;
    startedRef.current = true;
    void Promise.all(
      docIds.map(async (id): Promise<[string, string]> => {
        try {
          const mod = await loadDoc(id);
          return [id, mod.meta?.title ?? id];
        } catch {
          return [id, id];
        }
      }),
    ).then((entries) => setTitles(Object.fromEntries(entries)));
  }, [enabled]);

  return titles;
}
