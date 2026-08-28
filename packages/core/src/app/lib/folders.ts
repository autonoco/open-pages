import buildManifest from 'virtual:open-pages/folders';
import { useCallback, useEffect, useState } from 'react';
import type { Folder, FolderIcon, FoldersManifest } from './sdk';

const EMPTY: FoldersManifest = { folders: [], assignments: {} };

async function getManifest(): Promise<FoldersManifest> {
  // In dev the manifest is mutable: read live from the plugin endpoint so
  // edits made in the sidebar reflect immediately. In a static build there
  // is no server, so fall back to the bundled snapshot from the virtual
  // module (populated at build time from pages/.folders.json).
  if (import.meta.env.DEV) {
    const res = await fetch('/__folders');
    if (!res.ok) throw new Error(`GET /__folders ${res.status}`);
    const raw = (await res.json()) as Partial<FoldersManifest>;
    return {
      folders: raw.folders ?? [],
      assignments: raw.assignments ?? {},
    };
  }
  return {
    folders: buildManifest.folders ?? [],
    assignments: buildManifest.assignments ?? {},
  };
}

async function patchDocName(pageId: string, name: string): Promise<void> {
  const res = await fetch(`/__pages/${pageId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`PATCH /__pages/${pageId} ${res.status}`);
}

async function duplicateDocReq(pageId: string, newId?: string): Promise<string> {
  const init: RequestInit = { method: 'POST' };
  if (newId !== undefined) {
    init.headers = { 'content-type': 'application/json' };
    init.body = JSON.stringify({ newId });
  }
  const res = await fetch(`/__pages/${pageId}/duplicate`, init);
  if (!res.ok) throw new Error(`POST /__pages/${pageId}/duplicate ${res.status}`);
  const body = (await res.json()) as { pageId?: unknown };
  if (typeof body.pageId !== 'string') throw new Error('duplicate response missing pageId');
  return body.pageId;
}

async function deleteDocReq(pageId: string): Promise<void> {
  const res = await fetch(`/__pages/${pageId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE /__pages/${pageId} ${res.status}`);
}

async function postFolder(name: string, icon: FolderIcon): Promise<Folder> {
  const res = await fetch('/__folders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, icon }),
  });
  if (!res.ok) throw new Error(`POST /__folders ${res.status}`);
  return (await res.json()) as Folder;
}

async function patchFolder(
  id: string,
  patch: { name?: string; icon?: FolderIcon },
): Promise<Folder> {
  const res = await fetch(`/__folders/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`PATCH /__folders/${id} ${res.status}`);
  return (await res.json()) as Folder;
}

async function deleteFolder(id: string): Promise<void> {
  const res = await fetch(`/__folders/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE /__folders/${id} ${res.status}`);
}

async function putAssign(pageId: string, folderId: string | null): Promise<void> {
  const res = await fetch('/__folders/assign', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pageId, folderId }),
  });
  if (!res.ok) throw new Error(`PUT /__folders/assign ${res.status}`);
}

async function putReorder(ids: string[]): Promise<void> {
  const res = await fetch('/__folders/reorder', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error(`PUT /__folders/reorder ${res.status}`);
}

export type UseFoldersResult = {
  manifest: FoldersManifest;
  loading: boolean;
  create: (name: string, icon: FolderIcon) => Promise<Folder>;
  update: (id: string, patch: { name?: string; icon?: FolderIcon }) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reorder: (ids: string[]) => Promise<void>;
  assign: (pageId: string, folderId: string | null) => Promise<void>;
  renameDoc: (pageId: string, name: string) => Promise<void>;
  duplicatePage: (pageId: string, newId?: string) => Promise<string>;
  deletePage: (pageId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useFolders(): UseFoldersResult {
  const [manifest, setManifest] = useState<FoldersManifest>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const m = await getManifest();
    setManifest(m);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getManifest()
      .then((m) => {
        if (!cancelled) {
          setManifest(m);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!import.meta.hot) return;
    const handler = () => {
      refresh().catch(() => {});
    };
    import.meta.hot.on('open-pages:files-changed', handler);
    return () => {
      import.meta.hot?.off('open-pages:files-changed', handler);
    };
  }, [refresh]);

  const create = useCallback(
    async (name: string, icon: FolderIcon) => {
      const folder = await postFolder(name, icon);
      await refresh();
      return folder;
    },
    [refresh],
  );

  const update = useCallback(
    async (id: string, patch: { name?: string; icon?: FolderIcon }) => {
      await patchFolder(id, patch);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteFolder(id);
      await refresh();
    },
    [refresh],
  );

  const reorder = useCallback(
    async (ids: string[]) => {
      const prev = manifest;
      const byId = new Map(prev.folders.map((f) => [f.id, f]));
      const next = ids.map((id) => byId.get(id)).filter((f): f is Folder => Boolean(f));
      if (next.length !== prev.folders.length) return;
      setManifest({ ...prev, folders: next });
      try {
        await putReorder(ids);
      } catch (err) {
        setManifest(prev);
        throw err;
      }
    },
    [manifest],
  );

  const assign = useCallback(
    async (pageId: string, folderId: string | null) => {
      await putAssign(pageId, folderId);
      await refresh();
    },
    [refresh],
  );

  const renameDoc = useCallback(
    async (pageId: string, name: string) => {
      await patchDocName(pageId, name);
      await refresh();
    },
    [refresh],
  );

  const duplicatePage = useCallback(
    async (pageId: string, newId?: string) => {
      const duplicatedId = await duplicateDocReq(pageId, newId);
      await refresh();
      return duplicatedId;
    },
    [refresh],
  );

  const deletePage = useCallback(
    async (pageId: string) => {
      await deleteDocReq(pageId);
      await refresh();
    },
    [refresh],
  );

  return {
    manifest,
    loading,
    create,
    update,
    remove,
    reorder,
    assign,
    renameDoc,
    duplicatePage,
    deletePage,
    refresh,
  };
}
