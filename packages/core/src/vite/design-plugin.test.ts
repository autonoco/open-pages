import { describe, expect, it } from 'vitest';
import { type DesignSystem, defaultDesign } from '../app/lib/design.ts';
import { applyDesignWrite, mergeDesign, parseDocDesign, serializeDesign } from './design-plugin.ts';

const DOC_WITH_DESIGN = `import type { DesignSystem, Page } from '@autono/open-pdf';

const design: DesignSystem = {
  palette: {
    bg: '#f7f5f0',
    text: '#1a1814',
    accent: '#6d4cff',
  },
  fonts: {
    display: 'Georgia, serif',
    body: 'system-ui, sans-serif',
  },
  typeScale: { hero: 168, body: 36 },
  radius: 12,
};

const Cover: Page = () => (
  <div style={{ background: design.palette.bg, color: design.palette.text }}>
    Hello
  </div>
);

export default [Cover];
`;

const DOC_WITHOUT_DESIGN = `import type { Page } from '@autono/open-pdf';

const Cover: Page = () => (
  <div style={{ background: '#fff', color: '#000' }}>Hi</div>
);

export default [Cover];
`;

describe('parseDocDesign', () => {
  it('extracts design from a doc that declares one', () => {
    const r = parseDocDesign(DOC_WITH_DESIGN);
    if (!r.ok) throw new Error('expected ok');
    expect(r.design.palette.accent).toBe('#6d4cff');
    expect(r.design.typeScale.hero).toBe(168);
    expect(r.design.radius).toBe(12);
  });

  it('reports exists:false for a doc with no design const', () => {
    const r = parseDocDesign(DOC_WITHOUT_DESIGN);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.exists).toBe(false);
  });

  it('fills missing fields with defaults', () => {
    const partial = `const design = { palette: { accent: '#ff0000' } };`;
    const r = parseDocDesign(partial);
    if (!r.ok) throw new Error('expected ok');
    expect(r.design.palette.accent).toBe('#ff0000');
    expect(r.design.palette.bg).toBe(defaultDesign.palette.bg);
    expect(r.design.typeScale.body).toBe(defaultDesign.typeScale.body);
  });

  it('handles `satisfies DesignSystem` form', () => {
    const src = `const design = ${serializeDesign(defaultDesign)} satisfies DesignSystem;`;
    const r = parseDocDesign(src);
    if (!r.ok) throw new Error('expected ok');
    expect(r.design.radius).toBe(defaultDesign.radius);
  });
});

describe('mergeDesign', () => {
  it('deep-merges scalar fields', () => {
    const merged = mergeDesign(defaultDesign, {
      palette: { accent: '#ff0000' } as DesignSystem['palette'],
    });
    expect(merged.palette.accent).toBe('#ff0000');
    expect(merged.palette.bg).toBe(defaultDesign.palette.bg);
  });

  it('does not mutate the base', () => {
    const before = JSON.stringify(defaultDesign);
    mergeDesign(defaultDesign, {
      palette: { accent: '#abc' } as DesignSystem['palette'],
    });
    expect(JSON.stringify(defaultDesign)).toBe(before);
  });
});

describe('applyDesignWrite — doc with existing design', () => {
  it('rewrites the design object body, preserving JSX and other code', () => {
    const next = mergeDesign(defaultDesign, {
      palette: { accent: '#ff0000' } as DesignSystem['palette'],
    });
    const r = applyDesignWrite(DOC_WITH_DESIGN, next);
    if (!r.ok) throw new Error(r.error);
    expect(r.created).toBe(false);
    expect(r.source).toContain("import type { DesignSystem, Page } from '@autono/open-pdf'");
    expect(r.source).toContain('const design: DesignSystem =');
    expect(r.source).toContain("accent: '#ff0000'");
    expect(r.source).not.toContain("'#6d4cff'");
    expect(r.source).toContain('<div style={{ background: design.palette.bg');
    expect(r.source).toContain('export default [Cover];');
  });

  it('round-trips: parse → write → parse yields equal value', () => {
    const r1 = parseDocDesign(DOC_WITH_DESIGN);
    if (!r1.ok) throw new Error('expected ok');
    const written = applyDesignWrite(DOC_WITH_DESIGN, r1.design);
    if (!written.ok) throw new Error(written.error);
    const r2 = parseDocDesign(written.source);
    if (!r2.ok) throw new Error('expected ok');
    expect(r2.design).toEqual(r1.design);
  });
});

describe('applyDesignWrite — doc without design', () => {
  it('inserts a new design const after imports and adds DesignSystem to existing core import', () => {
    const r = applyDesignWrite(DOC_WITHOUT_DESIGN, defaultDesign);
    if (!r.ok) throw new Error(r.error);
    expect(r.created).toBe(true);
    expect(r.source).toContain('const design: DesignSystem =');
    expect(r.source).toContain('type DesignSystem');
    expect(r.source).toContain('const Cover: Page = ()');
    expect(r.source).toContain('export default [Cover];');
    const parsed = parseDocDesign(r.source);
    if (!parsed.ok) throw new Error('inserted design is not parseable');
    expect(parsed.design).toEqual(defaultDesign);
  });

  it('adds a fresh @autono/open-pdf type import when none exists', () => {
    const doc = `const Cover = () => <div>Hi</div>;\nexport default [Cover];\n`;
    const r = applyDesignWrite(doc, defaultDesign);
    if (!r.ok) throw new Error(r.error);
    expect(r.source).toContain("import type { DesignSystem } from '@autono/open-pdf'");
    expect(r.source).toContain('const design: DesignSystem =');
    const parsed = parseDocDesign(r.source);
    if (!parsed.ok) throw new Error('inserted design is not parseable');
    expect(parsed.design).toEqual(defaultDesign);
  });
});
