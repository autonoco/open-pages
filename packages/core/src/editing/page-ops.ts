import fs from 'node:fs/promises';
import path from 'node:path';
import { parse as babelParse } from '@babel/parser';

export const PAGE_ID_RE = /^[a-z0-9_-]+$/i;

type MetaTitleRead =
  | { kind: 'found'; title: string }
  | { kind: 'missing' }
  | { kind: 'unsupported' };

export function validatePageName(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  if (trimmed.length < 1 || trimmed.length > 80) return null;
  return trimmed;
}

function unwrapExpression(
  node: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  let current = node;
  while (
    current &&
    (current.type === 'TSAsExpression' || current.type === 'TSSatisfiesExpression')
  ) {
    current = current.expression as Record<string, unknown> | undefined;
  }
  return current;
}

function readMetaTitleInSource(source: string): MetaTitleRead {
  let ast: unknown;
  try {
    ast = babelParse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    });
  } catch {
    return { kind: 'unsupported' };
  }

  const body = (ast as { program?: { body?: Array<Record<string, unknown>> } }).program?.body ?? [];
  for (const stmt of body) {
    if (stmt.type !== 'ExportNamedDeclaration') continue;
    const decl = stmt.declaration as Record<string, unknown> | undefined;
    if (!decl || decl.type !== 'VariableDeclaration') continue;
    const declarations = (decl.declarations as Array<Record<string, unknown>> | undefined) ?? [];
    for (const d of declarations) {
      const id = d.id as Record<string, unknown> | undefined;
      if (!id || id.type !== 'Identifier' || id.name !== 'meta') continue;
      const init = unwrapExpression(d.init as Record<string, unknown> | undefined);
      if (!init || init.type !== 'ObjectExpression') return { kind: 'unsupported' };
      const properties = (init.properties as Array<Record<string, unknown>> | undefined) ?? [];
      for (const property of properties) {
        if (property.type !== 'ObjectProperty' || property.computed) continue;
        const key = property.key as Record<string, unknown> | undefined;
        const keyName =
          key?.type === 'Identifier'
            ? key.name
            : key?.type === 'StringLiteral'
              ? key.value
              : undefined;
        if (keyName !== 'title') continue;

        const value = property.value as Record<string, unknown> | undefined;
        if (value?.type === 'StringLiteral' && typeof value.value === 'string') {
          return { kind: 'found', title: value.value };
        }
        if (value?.type === 'TemplateLiteral') {
          const expressions = (value.expressions as unknown[] | undefined) ?? [];
          const quasis = (value.quasis as Array<Record<string, unknown>> | undefined) ?? [];
          const firstValue = quasis[0]?.value as Record<string, unknown> | undefined;
          const cooked = firstValue?.cooked;
          const raw = firstValue?.raw;
          if (expressions.length === 0 && typeof (cooked ?? raw) === 'string') {
            return { kind: 'found', title: (cooked ?? raw) as string };
          }
        }
        return { kind: 'unsupported' };
      }
      return { kind: 'missing' };
    }
  }

  return { kind: 'missing' };
}

