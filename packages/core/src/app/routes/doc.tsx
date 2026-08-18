import config from 'virtual:open-pdf/config';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  Download,
  FileCode2,
  FileImage,
  FileText,
  Link2,
  Loader2,
  Maximize,
  MonitorSpeaker,
  MoreHorizontal,
  Play,
  Presentation,
  Terminal,
} from 'lucide-react';
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AssetView } from '@/components/asset-view';
import { HistoryProvider } from '@/components/history-provider';
import { CommentWidget } from '@/components/inspector/comment-widget';
import { InspectOverlay } from '@/components/inspector/inspect-overlay';
import { InspectorPanel } from '@/components/inspector/inspector-panel';
import {
  InspectorProvider,
  InspectToggleButton,
  useInspector,
} from '@/components/inspector/inspector-provider';
import { SaveBar } from '@/components/inspector/save-bar';
import { DesignProvider } from '@/components/style-panel/design-provider';
import { DesignPanel, DesignToggleButton } from '@/components/style-panel/style-panel';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFolders } from '@/lib/folders';
import { useAgentSocketConnected } from '@/lib/use-agent-socket';
import { useClickPageNavigation } from '@/lib/use-click-page-navigation';
import { useIsMobile } from '@/lib/use-is-mobile';
import { format, useLocale } from '@/lib/use-locale';
import { useWheelPageNavigation } from '@/lib/use-wheel-page-navigation';
import { cn } from '@/lib/utils';
import { DocCommandMenu } from '../components/command/doc-command-menu';
import { DocCanvas } from '../components/doc-canvas';
import { DocPreloadLayer, isDeckWarmed, markDeckWarmed } from '../components/doc-preload-layer';
import { DocTransitionLayer } from '../components/doc-transition-layer';
import { NotesDrawer } from '../components/notes-drawer';
import { OverviewGrid } from '../components/overview-grid';
import { PdfProgressToast } from '../components/pdf-progress-toast';
import { openPresenterWindow, Player } from '../components/player';
import { PptxProgressToast } from '../components/pptx-progress-toast';
import { type ThumbnailActions, ThumbnailRail } from '../components/thumbnail-rail';
import { exportDocAsHtml } from '../lib/export-html';
import { exportDocAsPdf, isSafari } from '../lib/export-pdf';
import { exportDocAsImagePptx } from '../lib/export-pptx';
import { remapNotesSessionCacheAfterReorder } from '../lib/inspector/use-notes';
import type { DocModule } from '../lib/sdk';
import { useDocModule } from '../lib/use-doc-module';
import { usePrefersReducedMotion } from '../lib/use-prefers-reduced-motion';

const { showDocUi, showDocBrowser, allowHtmlDownload } = config.build;

const noop = () => {};

