import path from 'node:path';
import { parse as babelParse } from '@babel/parser';
import * as t from '@babel/types';
import type { Plugin } from 'vite';
import { walkJsx } from '../editing/babel-walk.ts';

// Inject `data-op-loc="<line>:<col>"` onto every host JSX element in
// page source files so the inspector can map a click straight to a
// source location, sidestepping HMR-stale `_debugSource` on fibers.

// Components get tagged too: shadcn-style components spread their props onto
// a host root, so the attribute lands in the DOM and a click on <Button>
// resolves to the page line that rendered it. Components that drop unknown
// props just lose the tag. React warns about props on Fragment, so skip it.
const UNTAGGABLE_COMPONENTS = new Set(['Fragment', 'StrictMode', 'Suspense']);

function isTaggableJsxName(name: t.JSXOpeningElement['name']): name is t.JSXIdentifier {
  if (!t.isJSXIdentifier(name)) return false;
  return !UNTAGGABLE_COMPONENTS.has(name.name);
}

function alreadyTagged(opening: t.JSXOpeningElement): boolean {
  return opening.attributes.some(
    (attr) =>
      t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === 'data-op-loc',
  );
}

export function injectLocTags(code: string): string | null {
  let ast: t.File;
  try {
    ast = babelParse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    });
  } catch {
    return null;
  }

  const insertions: { offset: number; text: string }[] = [];
  walkJsx(ast, (node) => {
    if (!t.isJSXElement(node) || !node.loc) return;
    const opening = node.openingElement;
    const name = opening.name;
    if (!isTaggableJsxName(name) || alreadyTagged(opening)) return;
    insertions.push({
      offset: name.end ?? 0,
      text: ` data-op-loc="${node.loc.start.line}:${node.loc.start.column}"`,
    });
  });

  if (insertions.length === 0) return null;
  insertions.sort((a, b) => b.offset - a.offset);
  let next = code;
  for (const ins of insertions) {
    next = next.slice(0, ins.offset) + ins.text + next.slice(ins.offset);
  }
  return next;
}

export type LocTagsPluginOptions = {
  userCwd: string;
  pagesDir?: string;
  apply?: 'serve' | 'build';
};

// Vite normally hands `id` to plugins with forward slashes, but other
// plugins or virtual modules can pass through Windows-style paths.
// Compare both sides in POSIX shape so the match doesn't depend on
// which separator the caller happened to use.
function isPageSourceFile(id: string, docsRootPosix: string): boolean {
  const filePath = id.split(/[?#]/)[0].replace(/\\/g, '/');
  if (!filePath.startsWith(`${docsRootPosix}/`)) return false;
  if (!filePath.endsWith('.tsx')) return false;
  if (filePath.endsWith('.d.ts') || filePath.endsWith('.test.tsx')) return false;
  const rel = filePath.slice(docsRootPosix.length + 1);
  return rel.includes('/');
}

export function locTagsPlugin(opts: LocTagsPluginOptions): Plugin {
  const pagesRoot = path.resolve(opts.userCwd, opts.pagesDir ?? 'pages').replace(/\\/g, '/');
  return {
    name: 'open-pages:loc-tags',
    apply: opts.apply ?? 'serve',
    // Must run before @vitejs/plugin-react so the JSX transform
    // sees our injected attributes.
    enforce: 'pre',
    transform(code, id) {
      if (!isPageSourceFile(id, pagesRoot)) return null;
      const next = injectLocTags(code);
      if (next === null) return null;
      return { code: next, map: null };
    },
  };
}
