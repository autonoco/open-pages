import { Menu } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { LanguageToggle } from '~/components/language-toggle';
import { ThemeToggle } from '~/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { useAssets } from '~/lib/assets';
import { useFolders } from '~/lib/folders';
import { format, useLocale } from '~/lib/use-locale';
import { cn } from '~/lib/utils';
import { CommandMenuTrigger } from '../components/command/command-menu';
import { HomeCommandMenu } from '../components/command/home-command-menu';
import { FolderIconChip } from '../components/sidebar/folder-item';
import { ALL_DOCS_ID, ASSETS_ID, Sidebar, THEMES_ID } from '../components/sidebar/sidebar';
import { pageIds } from '../lib/pages';
import type { FoldersManifest } from '../lib/sdk';
import { themes as themeRegistry } from '../lib/themes';

export type HomeOutletContext = {
  manifest: FoldersManifest;
  loading: boolean;
  draftDocs: string[];
  docsByFolder: Record<string, string[]>;
  /** Selected view id: ALL_DOCS_ID, DRAFT_ID, a folder id, THEMES_ID, or ASSETS_ID. */
  selectedId: string;
  selectFolder: (id: string) => void;
  reportTitle: (pageId: string, title: string) => void;
  titleMap: Record<string, string>;
  assign: (pageId: string, folderId: string | null) => Promise<void>;
  renameDoc: (pageId: string, name: string) => Promise<void>;
  duplicatePage: (pageId: string, newId?: string) => Promise<string>;
  deletePage: (pageId: string) => Promise<void>;
};

function pathToSelectedId(pathname: string, search: URLSearchParams): string {
  if (pathname === '/themes' || pathname.startsWith('/themes/')) return THEMES_ID;
  if (pathname === '/assets') return ASSETS_ID;
  return search.get('f') ?? ALL_DOCS_ID;
}

