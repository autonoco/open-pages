import { Image as ImageIcon, Palette, Presentation } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/lib/use-locale';
import { usePageTitles } from '@/lib/use-page-titles';
import { pageIds } from '../../lib/pages';
import type { Folder } from '../../lib/sdk';
import { FolderIconChip } from '../sidebar/folder-item';
import { ALL_DOCS_ID, ASSETS_ID, DRAFT_ID, THEMES_ID } from '../sidebar/sidebar';
import { type CommandGroupSpec, CommandMenu, type CommandSpec } from './command-menu';

export function HomeCommandMenu({
  open,
  onOpenChange,
  folders,
  titleMap,
  onSelectView,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: Folder[];
  titleMap: Record<string, string>;
  onSelectView: (id: string) => void;
}) {
  const t = useLocale();
  const navigate = useNavigate();
  const loadedTitles = usePageTitles(open);

  const groups = useMemo<CommandGroupSpec[]>(() => {
    const pages: CommandSpec[] = pageIds.map((id) => ({
      id: `page-${id}`,
      label: titleMap[id] ?? loadedTitles[id] ?? id,
      icon: <Presentation />,
      keywords: [id],
      run: () => navigate(`/p/${id}`),
    }));

    const folderItems: CommandSpec[] = [
      {
        id: `view-${ALL_DOCS_ID}`,
        label: t.home.pages,
        icon: <FolderIconChip icon={{ type: 'emoji', value: '🎞️' }} />,
        keywords: ['all', 'pages'],
        run: () => onSelectView(ALL_DOCS_ID),
      },
      {
        id: `view-${DRAFT_ID}`,
        label: t.home.draft,
        icon: <FolderIconChip icon={{ type: 'emoji', value: '📝' }} />,
        keywords: ['draft', 'unsorted'],
        run: () => onSelectView(DRAFT_ID),
      },
      ...folders.map((folder) => ({
        id: `view-${folder.id}`,
        label: folder.name,
        icon: <FolderIconChip icon={folder.icon} />,
        keywords: ['folder', folder.id],
        run: () => onSelectView(folder.id),
      })),
    ];

    const navigation: CommandSpec[] = [
      {
        id: `view-${THEMES_ID}`,
        label: t.home.themes,
        icon: <Palette />,
        keywords: ['themes', 'design'],
        run: () => onSelectView(THEMES_ID),
      },
    ];
    if (import.meta.env.DEV) {
      navigation.push({
        id: `view-${ASSETS_ID}`,
        label: t.home.assets,
        icon: <ImageIcon />,
        keywords: ['assets', 'images', 'files'],
        run: () => onSelectView(ASSETS_ID),
      });
    }

    return [
      { id: 'pages', heading: t.commandMenu.groupDocs, items: pages },
      { id: 'folders', heading: t.commandMenu.groupFolders, items: folderItems },
      { id: 'navigation', heading: t.commandMenu.groupNavigation, items: navigation },
    ];
  }, [t, folders, titleMap, loadedTitles, navigate, onSelectView]);

  return (
    <CommandMenu
      open={open}
      onOpenChange={onOpenChange}
      groups={groups}
      placeholder={t.commandMenu.placeholder}
    />
  );
}