export async function rmPageDir(pagesRoot: string, pageId: string): Promise<boolean> {
  if (!PAGE_ID_RE.test(pageId)) return false;
  const dir = path.resolve(pagesRoot, pageId);
  if (!dir.startsWith(pagesRoot + path.sep)) return false;
  try {
    await fs.rm(dir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

export async function duplicatePageDir(
  pagesRoot: string,
  pageId: string,
  desiredId?: string,
): Promise<{ ok: true; pageId: string } | { ok: false; status: number; error: string }> {
  if (!PAGE_ID_RE.test(pageId)) return { ok: false, status: 400, error: 'invalid pageId' };

  const root = path.resolve(pagesRoot);
  const srcDir = path.resolve(root, pageId);
  if (!srcDir.startsWith(root + path.sep)) {
    return { ok: false, status: 400, error: 'invalid pageId' };
  }

  try {
    await fs.access(path.join(srcDir, 'index.tsx'));
  } catch {
    return { ok: false, status: 404, error: 'page not found' };
  }

  let newId: string;
  if (desiredId !== undefined) {
    if (!PAGE_ID_RE.test(desiredId)) return { ok: false, status: 400, error: 'invalid newId' };
    newId = desiredId;
    const dstDir = path.resolve(root, newId);
    if (!dstDir.startsWith(root + path.sep)) {
      return { ok: false, status: 400, error: 'invalid newId' };
    }
    try {
      await fs.access(dstDir);
      return { ok: false, status: 409, error: 'page already exists' };
    } catch {}
  } else {
    let suffix = 1;
    while (true) {
      newId = suffix === 1 ? `${pageId}-copy` : `${pageId}-copy-${suffix}`;
      try {
        await fs.access(path.resolve(root, newId));
        suffix++;
      } catch {
        break;
      }
    }
  }

  const dstDir = path.resolve(root, newId);
  if (!dstDir.startsWith(root + path.sep)) {
    return { ok: false, status: 400, error: 'invalid newId' };
  }

  const srcEntry = path.join(srcDir, 'index.tsx');
  let copiedEntrySource: string;
  try {
    const source = await fs.readFile(srcEntry, 'utf8');
    const metaTitle = readMetaTitleInSource(source);
    if (metaTitle.kind === 'unsupported') {
      return { ok: false, status: 422, error: 'could not update copied page title' };
    }
    const title = metaTitle.kind === 'found' ? metaTitle.title : pageId;
    const updated = updateMetaTitleInSource(source, `${title} (copy)`);
    if (updated === null) {
      return { ok: false, status: 422, error: 'could not update copied page title' };
    }
    copiedEntrySource = updated;
  } catch {
    return { ok: false, status: 404, error: 'page not found' };
  }

  try {
    await fs.cp(srcDir, dstDir, { recursive: true, errorOnExist: true, force: false });
    await fs.writeFile(path.join(dstDir, 'index.tsx'), copiedEntrySource, 'utf8');
    return { ok: true, pageId: newId };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
      return { ok: false, status: 409, error: 'page already exists' };
    }
    return { ok: false, status: 500, error: String((err as Error).message ?? err) };
  }
}

export function resolvePageEntry(pagesRoot: string, pageId: string): string | null {
  if (!PAGE_ID_RE.test(pageId)) return null;
  const dir = path.resolve(pagesRoot, pageId);
  if (!dir.startsWith(pagesRoot + path.sep)) return null;
  // The PageMeta contract says every page has pages/<id>/index.tsx; we only
  // edit that file to keep the write surface tiny and predictable.
  return path.join(dir, 'index.tsx');
}

function escapeSingleQuoted(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Rewrite (or insert) the `title` field in the page module's `export const meta`.
 *
 * Strategy:
 *   1. Find `export const meta` and brace-match its object literal.
 *   2. If the object already has a `title: '...'` entry, replace the literal.
 *   3. If the object exists but has no title, inject a new `title: '...'` line
 *      as the first property (preserving the author's surrounding indentation).
 *   4. If there is no `meta` export at all, insert a fresh one right before
 *      `export default`.
 *
 * Returns the rewritten source, or `null` if the file shape was too surprising
 * to touch safely (e.g. `export default` missing when we'd need to inject meta).
 */
export function updateMetaTitleInSource(source: string, title: string): string | null {
  const newLiteral = `'${escapeSingleQuoted(title)}'`;

  const metaStart = source.search(/export\s+const\s+meta\b/);
  if (metaStart !== -1) {
    const eqIdx = source.indexOf('=', metaStart);
    if (eqIdx === -1) return null;
    const openBrace = source.indexOf('{', eqIdx);
    if (openBrace === -1) return null;

    let depth = 0;
    let closeBrace = -1;
    for (let i = openBrace; i < source.length; i++) {
      const ch = source[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          closeBrace = i;
          break;
        }
      }
    }
    if (closeBrace === -1) return null;

    const body = source.slice(openBrace + 1, closeBrace);
    const titleRe = /(^|[\s,{])(title\s*:\s*)(['"`])((?:\\.|(?!\3).)*)\3/;
    const match = body.match(titleRe);
    if (match) {
      const newBody = body.replace(titleRe, `${match[1]}${match[2]}${newLiteral}`);
      return source.slice(0, openBrace + 1) + newBody + source.slice(closeBrace);
    }

    // No title yet — inject as the first property, copying the indentation of
    // the first existing property (or a sensible default for an empty object).
    const firstIndentMatch = body.match(/\n([ \t]+)\S/);
    const indent = firstIndentMatch ? firstIndentMatch[1] : '  ';
    const trimmedBody = body.replace(/^\s*\n?/, '');
    const needsSeparator = trimmedBody.trim().length > 0;
    const insertion = `\n${indent}title: ${newLiteral}${needsSeparator ? ',' : ''}`;
    return source.slice(0, openBrace + 1) + insertion + body + source.slice(closeBrace);
  }

  const exportDefaultIdx = source.search(/export\s+default\b/);
  if (exportDefaultIdx === -1) return null;
  const insertion = `export const meta: PageMeta = { title: ${newLiteral} };\n\n`;
  return source.slice(0, exportDefaultIdx) + insertion + source.slice(exportDefaultIdx);
}
