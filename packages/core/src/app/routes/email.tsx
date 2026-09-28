import config from 'virtual:open-pages/config';
import {
  ChevronLeft,
  Code2,
  Copy,
  Crosshair,
  ExternalLink,
  FileText,
  Loader2,
  Monitor,
  RotateCw,
  Smartphone,
  TriangleAlert,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { type Selection, SelectionNote } from '~/components/selection-note';
import { Button, buttonVariants } from '~/components/ui/button';
import { readLastHomeLocation } from '~/lib/last-home-location';
import { format, useLocale } from '~/lib/use-locale';
import { cn } from '~/lib/utils';
import { emailChangeIncludes, emailIds, emailMeta } from '../lib/emails';
import { emailUrl, type FrameMessage, isFrameMessage, type WorkspaceMessage } from '../lib/frame';

const { showPageUi, showPageBrowser } = config.build;

type View = 'html' | 'text';
type Viewport = { id: 'desktop' | 'mobile'; width: number | null };

const VIEWPORTS: Viewport[] = [
  { id: 'desktop', width: null },
  { id: 'mobile', width: 375 },
];
const VIEWPORT_STORAGE_KEY = 'open-pages:email-viewport';
const VIEWPORT_ICONS = { desktop: Monitor, mobile: Smartphone } as const;

function readViewportPref(): Viewport {
  try {
    const raw = window.localStorage.getItem(VIEWPORT_STORAGE_KEY);
    return VIEWPORTS.find((v) => v.id === raw) ?? VIEWPORTS[0];
  } catch {
    return VIEWPORTS[0];
  }
}

export function EmailView() {
  const { emailId = '' } = useParams();
  const known = emailIds.includes(emailId);
  const info = emailMeta[emailId];
  const title = info?.title ?? emailId;
  const t = useLocale();

  useEffect(() => {
    document.title = `${title} — Autono`;
    return () => {
      document.title = 'Autono';
    };
  }, [title]);

  const navigate = useNavigate();
  const goBack = useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(readLastHomeLocation(), { replace: true });
  }, [navigate]);

  const [view, setView] = useState<View>('html');
  const [viewport, setViewport] = useState<Viewport>(readViewportPref);
  const pickViewport = (v: Viewport) => {
    setViewport(v);
    try {
      window.localStorage.setItem(VIEWPORT_STORAGE_KEY, v.id);
    } catch {}
  };

  // Bumped on every change to the email or its imports; the frame and the
  // text alternative both re-fetch from the server.
  const [version, setVersion] = useState(0);
  const [frameEl, setFrameEl] = useState<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (!import.meta.hot) return;
    const handler = (data: unknown) => {
      if (emailChangeIncludes(data, emailId)) setVersion((v) => v + 1);
    };
    import.meta.hot.on('open-pages:email-changed', handler);
    return () => import.meta.hot?.off('open-pages:email-changed', handler);
  }, [emailId]);

  const [unresolved, setUnresolved] = useState<string[]>([]);
  useEffect(() => {
    if (!known) return;
    let cancelled = false;
    fetch(`${emailUrl(emailId, 'json')}?v=${version}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { unresolved?: unknown } | null) => {
        if (cancelled) return;
        setUnresolved(Array.isArray(body?.unresolved) ? (body.unresolved as string[]) : []);
      })
      .catch(() => {
        if (!cancelled) setUnresolved([]);
      });
    return () => {
      cancelled = true;
    };
  }, [known, emailId, version]);

  useEffect(() => {
    if (view !== 'text' || !known) return;
    let cancelled = false;
    setText(null);
    fetch(`${emailUrl(emailId, 'text')}?v=${version}`)
      .then((res) => res.text())
      .then((body) => {
        if (!cancelled) setText(body);
      })
      .catch((e) => {
        if (!cancelled) setText(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [view, known, emailId, version]);

  const [inspecting, setInspecting] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const send = useCallback(
    (msg: WorkspaceMessage) => {
      frameEl?.contentWindow?.postMessage(msg, '*');
    },
    [frameEl],
  );

  useEffect(() => {
    send({ type: 'op:inspect', on: inspecting });
    if (!inspecting) {
      setSelection(null);
      send({ type: 'op:select', loc: null });
    }
  }, [inspecting, send]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameEl?.contentWindow) return;
      if (!isFrameMessage(event.data)) return;
      const msg: FrameMessage = event.data;
      if (msg.type === 'op:ready') {
        setReady(true);
        send({ type: 'op:inspect', on: inspecting });
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
  }, [frameEl, inspecting, send]);

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
    if (!import.meta.hot || !emailId || !known) return;
    import.meta.hot.send('open-pages:current', {
      pageId: emailId,
      pageTitle: title,
      view: 'emails',
    });
  }, [emailId, known, title]);

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
        body: JSON.stringify({ pageId: emailId, target: 'email', line, column, text: note.trim() }),
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
  }, [selection, note, emailId]);

  const copyHtml = useCallback(async () => {
    try {
      const res = await fetch(`${emailUrl(emailId, 'html')}?raw`);
      if (!res.ok) throw new Error(`${res.status}`);
      await navigator.clipboard.writeText(await res.text());
      toast.success(t.emails.copiedHtml);
    } catch {
      toast.error(t.emails.copyHtmlFailed);
    }
  }, [emailId, t]);

  const frameSrc = useMemo(
    () => (known ? `${emailUrl(emailId, 'html')}?v=${version}` : ''),
    [known, emailId, version],
  );
  const rawSrc = known ? `${emailUrl(emailId, 'html')}?raw` : undefined;
  const canInspect = view === 'html' && import.meta.env.DEV;

  return (
    <div className="flex h-screen flex-col bg-muted/40 text-foreground">
      {showPageUi && (
        <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background px-3">
          {showPageBrowser && (
            <Button variant="ghost" size="icon" aria-label={t.emails.backToEmails} onClick={goBack}>
              <ChevronLeft className="size-4" />
            </Button>
          )}
          <h1 className="min-w-0 truncate text-sm font-medium">{title}</h1>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            email
          </span>
          {known && (
            <span
              className="hidden min-w-0 truncate text-xs text-muted-foreground md:inline"
              title={t.emails.subjectLabel}
            >
              {info?.subject ?? t.emails.noSubject}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {unresolved.length > 0 && (
              <span
                className="flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-700 dark:text-amber-300"
                title={`${t.emails.unresolvedTitle}\n${unresolved.join(' ')}`}
              >
                <TriangleAlert className="size-3.5" aria-hidden />
                {format(t.emails.unresolvedCount, { count: String(unresolved.length) })}
              </span>
            )}
            {!ready && known && view === 'html' && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                {t.page.loadingEyebrow}
              </span>
            )}
            <fieldset className="flex items-center rounded-md border p-0.5" aria-label="View">
              <Button
                variant={view === 'html' ? 'secondary' : 'ghost'}
                size="sm"
                aria-pressed={view === 'html'}
                onClick={() => setView('html')}
              >
                <Code2 className="size-3.5" />
                {t.emails.viewHtml}
              </Button>
              <Button
                variant={view === 'text' ? 'secondary' : 'ghost'}
                size="sm"
                aria-pressed={view === 'text'}
                onClick={() => setView('text')}
              >
                <FileText className="size-3.5" />
                {t.emails.viewText}
              </Button>
            </fieldset>
            {view === 'html' && (
              <fieldset className="flex items-center rounded-md border p-0.5" aria-label="Viewport">
                {VIEWPORTS.map((v) => {
                  const Icon = VIEWPORT_ICONS[v.id];
                  const label =
                    v.id === 'desktop' ? t.emails.viewportDesktop : t.emails.viewportMobile;
                  return (
                    <Button
                      key={v.id}
                      variant={viewport.id === v.id ? 'secondary' : 'ghost'}
                      size="icon-sm"
                      aria-label={label}
                      aria-pressed={viewport.id === v.id}
                      title={v.width ? `${label} · ${v.width}px` : label}
                      onClick={() => pickViewport(v)}
                    >
                      <Icon className="size-3.5" />
                    </Button>
                  );
                })}
              </fieldset>
            )}
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={t.emails.reload}
              title={t.emails.reload}
              onClick={() => {
                setReady(false);
                setVersion((v) => v + 1);
              }}
            >
              <RotateCw className="size-3.5" />
            </Button>
            {canInspect && (
              <Button
                variant={inspecting ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInspecting((v) => !v)}
                disabled={!ready}
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
              onClick={copyHtml}
              disabled={!known}
              title={t.emails.copyHtml}
            >
              <Copy className="size-4" />
              {t.emails.copyHtml}
            </Button>
            <a
              href={rawSrc}
              target="_blank"
              rel="noreferrer"
              aria-label={t.emails.openInTab}
              aria-disabled={!known || undefined}
              tabIndex={known ? undefined : -1}
              title={t.emails.openInTab}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                !known && 'pointer-events-none opacity-50',
              )}
            >
              <ExternalLink className="size-4" />
              Open
            </a>
          </div>
        </header>
      )}

      {!known && (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 font-mono text-xs text-destructive whitespace-pre-wrap">
          {format(t.emails.notFound, { id: emailId })}
        </div>
      )}

      <main className="relative flex min-h-0 flex-1 justify-center overflow-hidden">
        {known && view === 'html' && (
          <iframe
            key={frameSrc}
            ref={setFrameEl}
            title={title}
            src={frameSrc}
            className={cn(
              'h-full border-0 bg-white',
              viewport.width !== null && 'border-x shadow-md',
              inspecting && 'cursor-crosshair',
            )}
            style={{ width: viewport.width ?? '100%', maxWidth: '100%' }}
          />
        )}
        {known && view === 'text' && (
          <div className="h-full w-full overflow-auto bg-background">
            {text === null ? (
              <div className="flex items-center gap-1.5 px-6 py-6 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                {t.page.loadingEyebrow}
              </div>
            ) : (
              <pre className="mx-auto w-full max-w-[72ch] whitespace-pre-wrap px-6 py-8 font-mono text-[13px] leading-6 text-foreground">
                {text}
              </pre>
            )}
          </div>
        )}

        {selection && (
          <SelectionNote
            selection={selection}
            note={note}
            saving={savingNote}
            onNoteChange={setNote}
            onSubmit={submitComment}
            onClear={() => setSelection(null)}
          />
        )}
      </main>
    </div>
  );
}
