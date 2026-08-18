import config from 'virtual:open-pdf/config';
import { ChevronLeft, Download, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PdfPageCanvas, usePdfDocument } from '../lib/pdf/pdf-viewer';
import { useDocPdf } from '../lib/pdf/use-doc-pdf';
import { useDocModule } from '../lib/use-doc-module';

const { showDocUi, showDocBrowser } = config.build;

const PAGE_MAX_WIDTH = 880;
const THUMB_WIDTH = 108;

export function Doc() {
  const { docId = '' } = useParams();
  const { doc: docModule } = useDocModule(docId);
  const { bytes, rendering, error, durationMs, version } = useDocPdf(docId);
  const { doc: pdfDoc, error: parseError } = usePdfDocument(bytes, version);

  const title = docModule?.meta?.title ?? docId;
  useEffect(() => {
    document.title = `${title} — open-pdf`;
  }, [title]);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [pageWidth, setPageWidth] = useState(PAGE_MAX_WIDTH);
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => {
      setPageWidth(Math.min(PAGE_MAX_WIDTH, Math.max(320, el.clientWidth - 96)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const numPages = pdfDoc?.numPages ?? 0;
  const pageNumbers = useMemo(() => Array.from({ length: numPages }, (_, i) => i + 1), [numPages]);

  const download = () => {
    if (!bytes) return;
    const blob = new Blob([bytes.slice()], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scrollToPage = (n: number) => {
    pageRefs.current[n - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex h-screen flex-col bg-muted/40 text-foreground">
      {showDocUi && (
        <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background px-3">
          {showDocBrowser && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Back to documents"
              render={<Link to="/" />}
            >
              <ChevronLeft className="size-4" />
            </Button>
          )}
          <h1 className="min-w-0 truncate text-sm font-medium">{title}</h1>
          <div className="ml-auto flex items-center gap-2">
            {rendering && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Rendering
              </span>
            )}
            {!rendering && durationMs !== null && (
              <span className="text-xs tabular-nums text-muted-foreground">
                {numPages} {numPages === 1 ? 'page' : 'pages'} · {Math.round(durationMs)}ms
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={download}
              disabled={!bytes}
              aria-label="Download PDF"
              title="Download — identical bytes to this preview"
            >
              <Download className="size-4" />
              PDF
            </Button>
          </div>
        </header>
      )}

      {(error || parseError) && (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 font-mono text-xs text-destructive">
          {error ?? parseError}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {showDocUi && pdfDoc && numPages > 1 && (
          <aside className="w-[148px] shrink-0 overflow-y-auto border-r bg-background/60 p-4">
            <div className="flex flex-col gap-3">
              {pageNumbers.map((n) => (
                <button
                  key={`${version}-${n}`}
                  type="button"
                  onClick={() => scrollToPage(n)}
                  className="group flex flex-col items-center gap-1"
                >
                  <span className="overflow-hidden rounded-sm border shadow-sm transition-shadow group-hover:shadow-md">
                    <PdfPageCanvas doc={pdfDoc} pageNumber={n} width={THUMB_WIDTH} />
                  </span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">{n}</span>
                </button>
              ))}
            </div>
          </aside>
        )}

        <main
          ref={viewportRef}
          className={cn(
            'min-w-0 flex-1 overflow-y-auto',
            rendering && 'opacity-90 transition-opacity',
          )}
        >
          {!pdfDoc && !error && !parseError && (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Rendering document…
              </span>
            </div>
          )}
          {pdfDoc && (
            <div className="mx-auto flex flex-col items-center gap-6 px-8 py-8">
              {pageNumbers.map((n) => (
                <div
                  key={`${version}-${n}`}
                  ref={(el) => {
                    pageRefs.current[n - 1] = el;
                  }}
                  className="overflow-hidden rounded-sm bg-white shadow-md ring-1 ring-black/10"
                >
                  <PdfPageCanvas doc={pdfDoc} pageNumber={n} width={pageWidth} />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
