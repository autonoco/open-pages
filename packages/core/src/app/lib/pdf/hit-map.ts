import type { PDFDocumentProxy } from 'pdfjs-dist';
import { LOC_URL_PREFIX } from './loc-url';

export type LocBox = {
  loc: string;
  tag: string;
  /** CSS-style rect in PDF points, top-left origin. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Same rect in PDF user space (bottom-left origin), for text lookup. */
  pdfRect: [number, number, number, number];
  area: number;
};

export type PageHitMap = {
  /** Page size in PDF points. */
  width: number;
  height: number;
  /** Sorted largest-first so overlays render small boxes on top. */
  boxes: LocBox[];
};

/**
 * Build per-page clickable boxes from the sentinel link annotations the render
 * worker injected: each loc-tagged element carries its exact /Rect, fragmented
 * across pages by the engine. Page-break slivers (sub-2pt) are dropped.
 */
export async function buildHitMap(
  doc: PDFDocumentProxy,
  tags: Record<string, string>,
): Promise<PageHitMap[]> {
  const maps: PageHitMap[] = [];
  for (let i = 0; i < doc.numPages; i++) {
    const page = await doc.getPage(i + 1);
    const viewport = page.getViewport({ scale: 1 });
    const map: PageHitMap = { width: viewport.width, height: viewport.height, boxes: [] };

    const annotations = (await page.getAnnotations()) as {
      subtype?: string;
      url?: string;
      rect?: number[];
    }[];
    for (const ann of annotations) {
      if (!ann.url?.startsWith(LOC_URL_PREFIX) || !ann.rect) continue;
      const loc = decodeURIComponent(ann.url.slice(LOC_URL_PREFIX.length));
      const [rx0, ry0, rx1, ry1] = ann.rect;
      const x0 = Math.min(rx0, rx1);
      const x1 = Math.max(rx0, rx1);
      const y0 = Math.min(ry0, ry1);
      const y1 = Math.max(ry0, ry1);
      const w = x1 - x0;
      const h = y1 - y0;
      if (w < 2 || h < 2) continue;
      map.boxes.push({
        loc,
        tag: tags[loc] ?? '',
        x: x0,
        y: viewport.height - y1,
        w,
        h,
        pdfRect: [x0, y0, x1, y1],
        area: w * h,
      });
    }
    map.boxes.sort((a, b) => b.area - a.area);
    maps.push(map);
  }
  return maps;
}

/** Text inside a box, for the agent cursor ("make this bigger" context). */
export async function extractBoxText(
  doc: PDFDocumentProxy,
  pageIndex: number,
  pdfRect: [number, number, number, number],
): Promise<string> {
  const [x0, y0, x1, y1] = pdfRect;
  const page = await doc.getPage(pageIndex + 1);
  const tc = await page.getTextContent();
  const parts: string[] = [];
  for (const item of tc.items) {
    const anyItem = item as { str?: string; transform?: number[] };
    if (!anyItem.str?.trim() || !anyItem.transform) continue;
    const x = anyItem.transform[4];
    const y = anyItem.transform[5];
    if (x >= x0 - 1 && x <= x1 + 1 && y >= y0 - 1 && y <= y1 + 1) parts.push(anyItem.str);
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, 120);
}
