// Click-to-source inside the page frame. Every host element in page source
// carries `data-op-loc="<line>:<col>"` (loc-tags plugin, dev only); hovering
// outlines the innermost tagged element and a click reports it to the
// workspace window instead of reaching the page.

import type { FrameMessage } from '../lib/frame';

const LOC_ATTR = 'data-op-loc';
const TEXT_MAX = 120;

type Post = (msg: FrameMessage) => void;

function box(color: string, fill: string): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = [
    'position:fixed',
    'pointer-events:none',
    'z-index:2147483647',
    'border-radius:2px',
    `border:1.5px solid ${color}`,
    `background:${fill}`,
    'display:none',
    'box-sizing:border-box',
  ].join(';');
  return el;
}

export function installInspector(post: Post) {
  const hover = box('rgba(59,130,246,0.85)', 'rgba(59,130,246,0.08)');
  const selected = box('rgb(37,99,235)', 'rgba(37,99,235,0.14)');
  document.documentElement.append(hover, selected);

  let on = false;
  let hoverEl: Element | null = null;
  let selectedLoc: string | null = null;
  let raf = 0;

  const place = (el: Element | null, target: HTMLDivElement) => {
    if (!el || !el.isConnected) {
      target.style.display = 'none';
      return;
    }
    const r = el.getBoundingClientRect();
    target.style.display = 'block';
    target.style.left = `${r.left - 2}px`;
    target.style.top = `${r.top - 2}px`;
    target.style.width = `${r.width + 4}px`;
    target.style.height = `${r.height + 4}px`;
  };

  const findSelected = (): Element | null =>
    selectedLoc ? document.querySelector(`[${LOC_ATTR}="${CSS.escape(selectedLoc)}"]`) : null;

  const sync = () => {
    raf = 0;
    place(on ? hoverEl : null, hover);
    place(findSelected(), selected);
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(sync);
  };

  const targetOf = (e: Event): Element | null => {
    const t = e.target;
    if (!(t instanceof Element)) return null;
    return t.closest(`[${LOC_ATTR}]`);
  };

  const onMove = (e: MouseEvent) => {
    if (!on) return;
    const next = targetOf(e);
    if (next !== hoverEl) {
      hoverEl = next;
      schedule();
    }
  };
  const onLeave = () => {
    hoverEl = null;
    schedule();
  };
  const onClick = (e: MouseEvent) => {
    if (!on) return;
    e.preventDefault();
    e.stopPropagation();
    const el = targetOf(e);
    if (!el) return;
    const loc = el.getAttribute(LOC_ATTR) ?? '';
    selectedLoc = loc;
    schedule();
    post({
      type: 'op:select',
      loc,
      tag: el.tagName.toLowerCase(),
      text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, TEXT_MAX),
    });
  };
  const swallow = (e: Event) => {
    if (on) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  const onKey = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      (e.target as HTMLElement | null)?.isContentEditable
    )
      return;
    if (e.key === 'i' || e.key === 'Escape') post({ type: 'op:key', key: e.key });
  };

  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('mouseleave', onLeave, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('mousedown', swallow, true);
  document.addEventListener('pointerdown', swallow, true);
  document.addEventListener('keydown', onKey, true);
  window.addEventListener('scroll', schedule, true);
  window.addEventListener('resize', schedule);
  new MutationObserver(schedule).observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
  });

  return {
    setInspecting(next: boolean) {
      on = next;
      document.documentElement.style.cursor = on ? 'crosshair' : '';
      if (!on) hoverEl = null;
      schedule();
    },
    setSelected(loc: string | null) {
      selectedLoc = loc;
      schedule();
    },
  };
}
