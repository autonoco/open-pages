/// <reference lib="webworker" />
// Renders a doc module to PDF bytes off the main thread. The takumi-pdf Vite
// bundler entry top-level-awaits WASM init on first import.

// Dev-only shims, set before any doc-module import: Vite's react-refresh
// runtime (statically imported by every transformed .tsx module) reads
// `window` at eval, and component registration calls the $Refresh* globals
// unguarded. Neither exists in a worker; none of this survives `build`.
if (import.meta.env.DEV) {
  const g = self as unknown as Record<string, unknown>;
  g.window = self;
  g.$RefreshReg$ = () => {};
  g.$RefreshSig$ = () => (type: unknown) => type;
}

import { createElement } from 'react';
import { render } from 'takumi-pdf';

export type RenderRequest = {
  type: 'render';
  seq: number;
  /** BASE_URL-prefixed module URL including the HMR cache-bust token. */
  moduleUrl: string;
};

export type RenderResponse =
  | { type: 'rendered'; seq: number; bytes: Uint8Array; durationMs: number }
  | { type: 'render-error'; seq: number; message: string };

const DEFAULT_PAGE = { size: 'a4', margin: '1cm' } as const;

async function handleRender(req: RenderRequest) {
  const start = performance.now();
  const mod = await import(/* @vite-ignore */ req.moduleUrl);
  if (typeof mod.default !== 'function') {
    throw new Error('Doc module must default-export a component. Got: ' + typeof mod.default);
  }
  const element = createElement(mod.default);
  const pageOptions = mod.pageOptions ?? {};
  const bytes: Uint8Array = await render(element, {
    ...DEFAULT_PAGE,
    ...pageOptions,
  });
  const durationMs = performance.now() - start;
  const msg: RenderResponse = { type: 'rendered', seq: req.seq, bytes, durationMs };
  self.postMessage(msg, { transfer: [bytes.buffer] });
}

self.onmessage = (event: MessageEvent<RenderRequest>) => {
  const req = event.data;
  if (req?.type !== 'render') return;
  console.log('[open-pdf worker] render request', req.seq, req.moduleUrl);
  handleRender(req).catch((error) => {
    console.error('[open-pdf worker] render failed:', error);
    const msg: RenderResponse = {
      type: 'render-error',
      seq: req.seq,
      message: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(msg);
  });
};

self.postMessage({ type: 'boot' });
