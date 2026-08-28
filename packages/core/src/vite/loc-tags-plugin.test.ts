import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { injectLocTags, locTagsPlugin } from './loc-tags-plugin.ts';

const pluginTransformSource = 'export default [() => <div />];';

type LocTagsTransformResult = null | { code: string; map: null };

function transformWithLocTags(id: string) {
  // Force `path.resolve` to return a POSIX pagesRoot so this suite
  // exercises the same code path regardless of host OS.
  const resolveSpy = vi.spyOn(path, 'resolve').mockReturnValue('/repo/pages');
  try {
    const plugin = locTagsPlugin({ userCwd: '/repo' });
    const transform = plugin.transform;
    if (typeof transform !== 'function') throw new Error('expected transform function');
    return transform.call({} as never, pluginTransformSource, id) as LocTagsTransformResult;
  } finally {
    resolveSpy.mockRestore();
  }
}

function expectTaggedTransform(id: string) {
  const out = transformWithLocTags(id);
  if (out === null) throw new Error('expected tagged transform result');
  expect(out.code).toContain('data-op-loc');
}

describe('injectLocTags', () => {
  it('adds data-op-loc to host elements with the JSX start position', () => {
    const src = ['export default [() => (', '  <div>hello</div>', ')];', ''].join('\n');
    const out = injectLocTags(src);
    if (out === null) throw new Error('expected transform');
    expect(out).toContain('<div data-op-loc="2:2">hello</div>');
  });

  it('skips capitalized component invocations', () => {
    const src = ['export default [() => (', '  <MyComp>hi</MyComp>', ')];', ''].join('\n');
    const out = injectLocTags(src);
    expect(out).toBeNull();
  });

  it('tags every host element including nested ones', () => {
    const src = [
      'export default [() => (',
      '  <div>',
      '    <h1>Hi</h1>',
      '    <p>World</p>',
      '  </div>',
      ')];',
      '',
    ].join('\n');
    const out = injectLocTags(src);
    if (out === null) throw new Error('expected transform');
    expect(out).toContain('<div data-op-loc="2:2">');
    expect(out).toContain('<h1 data-op-loc="3:4">Hi</h1>');
    expect(out).toContain('<p data-op-loc="4:4">World</p>');
  });

  it('skips elements that already have data-op-loc', () => {
    const src = [
      'export default [() => (',
      '  <div data-op-loc="2:2">already</div>',
      ')];',
      '',
    ].join('\n');
    const out = injectLocTags(src);
    expect(out).toBeNull();
  });

  it('inserts after the tag name, before any other attributes', () => {
    const src = ['export default [() => (', '  <div className="foo">x</div>', ')];', ''].join('\n');
    const out = injectLocTags(src);
    if (out === null) throw new Error('expected transform');
    expect(out).toContain('<div data-op-loc="2:2" className="foo">x</div>');
  });

  it('handles self-closing host elements', () => {
    const src = ['export default [() => (', '  <img src="x" />', ')];', ''].join('\n');
    const out = injectLocTags(src);
    if (out === null) throw new Error('expected transform');
    expect(out).toContain('<img data-op-loc="2:2" src="x" />');
  });

  it('returns null when source has no host elements', () => {
    const src = 'const x = 1;';
    expect(injectLocTags(src)).toBeNull();
  });

  it('tags only host elements, leaving custom components untouched', () => {
    const src = [
      'export default [() => (',
      '  <Layout>',
      '    <h1>Title</h1>',
      '    <SubBox><span>nested</span></SubBox>',
      '  </Layout>',
      ')];',
      '',
    ].join('\n');
    const out = injectLocTags(src);
    if (out === null) throw new Error('expected transform');
    expect(out).toContain('<h1 data-op-loc="3:4">Title</h1>');
    expect(out).toContain('<span data-op-loc="4:12">nested</span>');
    expect(out).not.toContain('<Layout data-op-loc');
    expect(out).not.toContain('<SubBox data-op-loc');
  });

  it('tags <ImagePlaceholder> as a forwarding component', () => {
    const src = ['export default [() => (', '  <ImagePlaceholder hint="hero" />', ')];', ''].join(
      '\n',
    );
    const out = injectLocTags(src);
    if (out === null) throw new Error('expected transform');
    expect(out).toContain('<ImagePlaceholder data-op-loc="2:2" hint="hero" />');
  });

  it('does not tag other PascalCase components alongside ImagePlaceholder', () => {
    const src = [
      'export default [() => (',
      '  <Layout>',
      '    <ImagePlaceholder hint="hero" />',
      '    <CustomThing />',
      '  </Layout>',
      ')];',
      '',
    ].join('\n');
    const out = injectLocTags(src);
    if (out === null) throw new Error('expected transform');
    expect(out).toContain('<ImagePlaceholder data-op-loc="3:4"');
    expect(out).not.toContain('<Layout data-op-loc');
    expect(out).not.toContain('<CustomThing data-op-loc');
  });
});

