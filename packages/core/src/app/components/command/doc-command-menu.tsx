import config from 'virtual:open-pdf/config';
import {
  ChevronLeft,
  FileCode2,
  FileImage,
  FileText,
  Grid2x2,
  Link2,
  Maximize,
  MonitorSpeaker,
  Palette,
  Play,
  RectangleHorizontal,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, useLocale } from '@/lib/use-locale';
import { type CommandGroupSpec, CommandMenu, type CommandSpec } from './command-menu';

const { showDocBrowser, allowHtmlDownload } = config.build;

export type DocCommandHandlers = {
  onPresentWindow: () => void;
  onPresentFullscreen: () => void;
  onPresenterView: () => void;
  onCopyLink: () => void;
  onOverview: () => void;
  onToggleDesignPanel: () => void;
  onExportHtml: () => void;
  onExportPdf: () => void;
  onExportImagePptx: () => void;
  onGoToPage: (index: number) => void;
};

export function DocCommandMenu({
  open,
  onOpenChange,
  pageCount,
  currentIndex,
  exporting,
  handlers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageCount: number;
  currentIndex: number;
  exporting: boolean;
  handlers: DocCommandHandlers;
}) {
  const t = useLocale();
  const navigate = useNavigate();

  const groups: CommandGroupSpec[] = (() => {
    const present: CommandSpec[] = [
      {
        id: 'present-fullscreen',
        label: t.doc.presentFullscreen,
        icon: <Maximize />,
        keywords: ['present', 'fullscreen', 'play'],
        shortcut: 'F',
        run: handlers.onPresentFullscreen,
      },
      {
        id: 'present-window',
        label: t.doc.presentInWindow,
        icon: <Play />,
        keywords: ['present', 'window', 'play'],
        shortcut: '↵',
        run: handlers.onPresentWindow,
      },
      {
        id: 'present-presenter',
        label: t.doc.presentPresenter,
        icon: <MonitorSpeaker />,
        keywords: ['presenter', 'notes', 'speaker'],
        shortcut: 'P',
        run: handlers.onPresenterView,
      },
    ];

    const deck: CommandSpec[] = [
      {
        id: 'copy-link',
        label: t.doc.copyLink,
        icon: <Link2 />,
        keywords: ['copy', 'link', 'url', 'share'],
        run: handlers.onCopyLink,
      },
      {
        id: 'overview',
        label: t.commandMenu.overview,
        icon: <Grid2x2 />,
        keywords: ['overview', 'grid', 'pages'],
        shortcut: 'O',
        run: handlers.onOverview,
      },
    ];
    if (import.meta.env.DEV) {
      deck.push({
        id: 'design-panel',
        label: t.commandMenu.designPanel,
        icon: <Palette />,
        keywords: ['design', 'style', 'tokens'],
        shortcut: 'D',
        run: handlers.onToggleDesignPanel,
      });
    }
    if (showDocBrowser) {
      deck.push({
        id: 'back-to-docs',
        label: t.commandMenu.backToDocs,
        icon: <ChevronLeft />,
        keywords: ['home', 'back', 'docs'],
        run: () => navigate('/'),
      });
    }

    const exports: CommandSpec[] = allowHtmlDownload
      ? [
          {
            id: 'export-html',
            label: t.doc.exportAsHtml,
            icon: <FileCode2 />,
            keywords: ['export', 'html', 'download'],
            disabled: exporting,
            run: handlers.onExportHtml,
          },
          {
            id: 'export-pdf',
            label: t.doc.exportAsPdf,
            icon: <FileText />,
            keywords: ['export', 'pdf', 'download', 'print'],
            disabled: exporting,
            run: handlers.onExportPdf,
          },
          {
            id: 'export-image-pptx',
            label: t.doc.exportAsImagePptx,
            icon: <FileImage />,
            keywords: ['export', 'pptx', 'powerpoint', 'download'],
            disabled: exporting,
            run: handlers.onExportImagePptx,
          },
        ]
      : [];

    const pages: CommandSpec[] = Array.from({ length: pageCount }, (_, i) => ({
      id: `page-${i + 1}`,
      label: format(t.commandMenu.goToPage, { n: i + 1 }),
      icon: <RectangleHorizontal />,
      keywords: ['page', String(i + 1)],
      active: i === currentIndex,
      run: () => handlers.onGoToPage(i),
    }));

    return [
      { id: 'present', heading: t.commandMenu.groupPresent, items: present },
      { id: 'deck', heading: t.commandMenu.groupDeck, items: deck },
      { id: 'export', heading: t.commandMenu.groupExport, items: exports },
      { id: 'pages', heading: t.commandMenu.groupPages, items: pages, searchOnly: true },
    ];
  })();

  return (
    <CommandMenu
      open={open}
      onOpenChange={onOpenChange}
      groups={groups}
      placeholder={t.commandMenu.docPlaceholder}
    />
  );
}
