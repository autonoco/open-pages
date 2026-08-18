/// <reference lib="webworker" />
// Renders a doc module to PDF bytes off the main thread. The takumi-pdf Vite
// bundler entry top-level-awaits WASM init on first import.

// Dev-only shims, set before any doc-module import: Vite's react-refresh
// runtime (statically imported by every transformed .tsx module) reads
// `window` at eval, and component registration calls the $Refresh* globals
// unguarded. Neither exists in a worker; none of this survives `build`.
const IN_WORKER = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
if (import.meta.env.DEV && IN_WORKER) {
  const g = self as unknown as Record<string, unknown>;
  g.window = self;
  g.$RefreshReg$ = () => {};
  g.$RefreshSig$ = () => (type: unknown) => type;
}

import { fromJsx } from '@takumi-rs/helpers/jsx';
import { createElement } from 'react';
import { render } from 'takumi-pdf';
import { LOC_URL_PREFIX } from './loc-url';

export type RenderRequest = {
  type: 'render';
  seq: number;
  /** BASE_URL-prefixed module URL including the HMR cache-bust token. */
  moduleUrl: string;
  /**
   * Inject inspector geometry (loc-tagged nodes become anchors whose link
   * annotations carry exact per-element rects). Off for clean export bytes.
   */
  inspect: boolean;
};

export type RenderResponse =
  | {
      type: 'rendered';
      seq: number;
      bytes: Uint8Array;
      durationMs: number;
      /** data-pdf-loc -> original tag name, for the inspector panel. */
      tags: Record<string, string>;
    }
  | { type: 'render-error'; seq: number; message: string };

// Engine margins are numbers (CSS px) or 'auto' — CSS length strings throw.
const DEFAULT_PAGE = { size: 'a4', margin: 48 } as const;

type TakumiNode = {
  type?: string;
  children?: TakumiNode[];
  tagName?: string;
  attributes?: Record<string, string>;
};

/**
 * Turn every loc-tagged node into an anchor pointing at a sentinel URL that
 * encodes its source location. The engine emits one Link annotation with an
 * exact /Rect per rendered fragment (split across pages as needed) — the
 * inspector reads them back with pdf.js getAnnotations(). Presets/styles were
 * already resolved by fromJsx, so retagging does not affect layout.
 */
function injectLocAnchors(root: TakumiNode): Record<string, string> {
  const tags: Record<string, string> = {};
  const visit = (node: TakumiNode) => {
    const loc = node.attributes?.['data-pdf-loc'];
    if (loc && node.attributes) {
      tags[loc] ??= node.tagName ?? '';
      node.tagName = 'a';
      node.attributes.href = `${LOC_URL_PREFIX}${encodeURIComponent(loc)}`;
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(root);
  return tags;
}

async function handleRender(req: RenderRequest) {
  const start = performance.now();
  const mod = await import(/* @vite-ignore */ req.moduleUrl);
  if (typeof mod.default !== 'function') {
    throw new Error(`Doc module must default-export a component. Got: ${typeof mod.default}`);
  }
  const element = createElement(mod.default);
  const { node, stylesheets } = await fromJsx(element);
  const tags = req.inspect ? injectLocAnchors(node as TakumiNode) : {};
  const pageOptions = mod.pageOptions ?? {};
  const bytes: Uint8Array = await render(node, {
    stylesheets,
    ...DEFAULT_PAGE,
    ...pageOptions,
  });

  const durationMs = performance.now() - start;
  const msg: RenderResponse = { type: 'rendered', seq: req.seq, bytes, durationMs, tags };
  self.postMessage(msg, { transfer: [bytes.buffer] });
}

self.onmessage = (event: MessageEvent<RenderRequest>) => {
  const req = event.data;
  if (req?.type !== 'render') return;
  handleRender(req).catch((error) => {
    const msg: RenderResponse = {
      type: 'render-error',
      seq: req.seq,
      message: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(msg);
  });
};

self.postMessage({ type: 'boot' });