describe('locTagsPlugin', () => {
  it('tags page index files', () => {
    expectTaggedTransform('/repo/pages/cover/index.tsx');
  });

  it('tags shared page source files', () => {
    expectTaggedTransform('/repo/pages/cover/shared.tsx');
  });

  it('tags numbered page source files', () => {
    expectTaggedTransform('/repo/pages/cover/01-Cover.tsx');
  });

  it('tags page source files in nested folders', () => {
    expectTaggedTransform('/repo/pages/cover/components/Card.tsx');
  });

  it('skips tsx files directly under the pages directory', () => {
    expect(transformWithLocTags('/repo/pages/index.tsx')).toBeNull();
  });

  it('skips tsx files outside the pages directory', () => {
    expect(transformWithLocTags('/repo/apps/demo/foo.tsx')).toBeNull();
  });

  it('skips colocated test files', () => {
    expect(transformWithLocTags('/repo/pages/cover/index.test.tsx')).toBeNull();
  });
});

describe('locTagsPlugin on Windows-style paths', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function transformWithMockedResolve(resolvedDocsRoot: string, id: string) {
    vi.spyOn(path, 'resolve').mockReturnValue(resolvedDocsRoot);
    const plugin = locTagsPlugin({ userCwd: 'C:\\repo' });
    const transform = plugin.transform;
    if (typeof transform !== 'function') throw new Error('expected transform function');
    return transform.call({} as never, pluginTransformSource, id) as LocTagsTransformResult;
  }

  function expectTagged(resolvedDocsRoot: string, id: string) {
    const out = transformWithMockedResolve(resolvedDocsRoot, id);
    if (out === null) throw new Error(`expected tagged transform result for ${id}`);
    expect(out.code).toContain('data-op-loc');
  }

  it('tags page index files with forward-slash ids under a Windows pagesRoot', () => {
    expectTagged('C:\\repo\\pages', 'C:/repo/pages/cover/index.tsx');
  });

  it('strips HMR ?t= query before matching', () => {
    expectTagged('C:\\repo\\pages', 'C:/repo/pages/cover/index.tsx?t=1700000000000');
  });

  it('tags nested page source files under a Windows pagesRoot', () => {
    expectTagged('C:\\repo\\pages', 'C:/repo/pages/cover/components/Card.tsx');
  });

  it('skips tsx files directly under the Windows pages directory', () => {
    expect(transformWithMockedResolve('C:\\repo\\pages', 'C:/repo/pages/index.tsx')).toBeNull();
  });

  it('skips tsx files outside the Windows pages directory', () => {
    expect(transformWithMockedResolve('C:\\repo\\pages', 'C:/repo/apps/demo/foo.tsx')).toBeNull();
  });

  it('skips colocated test files under a Windows pagesRoot', () => {
    expect(
      transformWithMockedResolve('C:\\repo\\pages', 'C:/repo/pages/cover/index.test.tsx'),
    ).toBeNull();
  });

  it('still tags POSIX ids when path.resolve returns a POSIX pagesRoot (regression guard)', () => {
    expectTagged('/repo/pages', '/repo/pages/cover/index.tsx');
  });
});
