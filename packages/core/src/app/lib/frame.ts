import type { PageKind } from './sdk';

/** Messages the page frame posts to the workspace window. */
export type FrameMessage =
  | { type: 'op:ready'; title: string }
  | { type: 'op:error'; message: string }
  | { type: 'op:select'; loc: string; tag: string; text: string }
  | { type: 'op:key'; key: string };

/** Messages the workspace posts into the page frame. */
export type WorkspaceMessage =
  | { type: 'op:inspect'; on: boolean }
  | { type: 'op:select'; loc: string | null };

export type FrameSource =
  | { pageId: string; kind?: PageKind }
  | { themeId: string }
  | { emailId: string };

const BASE = import.meta.env.BASE_URL;

/**
 * URL the workspace loads into an iframe for a page, a theme demo, or an
 * email. React pages mount through `frame.html`; `index.html` pages are served
 * verbatim (dev middleware, or the per-page build under `__page/` in a static
 * build); emails are rendered on the server under `__email/`.
 */
export function frameUrl(source: FrameSource): string {
  if ('themeId' in source) return `${BASE}frame.html?theme=${encodeURIComponent(source.themeId)}`;
  if ('emailId' in source) return emailUrl(source.emailId, 'html');
  if (source.kind === 'html')
    return `${BASE}__page/${encodeURIComponent(source.pageId)}/index.html`;
  return `${BASE}frame.html?page=${encodeURIComponent(source.pageId)}`;
}

/** The rendered email document, its plain-text alternative, or its render report. */
export function emailUrl(emailId: string, format: 'html' | 'text' | 'json'): string {
  const ext = format === 'text' ? 'txt' : format;
  return `${BASE}__email/${encodeURIComponent(emailId)}/index.${ext}`;
}

export function isFrameMessage(data: unknown): data is FrameMessage {
  return (
    !!data &&
    typeof data === 'object' &&
    typeof (data as { type?: unknown }).type === 'string' &&
    (data as { type: string }).type.startsWith('op:')
  );
}
