import 'virtual:open-pages/pages.css';
import { loadPage } from 'virtual:open-pages/pages';
import { loadThemeCss, loadThemeDemo, themeCssIds } from 'virtual:open-pages/themes';
import { createElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import type { FrameMessage, WorkspaceMessage } from '../lib/frame';
import { pageChangeIncludes } from '../lib/pages';
import type { PageModule } from '../lib/sdk';
import { installInspector } from './inspect';

const params = new URLSearchParams(window.location.search);
const pageId = params.get('page');
const themeId = params.get('theme');

const embedded = window.parent !== window;
const post = (msg: FrameMessage) => {
  if (embedded) window.parent.postMessage(msg, '*');
};

// biome-ignore lint/style/noNonNullAssertion: #root is guaranteed by frame.html
const root = createRoot(document.getElementById('root')!);

function renderError(message: string) {
  root.render(
    createElement(
      'pre',
      {
        style: {
          margin: 0,
          padding: '16px 20px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 12,
          lineHeight: 1.5,
          color: '#b91c1c',
          background: '#fef2f2',
          whiteSpace: 'pre-wrap',
        },
      },
      message,
    ),
  );
  post({ type: 'op:error', message });
}

async function load(): Promise<PageModule> {
  if (themeId) return loadThemeDemo(themeId);
  if (pageId) return loadPage(pageId);
  throw new Error('frame.html needs ?page=<id> or ?theme=<id>');
}

let seq = 0;
async function mount() {
  const my = ++seq;
  try {
    const mod = await load();
    if (my !== seq) return;
    if (typeof mod.default !== 'function') {
      throw new Error(
        `${themeId ? `themes/${themeId}.demo.tsx` : `pages/${pageId}/index.tsx`} must default-export a component. Got: ${typeof mod.default}`,
      );
    }
    const theme = themeId ?? mod.meta?.theme;
    if (theme && themeCssIds.includes(theme)) await loadThemeCss(theme);
    const title = mod.meta?.title ?? pageId ?? themeId ?? '';
    document.title = title;
    root.render(createElement(StrictMode, null, createElement(mod.default)));
    post({ type: 'op:ready', title });
  } catch (e) {
    if (my !== seq) return;
    renderError(e instanceof Error ? (e.stack ?? e.message) : String(e));
  }
}

void mount();

if (import.meta.hot && pageId) {
  import.meta.hot.on('open-pages:page-changed', (data: unknown) => {
    if (!pageChangeIncludes(data, pageId)) return;
    // The virtual module refreshes its cache-bust token on this same event.
    queueMicrotask(() => void mount());
  });
}

if (embedded && import.meta.env.DEV) {
  const inspector = installInspector(post);
  window.addEventListener('message', (event: MessageEvent<WorkspaceMessage>) => {
    if (event.source !== window.parent) return;
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'op:inspect') inspector.setInspecting(msg.on);
    else if (msg.type === 'op:select') inspector.setSelected(msg.loc);
  });
}
