import config from 'virtual:open-pages/config';
import {
  ChevronLeft,
  Crosshair,
  ExternalLink,
  Loader2,
  MessageSquarePlus,
  Monitor,
  RotateCw,
  Smartphone,
  Tablet,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { type FrameMessage, frameUrl, isFrameMessage, type WorkspaceMessage } from '../lib/frame';
import { pageChangeIncludes, pageIds, pageKinds } from '../lib/pages';
import { usePageModule } from '../lib/use-page-module';

const { showPageUi, showPageBrowser } = config.build;

type Viewport = { id: 'desktop' | 'tablet' | 'mobile'; width: number | null; label: string };

const VIEWPORTS: Viewport[] = [
  { id: 'desktop', width: null, label: 'Desktop' },
  { id: 'tablet', width: 820, label: 'Tablet' },
  { id: 'mobile', width: 390, label: 'Mobile' },
];

const VIEWPORT_STORAGE_KEY = 'open-pages:viewport';

function readViewportPref(): Viewport {
  try {
    const raw = window.localStorage.getItem(VIEWPORT_STORAGE_KEY);
    return VIEWPORTS.find((v) => v.id === raw) ?? VIEWPORTS[0];
  } catch {
    return VIEWPORTS[0];
  }
}

const VIEWPORT_ICONS = { desktop: Monitor, tablet: Tablet, mobile: Smartphone } as const;

type Selection = { loc: string; tag: string; text: string };

export function PageView() {
  const { pageId = '' } = useParams();
  const known = pageIds.includes(pageId);
  const kind = pageKinds[pageId] ?? 'react';
  const { page: pageModule } = usePageModule(pageId);

  const title = pageModule?.meta?.title ?? pageId;
  useEffect(() => {
    document.title = `${title} — open-pages`;
  }, [title]);

  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [frameKey, setFrameKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>(readViewportPref);
  const pickViewport = (v: Viewport) => {
    setViewport(v);
    try {
      window.localStorage.setItem(VIEWPORT_STORAGE_KEY, v.id);
    } catch {}
  };

  const [inspecting, setInspecting] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const send = useCallback((msg: WorkspaceMessage) => {
    frameRef.current?.contentWindow?.postMessage(msg, '*');
  }, []);

  useEffect(() => {
    send({ type: 'op:inspect', on: inspecting });
    if (!inspecting) {
      setSelection(null);
      send({ type: 'op:select', loc: null });
    }
  }, [inspecting, send]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!isFrameMessage(event.data)) return;
      const msg: FrameMessage = event.data;
      if (msg.type === 'op:ready') {
        setReady(true);
        setError(null);
        send({ type: 'op:inspect', on: inspecting });
      } else if (msg.type === 'op:error') {
        setReady(true);
        setError(msg.message);
      } else if (msg.type === 'op:select') {
        setSelection({ loc: msg.loc, tag: msg.tag, text: msg.text });
        setNote('');
      } else if (msg.type === 'op:key') {
        if (msg.key === 'i') setInspecting((v) => !v);
        if (msg.key === 'Escape') setSelection(null);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [inspecting, send]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'i') setInspecting((v) => !v);
      if (e.key === 'Escape') setSelection(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (kind !== 'html' || !import.meta.hot) return;
    const handler = (data: unknown) => {
      if (pageChangeIncludes(data, pageId)) setFrameKey((k) => k + 1);
    };
    import.meta.hot.on('open-pages:page-changed', handler);
    return () => import.meta.hot?.off('open-pages:page-changed', handler);
  }, [kind, pageId]);

  // Agent cursor: which page is open, and what is selected.
  useEffect(() => {
    if (!import.meta.hot || !pageId || !known) return;
    import.meta.hot.send('open-pages:current', { pageId, pageTitle: title, view: 'pages' });
  }, [pageId, known, title]);

  useEffect(() => {
    if (!import.meta.hot) return;
    const [line, column] = selection
      ? selection.loc.split(':').map(Number)
      : [undefined, undefined];
    import.meta.hot.send('open-pages:current', {
      selection: selection ? { line, column, tagName: selection.tag, text: selection.text } : null,
    });
    send({ type: 'op:select', loc: selection?.loc ?? null });
  }, [selection, send]);

  const submitComment = useCallback(async () => {
    if (!selection || !note.trim()) return;
    const [line, column] = selection.loc.split(':').map(Number);
    setSavingNote(true);
    try {
      const res = await fetch('/__comments/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, line, column, text: note.trim() }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `POST /__comments/add → ${res.status}`);
      }
      toast.success('Comment saved — run /apply-comments to apply it');
      setSelection(null);
      setNote('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingNote(false);
    }
  }, [selection, note, pageId]);

  const src = useMemo(() => (known ? frameUrl({ pageId, kind }) : ''), [known, pageId, kind]);
  const canInspect = kind === 'react' && import.meta.env.DEV;

  return (
    <div className="flex h-screen flex-col bg-muted/40 text-foreground">
      {showPageUi && (
        <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background px-3">
          {showPageBrowser && (
            <Button variant="ghost" size="icon" aria-label="Back to pages" render={<Link to="/" />}>
              <ChevronLeft className="size-4" />
            </Button>
          )}
          <h1 className="min-w-0 truncate text-sm font-medium">{title}</h1>
          {kind === 'html' && (
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              html
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {!ready && known && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Loading
              </span>
            )}
            <fieldset className="flex items-center rounded-md border p-0.5" aria-label="Viewport">
              {VIEWPORTS.map((v) => {
                const Icon = VIEWPORT_ICONS[v.id];
                return (
                  <Button
                    key={v.id}
                    variant={viewport.id === v.id ? 'secondary' : 'ghost'}
                    size="icon-sm"
                    aria-label={v.label}
                    aria-pressed={viewport.id === v.id}
                    title={v.width ? `${v.label} · ${v.width}px` : v.label}
                    onClick={() => pickViewport(v)}
                  >
                    <Icon className="size-3.5" />
                  </Button>
                );
              })}
            </fieldset>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Reload page"
              title="Reload the page"
              onClick={() => {
                setReady(false);
                setFrameKey((k) => k + 1);
              }}
            >
              <RotateCw className="size-3.5" />
            </Button>
            {canInspect && (
              <Button
                variant={inspecting ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInspecting((v) => !v)}
                disabled={!ready || !!error}
                aria-pressed={inspecting}
                title="Inspect elements (i) — click any element to select it or leave a comment"
              >
                <Crosshair className="size-4" />
                Inspect
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={!known}
              render={<a href={src} target="_blank" rel="noreferrer" />}
              aria-label="Open page in a new tab"
              title="Open the page by itself in a new tab"
            >
              <ExternalLink className="size-4" />
              Open
            </Button>
          </div>
        </header>
      )}

      {(error || !known) && (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 font-mono text-xs text-destructive whitespace-pre-wrap">
          {known ? error : `Page not found: ${pageId}`}
        </div>
      )}

      <main className="relative flex min-h-0 flex-1 justify-center overflow-hidden">
        {known && (
          <iframe
            key={frameKey}
            ref={frameRef}
            title={title}
            src={src}
            className={cn(
              'h-full border-0 bg-white',
              viewport.width !== null && 'border-x shadow-md',
              inspecting && 'cursor-crosshair',
            )}
            style={{ width: viewport.width ?? '100%', maxWidth: '100%' }}
          />
        )}

        {selection && (
          <div className="fixed bottom-6 right-6 z-20 w-[340px] rounded-lg border bg-background p-3 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                {selection.tag}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                line {selection.loc.replace(':', ', col ')}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto size-6"
                aria-label="Clear selection"
                onClick={() => setSelection(null)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
            {selection.text && (
              <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                “{selection.text}”
              </p>
            )}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Leave a note for your agent — e.g. “make this bold”"
              rows={2}
              className="mt-2 w-full resize-none rounded-md border bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button
                size="sm"
                onClick={submitComment}
                disabled={!note.trim() || savingNote}
                aria-label="Save comment"
              >
                {savingNote ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <MessageSquarePlus className="size-3.5" />
                )}
                Comment
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
