import { useEffect, useRef, useState } from 'react';
import { PdfPageCanvas, usePdfDocument } from './pdf-viewer';
import { useDocPdf } from './use-doc-pdf';

/**
 * First-page PDF preview for browser cards: width-fit, top-cropped by the
 * parent's fixed-aspect container, Google-Docs-card style.
 */
export function DocPdfThumb({ docId }: { docId: string }) {
  const { bytes, version } = useDocPdf(docId);
  const { doc } = usePdfDocument(bytes, version);
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-full w-full bg-white">
      {doc && width > 0 && <PdfPageCanvas doc={doc} pageNumber={1} width={width} />}
    </div>
  );
}
