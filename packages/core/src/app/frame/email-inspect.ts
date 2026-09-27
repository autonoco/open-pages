// Attached to a rendered email when the workspace embeds it: the inspector
// alone, since the document is static HTML and needs no React mount.
import type { FrameMessage, WorkspaceMessage } from '../lib/frame';
import { installInspector } from './inspect';

if (window.parent !== window) {
  const post = (msg: FrameMessage) => window.parent.postMessage(msg, '*');
  const inspector = installInspector(post);
  window.addEventListener('message', (event: MessageEvent<WorkspaceMessage>) => {
    if (event.source !== window.parent) return;
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'op:inspect') inspector.setInspecting(msg.on);
    else if (msg.type === 'op:select') inspector.setSelected(msg.loc);
  });
  post({ type: 'op:ready', title: document.title });
}
