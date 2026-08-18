// Helpers shared by the preview render worker (browser) and the export CLI
// (Node). Keep this module environment-neutral: no DOM, no node: imports.

export type TakumiNode = {
  type?: string;
  src?: string;
  children?: TakumiNode[];
  tagName?: string;
  attributes?: Record<string, string>;
};

// Keep preview and export rendering identical: same defaults on both paths.
// Engine margins are numbers (CSS px) or 'auto' — CSS length strings throw.
export const DEFAULT_PAGE = { size: 'a4', margin: 48 } as const;

/** Sentinel URL host carrying source locations through PDF link annotations. */
export const LOC_URL_PREFIX = 'https://loc.invalid/?p=';

/**
 * Turn every loc-tagged element into an anchor pointing at a sentinel URL that
 * encodes its source location. The engine emits one Link annotation with an
 * exact /Rect per rendered fragment (split across pages as needed) — the
 * inspector reads them back with pdf.js getAnnotations(). Presets/styles were
 * already resolved by fromJsx, so retagging does not affect layout. Image
 * nodes keep their tag: retagging them would fight their first-class type.
 */
export function injectLocAnchors(root: TakumiNode): Record<string, string> {
  const tags: Record<string, string> = {};
  const visit = (node: TakumiNode) => {
    const loc = node.attributes?.['data-pdf-loc'];
    if (loc && node.attributes && node.type !== 'image') {
      tags[loc] ??= node.tagName ?? '';
      node.tagName = 'a';
      node.attributes.href = `${LOC_URL_PREFIX}${encodeURIComponent(loc)}`;
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(root);
  return tags;
}

/**
 * Every non-inline image URL in the tree. The engine does not fetch `src`
 * URLs itself — the caller must supply bytes via the `images` render option.
 * `data:` URIs are decoded by the engine directly and are skipped here.
 */
export function collectImageSrcs(root: TakumiNode): string[] {
  const srcs = new Set<string>();
  const visit = (node: TakumiNode) => {
    if (node.type === 'image' && node.src && !node.src.startsWith('data:')) {
      srcs.add(node.src);
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(root);
  return [...srcs];
}