export function HomeShell() {
  const {
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
  } = useFolders();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const t = useLocale();

  const selectedId = pathToSelectedId(location.pathname, searchParams);

  const [commandOpen, setCommandOpen] = useState(false);
  const openCommandMenu = useCallback(() => setCommandOpen(true), []);

  const [titleMap, setTitleMap] = useState<Record<string, string>>({});
  const reportTitle = useCallback((pageId: string, pageTitle: string) => {
    setTitleMap((prev) => (prev[pageId] === pageTitle ? prev : { ...prev, [pageId]: pageTitle }));
  }, []);

  const selectFolder = useCallback(
    (id: string) => {
      if (id === THEMES_ID) navigate('/themes', { replace: true });
      else if (id === ASSETS_ID) navigate('/assets', { replace: true });
      else if (id === ALL_DOCS_ID) navigate('/', { replace: true });
      else navigate(`/?f=${encodeURIComponent(id)}`, { replace: true });
    },
    [navigate],
  );

  const { assets: globalAssets } = useAssets('@global');
  const isAssetsRoute = location.pathname === '/assets';

  const { draftDocs, docsByFolder } = useMemo(() => {
    const byFolder: Record<string, string[]> = {};
    const draft: string[] = [];
    const known = new Set(manifest.folders.map((f) => f.id));
    for (const id of pageIds) {
      const folderId = manifest.assignments[id];
      if (folderId && known.has(folderId)) {
        byFolder[folderId] ??= [];
        byFolder[folderId].push(id);
      } else {
        draft.push(id);
      }
    }
    return { draftDocs: draft, docsByFolder: byFolder };
  }, [manifest]);

  const countFor = (folderId: string | null) =>
    folderId === null ? draftDocs.length : (docsByFolder[folderId]?.length ?? 0);

  const moveDocWithToast = useCallback(
    async (pageId: string, folderId: string | null) => {
      if (manifest.assignments[pageId] === (folderId ?? undefined)) return;
      const docName = titleMap[pageId] ?? pageId;
      const folderName =
        folderId === null
          ? t.home.draft
          : (manifest.folders.find((f) => f.id === folderId)?.name ?? folderId);
      try {
        await assign(pageId, folderId);
        toast.success(format(t.home.toastDocMoved, { page: docName, folder: folderName }));
      } catch {
        toast.error(t.home.toastDocMoveFailed);
      }
    },
    [assign, manifest, titleMap, t],
  );

  const ctx: HomeOutletContext = {
    manifest,
    loading,
    draftDocs,
    docsByFolder,
    selectedId,
    selectFolder,
    reportTitle,
    titleMap,
    assign,
    renameDoc,
    duplicatePage,
    deletePage,
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <div className="hidden md:block">
        <Sidebar
          folders={manifest.folders}
          countFor={countFor}
          allCount={pageIds.length}
          themesCount={themeRegistry.length}
          assetsCount={globalAssets.length}
          selectedId={selectedId}
          onSelect={selectFolder}
          onCreate={(name, icon) => create(name, icon)}
          onRename={(id, name) => update(id, { name })}
          onChangeIcon={(id, icon) => update(id, { icon })}
          onDelete={async (id) => {
            const name = manifest.folders.find((f) => f.id === id)?.name ?? id;
            if (selectedId === id) selectFolder(ALL_DOCS_ID);
            try {
              await remove(id);
              toast.success(format(t.home.toastFolderDeleted, { name }));
            } catch {
              toast.error(t.home.toastFolderDeleteFailed);
            }
          }}
          onOpenCommandMenu={openCommandMenu}
          onDropToFolder={(folderId, pageId) => moveDocWithToast(pageId, folderId)}
          onDropToDraft={(pageId) => moveDocWithToast(pageId, null)}
          onReorder={async (ids) => {
            try {
              await reorder(ids);
            } catch {
              toast.error(t.home.toastFolderReorderFailed);
            }
          }}
        />
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto bg-canvas">
        <div className="flex items-center justify-between border-b border-hairline bg-sidebar px-4 py-3 md:hidden">
          <h1 className="font-heading text-lg font-bold tracking-tight">{t.home.appTitle}</h1>
          <div className="-mr-1.5 flex items-center gap-0.5">
            <CommandMenuTrigger onClick={openCommandMenu} />
            <LanguageToggle />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    aria-label={t.home.menu}
                    className="flex size-8 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
                  >
                    <Menu className="size-4" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="min-w-[200px]">
                <DropdownMenuItem
                  onClick={() => selectFolder(ALL_DOCS_ID)}
                  className={cn(
                    selectedId !== THEMES_ID &&
                      selectedId !== ASSETS_ID &&
                      'bg-muted text-foreground',
                  )}
                >
                  <FolderIconChip icon={{ type: 'emoji', value: '🎞️' }} />
                  <span className="flex-1 truncate">{t.home.pages}</span>
                  <span className="folio">{pageIds.length.toString().padStart(2, '0')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => selectFolder(THEMES_ID)}
                  className={cn(selectedId === THEMES_ID && 'bg-muted text-foreground')}
                >
                  <FolderIconChip icon={{ type: 'emoji', value: '🎨' }} />
                  <span className="flex-1 truncate">{t.home.themes}</span>
                  <span className="folio">{themeRegistry.length.toString().padStart(2, '0')}</span>
                </DropdownMenuItem>
                {import.meta.env.DEV && (
                  <DropdownMenuItem
                    onClick={() => selectFolder(ASSETS_ID)}
                    className={cn(selectedId === ASSETS_ID && 'bg-muted text-foreground')}
                  >
                    <FolderIconChip icon={{ type: 'emoji', value: '🗂️' }} />
                    <span className="flex-1 truncate">{t.home.assets}</span>
                    <span className="folio">{globalAssets.length.toString().padStart(2, '0')}</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div
          className={cn(
            isAssetsRoute
              ? 'flex min-h-0 flex-1 flex-col'
              : 'mx-auto w-full max-w-[1180px] px-5 py-8 md:px-10 md:py-12',
          )}
        >
          <Outlet context={ctx} />
        </div>
      </div>

      <HomeCommandMenu
        open={commandOpen}
        onOpenChange={setCommandOpen}
        folders={manifest.folders}
        titleMap={titleMap}
        onSelectView={selectFolder}
      />
    </div>
  );
}