export function Doc() {
  const { docId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { doc, error } = useDocModule(docId);
  const [playMode, setPlayMode] = useState<'window' | 'fullscreen' | null>(null);
  // Last deck the Player showed. During a presenter-driven deck switch the
  // route's docId changes while the new module loads and warms; rendering
  // from this cache keeps the Player mounted, which preserves fullscreen
  // (re-entry needs a user gesture) and the elapsed timer.
  const lastPresentedRef = useRef<{
    docId: string;
    doc: DocModule;
    pages: DocModule['default'];
    index: number;
  } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const linkCopiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [designOpen, setDesignOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [, setWarmedTick] = useState(0);
  const handleAssetsWarmed = useCallback(() => {
    markDeckWarmed(docId);
    setWarmedTick((n) => n + 1);
  }, [docId]);

  useEffect(() => {
    return () => {
      if (linkCopiedTimerRef.current) clearTimeout(linkCopiedTimerRef.current);
    };
  }, []);
  const { renameDoc } = useFolders();
  const docViewportRef = useRef<HTMLElement>(null);
  const t = useLocale();
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  const modulePages = useMemo(() => doc?.default ?? [], [doc]);
  const [pages, setPages] = useState<typeof modulePages>(modulePages);
  useEffect(() => {
    setPages(modulePages);
  }, [modulePages]);
  const pageCount = pages.length;
  const rawIndex = Number(searchParams.get('p') ?? '1') - 1;
  const index = Number.isFinite(rawIndex) ? Math.max(0, Math.min(pageCount - 1, rawIndex)) : 0;
  const view = searchParams.get('view') === 'assets' ? 'assets' : 'docs';

  useEffect(() => {
    if (!import.meta.hot) return;
    if (!docId || !doc || pageCount === 0) return;
    import.meta.hot.send('open-pdf:current', {
      docId,
      pageIndex: index,
      totalPages: pageCount,
      docTitle: doc.meta?.title ?? docId,
      view,
    });
  }, [docId, index, pageCount, doc, view]);

  const switchPresentedDoc = useCallback(
    (id: string) => {
      navigate(`/s/${encodeURIComponent(id)}`, { replace: true });
    },
    [navigate],
  );

  const goTo = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(pageCount - 1, i));
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('p', String(clamped + 1));
          return next;
        },
        { replace: true },
      );
    },
    [pageCount, setSearchParams],
  );

  const reorderPage = useCallback(
    async (from: number, to: number) => {
      if (from === to) return;
      const before = pages;
      const nextPages = [...before];
      const [moved] = nextPages.splice(from, 1);
      nextPages.splice(to, 0, moved);
      setPages(nextPages);

      const order = before.map((_, i) => i);
      const [movedIdx] = order.splice(from, 1);
      order.splice(to, 0, movedIdx);

      remapNotesSessionCacheAfterReorder(docId, order);

      // Keep the user looking at the same page they were on before the drag.
      let nextIndex = index;
      if (index === from) nextIndex = to;
      else if (from < index && to >= index) nextIndex = index - 1;
      else if (from > index && to <= index) nextIndex = index + 1;
      if (nextIndex !== index) goTo(nextIndex);

      try {
        const res = await fetch(`/__docs/${encodeURIComponent(docId)}/reorder`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ order }),
        });
        if (!res.ok) {
          const detail = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(detail.error ?? `HTTP ${res.status}`);
        }
      } catch (err) {
        setPages(before);
        const inverse = order.map((_, i) => order.indexOf(i));
        remapNotesSessionCacheAfterReorder(docId, inverse);
        toast.error(`Reorder failed: ${String((err as Error).message ?? err)}`);
      }
    },
    [pages, index, docId, goTo],
  );

  const duplicatePage = useCallback(
    async (i: number) => {
      const before = pages;
      if (i < 0 || i >= before.length) return;
      const nextPages = [...before];
      nextPages.splice(i + 1, 0, before[i]);
      setPages(nextPages);
      if (index > i) goTo(index + 1);

      try {
        const res = await fetch(`/__docs/${encodeURIComponent(docId)}/pages/${i}/duplicate`, {
          method: 'POST',
        });
        if (!res.ok) {
          const detail = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(detail.error ?? `HTTP ${res.status}`);
        }
        toast.success(format(t.thumbnailRail.toastDuplicated, { n: i + 1 }));
      } catch (err) {
        setPages(before);
        toast.error(
          `${t.thumbnailRail.toastDuplicateFailed}: ${String((err as Error).message ?? err)}`,
        );
      }
    },
    [pages, index, docId, goTo, t.thumbnailRail],
  );

  const deletePage = useCallback(
    async (i: number) => {
      const before = pages;
      if (i < 0 || i >= before.length || before.length <= 1) return;
      const nextPages = before.slice(0, i).concat(before.slice(i + 1));
      setPages(nextPages);
      if (index >= i && index > 0) {
        const target = index === i ? Math.min(index, nextPages.length - 1) : index - 1;
        goTo(target);
      }

      try {
        const res = await fetch(`/__docs/${encodeURIComponent(docId)}/pages/${i}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const detail = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(detail.error ?? `HTTP ${res.status}`);
        }
        toast.success(format(t.thumbnailRail.toastDeleted, { n: i + 1 }));
      } catch (err) {
        setPages(before);
        toast.error(
          `${t.thumbnailRail.toastDeleteFailed}: ${String((err as Error).message ?? err)}`,
        );
      }
    },
    [pages, index, docId, goTo, t.thumbnailRail],
  );

  const thumbnailActions = useMemo<ThumbnailActions | undefined>(
    () =>
      import.meta.env.DEV
        ? {
            onDuplicate: duplicatePage,
            onDelete: deletePage,
          }
        : undefined,
    [duplicatePage, deletePage],
  );

  useEffect(() => {
    // When showDocUi is false the read-only <Player> is rendered and owns
    // keyboard navigation (including step-aware advance/retreat). Attaching this
    // page-nav handler too would race it and skip <Steps> reveals, so bail out.
    if (playMode || !showDocUi) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.matches('input, textarea')) return;
      // Letter shortcuts only fire bare so browser combos (Cmd/Ctrl-P, ⌘F…) stay intact.
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      // Toggle overview from either state — the overview's own capture-phase
      // handler doesn't consume O, so this stays consistent open ↔ closed.
      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        setOverviewOpen((v) => !v);
        return;
      }
      // Once overview owns focus, swallow everything else here — its
      // capture-phase listener drives the focused thumbnail.
      if (overviewOpen) return;
      if (
        e.key === 'ArrowRight' ||
        e.key === 'ArrowDown' ||
        e.key === ' ' ||
        e.key === 'PageDown'
      ) {
        e.preventDefault();
        goTo(index + 1);
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goTo(index - 1);
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        setPlayMode('fullscreen');
      } else if (e.key === 'Enter') {
        setPlayMode('window');
      } else if (e.key === 'p' || e.key === 'P') {
        if (docId) openPresenterWindow(docId);
        setPlayMode('window');
      } else if (import.meta.env.DEV && (e.key === 'd' || e.key === 'D')) {
        setDesignOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, goTo, playMode, docId, overviewOpen]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-muted-foreground">
        {showDocBrowser && (
          <Link to="/" className="text-[12px] font-medium text-foreground/70 hover:text-foreground">
            ← {t.common.home}
          </Link>
        )}
        <span className="mt-6 block eyebrow text-destructive/80">{t.common.loadFailed}</span>
        <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight text-foreground">
          {t.common.failedToLoadDoc}
        </h2>
        <pre className="mt-4 overflow-auto rounded-[6px] border border-border bg-card p-4 text-[11.5px] leading-relaxed whitespace-pre-wrap shadow-edge">
          {error}
        </pre>
      </div>
    );
  }

  const presentReady = Boolean(doc) && pageCount > 0 && isDeckWarmed(docId);
  if (playMode && doc && presentReady) {
    lastPresentedRef.current = { docId, doc, pages, index };
  }
  const presented = playMode
    ? doc && presentReady
      ? { docId, doc, pages, index }
      : (lastPresentedRef.current ?? (doc && pageCount > 0 ? { docId, doc, pages, index } : null))
    : null;

  if (playMode && presented) {
    return (
      <>
        <Player
          pages={presented.pages}
          design={presented.doc.design}
          transition={presented.doc.transition}
          index={presented.index}
          onIndexChange={presentReady ? goTo : noop}
          onExit={() => setPlayMode(null)}
          controls
          docId={presented.docId}
          onSwitchDoc={switchPresentedDoc}
          fullscreen={playMode === 'fullscreen'}
        />
        {!presentReady && doc && pageCount > 0 && (
          <DocPreloadLayer
            pages={pages}
            index={index}
            design={doc.design}
            includeCurrent
            onDone={handleAssetsWarmed}
          />
        )}
      </>
    );
  }

  if (!doc) {
    return (
      <div className="grid min-h-dvh place-items-center px-8 text-muted-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-px w-56 overflow-hidden bg-hairline">
            <span
              aria-hidden
              className="line-loader-bar absolute inset-y-[-0.5px] left-0 w-1/4 bg-foreground"
            />
          </div>
          <div className="flex flex-wrap items-baseline justify-center gap-x-2 text-[11.5px]">
            <span className="eyebrow">{t.doc.loadingEyebrow}</span>
            <span className="font-mono">{docId}</span>
          </div>
        </div>
      </div>
    );
  }

  if (pageCount === 0) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-muted-foreground">
        {showDocBrowser && (
          <Link to="/" className="text-[12px] font-medium text-foreground/70 hover:text-foreground">
            ← {t.common.home}
          </Link>
        )}
        <span className="mt-6 block eyebrow">{t.doc.emptyEyebrow}</span>
        <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight text-foreground">
          {t.doc.nothingToShow}
        </h2>
        <p className="mt-3 text-[13px] leading-relaxed">
          <code className="rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[11.5px]">
            docs/{docId}/index.tsx
          </code>
          {t.doc.emptyHintMust}
          <code className="rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[11.5px]">
            export default
          </code>
          {t.doc.emptyHintSuffix}
        </p>
      </div>
    );
  }

  // Hold the loader while a hidden layer warms the whole deck's images and
  // fonts, so the doc UI first paints with every asset already in cache.
  if (view !== 'assets' && !isDeckWarmed(docId)) {
    return (
      <div className="grid min-h-dvh place-items-center px-8 text-muted-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-px w-56 overflow-hidden bg-hairline">
            <span
              aria-hidden
              className="line-loader-bar absolute inset-y-[-0.5px] left-0 w-1/4 bg-foreground"
            />
          </div>
          <div className="flex flex-wrap items-baseline justify-center gap-x-2 text-[11.5px]">
            <span className="eyebrow">{t.doc.loadingAssetsEyebrow}</span>
            <span className="font-mono">{docId}</span>
          </div>
        </div>
        <DocPreloadLayer
          pages={pages}
          index={index}
          design={doc.design}
          includeCurrent
          onDone={handleAssetsWarmed}
        />
      </div>
    );
  }

  if (!showDocUi) {
    return (
      <Player
        pages={pages}
        design={doc.design}
        transition={doc.transition}
        index={index}
        onIndexChange={goTo}
        onExit={() => {}}
        allowExit={false}
      />
    );
  }

  const title = doc.meta?.title ?? docId;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t.doc.toastCopyLinkSuccess);
      setLinkCopied(true);
      if (linkCopiedTimerRef.current) clearTimeout(linkCopiedTimerRef.current);
      linkCopiedTimerRef.current = setTimeout(() => setLinkCopied(false), 1200);
    } catch (err) {
      console.error('[open-pdf] copy link failed', err);
      toast.error(t.doc.toastCopyLinkFailed);
    }
  };

  const exportHtml = async () => {
    if (!doc || exporting) return;
    setExporting(true);
    try {
      await exportDocAsHtml(doc, docId);
    } catch (err) {
      console.error('[open-pdf] export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const exportPdf = async () => {
    if (!doc || exporting) return;
    if (isSafari()) {
      toast.error(t.doc.pdfExportSafariUnsupported, { duration: 5000 });
      return;
    }
    setExporting(true);
    const toastId = `pdf-export-${docId}`;
    toast.custom(
      () => (
        <PdfProgressToast
          progress={{ phase: 'processing', current: 0, total: pages.length, percent: 0 }}
        />
      ),
      { id: toastId, duration: Infinity },
    );
    try {
      await exportDocAsPdf(doc, docId, (p) => {
        toast.custom(() => <PdfProgressToast progress={p} />, { id: toastId, duration: Infinity });
      });
    } catch (err) {
      console.error('[open-pdf] pdf export failed', err);
      toast.error(t.doc.pdfExportFailed, { id: toastId, duration: 4000 });
    } finally {
      setExporting(false);
      toast.dismiss(toastId);
    }
  };

  const exportImagePptx = async () => {
    if (!doc || exporting) return;
    setExporting(true);
    const toastId = `pptx-export-${docId}`;
    toast.custom(
      () => (
        <PptxProgressToast
          progress={{ phase: 'processing', current: 0, total: pages.length, percent: 0 }}
        />
      ),
      { id: toastId, duration: Infinity },
    );
    try {
      await exportDocAsImagePptx(doc, docId, (p) => {
        toast.custom(() => <PptxProgressToast progress={p} />, { id: toastId, duration: Infinity });
      });
    } catch (err) {
      console.error('[open-pdf] image pptx export failed', err);
      toast.error(t.doc.imagePptxExportFailed, { id: toastId, duration: 4000 });
    } finally {
      setExporting(false);
      toast.dismiss(toastId);
    }
  };

  const exportMenuItems = (
    <>
      <DropdownMenuItem disabled={exporting} onClick={exportHtml}>
        <FileCode2 />
        {t.doc.exportAsHtml}
      </DropdownMenuItem>
      <DropdownMenuItem disabled={exporting} onClick={exportPdf}>
        <FileText />
        {t.doc.exportAsPdf}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled={exporting} onClick={exportImagePptx}>
        <FileImage />
        {t.doc.exportAsImagePptx}
      </DropdownMenuItem>
      <TooltipProvider delay={200}>
        <Tooltip>
          <TooltipTrigger
            render={
              <div
                aria-disabled
                className="relative flex cursor-help items-center justify-between gap-2 rounded-[5px] px-2 py-1.5 text-[12.5px] opacity-45 select-none [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:opacity-80"
              >
                <span className="flex items-center gap-2">
                  <Presentation />
                  {t.doc.exportAsPptx}
                </span>
                <span className="rounded-[3px] bg-muted px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.04em] text-muted-foreground">
                  {t.doc.comingSoon}
                </span>
              </div>
            }
          />
          <TooltipContent
            side="left"
            className="w-max max-w-[min(520px,calc(100vw-2rem))] text-center leading-relaxed"
          >
            {t.doc.pptxComingSoonTooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );

  return (
    <HistoryProvider>
      <InspectorProvider docId={docId} pageIndex={index}>
        <SelectionReporter />
        <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
          {/* Editorial toolbar — three zones, hairline separators, mono-folio center */}
          <header className="relative flex h-12 shrink-0 items-center gap-2 border-b border-hairline bg-sidebar/85 px-2 backdrop-blur-md md:px-3">
            <div className="flex flex-1 items-center gap-1.5 md:flex-none md:gap-2">
              {showDocBrowser && (
                <Link
                  to="/"
                  aria-label={t.doc.backToHome}
                  title={t.doc.home}
                  className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                >
                  <ChevronLeft className="size-4" />
                </Link>
              )}
              <span aria-hidden className="mx-0.5 hidden h-5 w-px bg-hairline md:block" />
              {import.meta.env.DEV && (
                <Tabs
                  value={view}
                  onValueChange={(next) => {
                    setSearchParams(
                      (prev) => {
                        const params = new URLSearchParams(prev);
                        if (next === 'assets') params.set('view', 'assets');
                        else params.delete('view');
                        return params;
                      },
                      { replace: true },
                    );
                  }}
                >
                  <TabsList>
                    <TabsTrigger value="docs">{t.doc.docsTab}</TabsTrigger>
                    <TabsTrigger value="assets">{t.doc.assetsTab}</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
              {import.meta.env.DEV && <AgentConnectedBadge />}
            </div>

            {/* On md+ the title centers to the viewport via absolute positioning. On mobile the
                two side groups each flex-1, so the in-flow title lands at the viewport center too —
                and min-w-0 lets it truncate instead of overlapping the icons on narrow widths. */}
            <div className="pointer-events-none relative flex min-w-0 justify-center px-2 md:absolute md:inset-x-0">
              <div className="pointer-events-auto min-w-0 max-w-[34rem]">
                <InlineTitleEditor title={title} onSubmit={(next) => renameDoc(docId, next)} />
              </div>
            </div>

            <div className="flex flex-1 items-center justify-end gap-1 md:ml-auto md:flex-none">
              {view === 'docs' && (
                <button
                  type="button"
                  aria-label={t.doc.copyLink}
                  title={t.doc.copyLink}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                    'hidden md:inline-flex',
                  )}
                  onClick={copyLink}
                >
                  <span className="relative grid size-4 place-items-center">
                    <Link2
                      className={cn(
                        'col-start-1 row-start-1 size-4 transition-opacity duration-200',
                        linkCopied ? 'opacity-0' : 'opacity-100',
                      )}
                    />
                    <Check
                      className={cn(
                        'col-start-1 row-start-1 size-4 transition-opacity duration-200',
                        linkCopied ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </span>
                </button>
              )}
              {view === 'docs' && allowHtmlDownload && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    type="button"
                    disabled={exporting}
                    aria-label={t.doc.download}
                    title={t.doc.download}
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                      'hidden md:inline-flex',
                    )}
                  >
                    {exporting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[200px]">
                    {exportMenuItems}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {view === 'docs' && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    type="button"
                    disabled={exporting}
                    aria-label={t.doc.moreActions}
                    title={t.doc.moreActions}
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                      'inline-flex md:hidden',
                    )}
                  >
                    {exporting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="size-4" />
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[200px]">
                    <DropdownMenuItem onClick={() => setCommandOpen(true)}>
                      <Terminal />
                      {t.commandMenu.trigger}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={copyLink}>
                      <Link2 />
                      {t.doc.copyLink}
                    </DropdownMenuItem>
                    {allowHtmlDownload && <DropdownMenuSeparator />}
                    {allowHtmlDownload && exportMenuItems}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {view === 'docs' && (
                <DesignToggleButton active={designOpen} onToggle={() => setDesignOpen((v) => !v)} />
              )}
              {view === 'docs' && <InspectToggleButton />}
              <span aria-hidden className="mx-0.5 hidden h-5 w-px bg-hairline md:block" />
              {view === 'docs' && (
                <div className="inline-flex items-stretch">
                  <Button
                    size="sm"
                    variant="brand"
                    onClick={() => setPlayMode(isMobile ? 'window' : 'fullscreen')}
                    className="px-2.5 md:rounded-r-none md:px-3"
                  >
                    <Play className="size-3.5 fill-current" />
                    <span className="hidden md:inline">{t.doc.present}</span>
                    <kbd className="ml-1 hidden rounded-[3px] bg-brand-foreground/15 px-1 font-mono text-[9.5px] tracking-[0.04em] md:inline">
                      F
                    </kbd>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      type="button"
                      aria-label={t.doc.presentMenuAria}
                      title={t.doc.presentMenuAria}
                      className={cn(
                        buttonVariants({ variant: 'brand', size: 'sm' }),
                        'hidden rounded-l-none px-1.5 shadow-[inset_1px_0_0_oklch(0_0_0/0.12),inset_0_1px_0_oklch(1_0_0/0.18),0_1px_0_oklch(0_0_0/0.16)] md:inline-flex',
                      )}
                    >
                      <ChevronDown className="size-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[200px]">
                      <DropdownMenuItem onClick={() => setPlayMode('window')}>
                        <Play />
                        {t.doc.presentInWindow}
                        <DropdownMenuShortcut>↵</DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPlayMode('fullscreen')}>
                        <Maximize />
                        {t.doc.presentFullscreen}
                        <DropdownMenuShortcut>F</DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (docId) openPresenterWindow(docId);
                          setPlayMode('window');
                        }}
                      >
                        <MonitorSpeaker />
                        {t.doc.presentPresenter}
                        <DropdownMenuShortcut>P</DropdownMenuShortcut>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </header>

          {view === 'assets' ? (
            <div className="min-h-0 flex-1">
              <AssetView docId={docId} />
            </div>
          ) : (
            <DesignProvider docId={docId}>
              <div className="relative flex min-h-0 flex-1 flex-col">
                <div className="flex min-h-0 flex-1 flex-col md:flex-row">
                  <ResizableRail
                    pages={pages}
                    design={doc.design}
                    current={index}
                    onSelect={goTo}
                    onReorder={import.meta.env.DEV ? reorderPage : undefined}
                    actions={thumbnailActions}
                    moduleTransition={doc.transition}
                    onOverview={() => setOverviewOpen(true)}
                  />
                  <main
                    ref={docViewportRef}
                    data-inspector-root
                    data-doc-id={docId}
                    className="relative min-h-0 min-w-0 flex-1 bg-canvas p-2 md:p-10"
                  >
                    <DocViewportNavigation
                      targetRef={docViewportRef}
                      onPrev={() => goTo(index - 1)}
                      onNext={() => goTo(index + 1)}
                      canPrev={index > 0}
                      canNext={index < pageCount - 1}
                    />
                    <DocCanvas design={doc.design}>
                      <DocTransitionLayer
                        pages={pages}
                        index={index}
                        total={pageCount}
                        moduleTransition={doc.transition}
                        disabled={prefersReducedMotion}
                      />
                    </DocCanvas>
                    <InspectOverlay />
                    <SaveBar />
                    {import.meta.env.DEV && <CommentWidget />}
                  </main>
                  {/* Mobile-only horizontal rail. Sits below the canvas and
                    pads its bottom for the iOS home indicator / Safari URL bar. */}
                  <div
                    className="shrink-0 border-t border-hairline md:hidden"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                  >
                    <ThumbnailRail
                      pages={pages}
                      design={doc.design}
                      current={index}
                      onSelect={goTo}
                      orientation="horizontal"
                      actions={thumbnailActions}
                    />
                  </div>
                  <InspectorPanel />
                  <DesignPanel open={designOpen} onClose={() => setDesignOpen(false)} />
                </div>
                {import.meta.env.DEV && (
                  <NotesDrawer
                    docId={docId}
                    index={index}
                    total={pageCount}
                    initial={doc.notes?.[index]}
                  />
                )}
                <OverviewGrid
                  pages={pages}
                  design={doc.design}
                  open={overviewOpen}
                  current={index}
                  onClose={() => setOverviewOpen(false)}
                  onSelect={goTo}
                  variant="editor"
                  moduleTransition={doc.transition}
                />
              </div>
            </DesignProvider>
          )}

          {view === 'docs' && (
            <DocCommandMenu
              open={commandOpen}
              onOpenChange={setCommandOpen}
              pageCount={pageCount}
              currentIndex={index}
              exporting={exporting}
              handlers={{
                onPresentWindow: () => setPlayMode('window'),
                onPresentFullscreen: () => setPlayMode('fullscreen'),
                onPresenterView: () => {
                  if (docId) openPresenterWindow(docId);
                  setPlayMode('window');
                },
                onCopyLink: copyLink,
                onOverview: () => setOverviewOpen(true),
                onToggleDesignPanel: () => setDesignOpen((v) => !v),
                onExportHtml: exportHtml,
                onExportPdf: exportPdf,
                onExportImagePptx: exportImagePptx,
                onGoToPage: goTo,
              }}
            />
          )}
        </div>
      </InspectorProvider>
    </HistoryProvider>
  );
}

const RAIL_WIDTH_STORAGE_KEY = 'open-pdf:thumbnail-rail-width';
const DEFAULT_RAIL_WIDTH = 264;
const MIN_RAIL_WIDTH = 200;
const MAX_RAIL_WIDTH = 480;

function readStoredRailWidth(): number {
  if (typeof window === 'undefined') return DEFAULT_RAIL_WIDTH;
  const raw = window.localStorage.getItem(RAIL_WIDTH_STORAGE_KEY);
  const parsed = raw == null ? Number.NaN : Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_RAIL_WIDTH;
  return Math.min(MAX_RAIL_WIDTH, Math.max(MIN_RAIL_WIDTH, parsed));
}

function ResizableRail(props: {
  pages: DocModule['default'];
  design?: DocModule['design'];
  current: number;
  onSelect: (i: number) => void;
  onReorder?: (from: number, to: number) => void;
  actions?: ThumbnailActions;
  moduleTransition?: DocModule['transition'];
  onOverview?: () => void;
}) {
  const t = useLocale();
  const [width, setWidth] = useState<number>(readStoredRailWidth);
  const [resizing, setResizing] = useState(false);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(RAIL_WIDTH_STORAGE_KEY, String(width));
  }, [width]);

  useEffect(() => {
    if (!resizing) return;
    const prev = {
      cursor: document.body.style.cursor,
      userSelect: document.body.style.userSelect,
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.body.style.cursor = prev.cursor;
      document.body.style.userSelect = prev.userSelect;
    };
  }, [resizing]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startWidth: width };
    setResizing(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const delta = e.clientX - dragRef.current.startX;
    const next = Math.min(
      MAX_RAIL_WIDTH,
      Math.max(MIN_RAIL_WIDTH, dragRef.current.startWidth + delta),
    );
    setWidth(next);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
    setResizing(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 32 : 8;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      setWidth((w) => Math.max(MIN_RAIL_WIDTH, w - step));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      setWidth((w) => Math.min(MAX_RAIL_WIDTH, w + step));
    } else if (e.key === 'Home') {
      e.preventDefault();
      e.stopPropagation();
      setWidth(DEFAULT_RAIL_WIDTH);
    }
  };

  return (
    <div className="relative hidden shrink-0 md:block" style={{ width }}>
      <ThumbnailRail width={width} {...props} />
      {/* biome-ignore lint/a11y/useSemanticElements: focusable resize handle (splitter pattern), not a static <hr> */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={t.thumbnailRail.resizeRail}
        aria-valuenow={width}
        aria-valuemin={MIN_RAIL_WIDTH}
        aria-valuemax={MAX_RAIL_WIDTH}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        onDoubleClick={() => setWidth(DEFAULT_RAIL_WIDTH)}
        className={cn(
          'group/resize absolute inset-y-0 right-0 z-20 w-1.5 translate-x-1/2 cursor-col-resize touch-none outline-none',
          'focus-visible:bg-brand/20',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-brand opacity-0 transition-opacity',
            'group-hover/resize:opacity-100 group-focus-visible/resize:opacity-100',
            resizing && 'opacity-100',
          )}
        />
      </div>
    </div>
  );
}

function AgentConnectedBadge() {
  const t = useLocale();
  const connected = useAgentSocketConnected();
  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className="ml-1 flex shrink-0 cursor-help items-center gap-1.5 rounded-[3px] border border-hairline bg-card px-1.5 py-0.5 text-[10.5px] text-foreground/85 outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <span aria-hidden className="relative flex size-1.5 items-center justify-center">
                {connected ? (
                  <>
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                  </>
                ) : (
                  <span className="relative inline-flex size-1.5 rounded-full bg-rose-500" />
                )}
              </span>
              {connected ? t.doc.agentConnected : t.doc.agentDisconnected}
            </button>
          }
        />
        <TooltipContent
          side="bottom"
          align="start"
          className="w-max max-w-[min(520px,calc(100vw-2rem))] text-center leading-relaxed"
        >
          {connected ? t.doc.agentConnectedTooltip : t.doc.agentDisconnectedTooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SelectionReporter() {
  const { selected } = useInspector();
  useEffect(() => {
    if (!import.meta.hot) return;
    const selection = selected
      ? {
          line: selected.line,
          column: selected.column,
          tagName: selected.anchor.tagName.toLowerCase(),
          text: (selected.anchor.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 120),
        }
      : null;
    import.meta.hot.send('open-pdf:current', { selection });
  }, [selected]);
  return null;
}

function DocViewportNavigation({
  targetRef,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: {
  targetRef: RefObject<HTMLElement>;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}) {
  const { active } = useInspector();
  const isMobile = useIsMobile();

  useWheelPageNavigation({
    ref: targetRef,
    enabled: !active,
    canPrev,
    canNext,
    onPrev,
    onNext,
  });

  // Tap-to-navigate is a touch affordance — desktop has visible prev/next
  // chrome, so it stays edge-only on small screens (matches the old md:hidden
  // zones). Interactive doc content keeps its tap via the hook's passthrough.
  useClickPageNavigation({
    ref: targetRef,
    enabled: isMobile && !active,
    edgeRatio: 0.18,
    canPrev,
    canNext,
    onPrev,
    onNext,
  });

  return null;
}

function InlineTitleEditor({
  title,
  onSubmit,
}: {
  title: string;
  onSubmit: (name: string) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const t = useLocale();

  useEffect(() => {
    if (!editing) setValue(title);
  }, [title, editing]);

  useEffect(() => {
    if (editing) {
      queueMicrotask(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing]);

  const commit = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === title) {
      setValue(title);
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSubmit(trimmed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setValue(title);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex min-w-0 flex-1 items-center justify-center">
        <div className="inline-grid max-w-full items-center">
          <span
            aria-hidden
            className="invisible col-start-1 row-start-1 overflow-hidden whitespace-pre border border-transparent px-2 py-0.5 font-heading text-[13.5px] font-semibold tracking-[-0.01em]"
          >
            {value || ' '}
          </span>
          <input
            ref={inputRef}
            size={1}
            value={value}
            disabled={saving}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => {
              if (!saving) commit();
            }}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
              }
            }}
            maxLength={80}
            className="col-start-1 row-start-1 w-full min-w-0 rounded-[5px] border border-foreground/30 bg-card px-2 py-0.5 text-center font-heading text-[13.5px] font-semibold tracking-[-0.01em] outline-none"
          />
        </div>
      </div>
    );
  }

  if (!import.meta.env.DEV) {
    return (
      <div className="flex min-w-0 items-baseline justify-center">
        <h1 className="truncate font-heading text-[13.5px] font-semibold tracking-[-0.01em]">
          {title}
        </h1>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center justify-center">
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={t.doc.renameDoc}
        className={cn(
          'min-w-0 max-w-full cursor-text rounded-[5px] border border-transparent px-2 py-0.5 transition-colors',
          'hover:border-foreground/30 hover:bg-card focus-visible:border-foreground/30 focus-visible:bg-card focus-visible:outline-none',
        )}
      >
        <h1 className="truncate font-heading text-[13.5px] font-semibold tracking-[-0.01em]">
          {title}
        </h1>
      </button>
    </div>
  );
}
