import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  aliasEmailThemeModule,
  emailsSignature,
  extractEmailMeta,
  findEmails,
  generateEmailsModule,
  isEmailThemeModule,
  stripLocTags,
  unresolvedClasses,
} from './emails-plugin.ts';

async function withEmailsRoot<T>(fn: (root: string) => Promise<T>): Promise<T> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'open-pages-emails-'));
  try {
    return await fn(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function writeEmail(root: string, id: string, meta: string): Promise<void> {
  await fs.mkdir(path.join(root, id), { recursive: true });
  await fs.writeFile(
    path.join(root, id, 'index.tsx'),
    `export const meta = { ${meta} };\nexport default function Email() { return null; }\n`,
    'utf8',
  );
}

describe('findEmails', () => {
  it('lists every folder with an index.tsx or index.jsx entry, sorted by id', async () => {
    await withEmailsRoot(async (root) => {
      await writeEmail(root, 'welcome', "title: 'Welcome'");
      await fs.mkdir(path.join(root, 'digest'));
      await fs.writeFile(path.join(root, 'digest', 'index.jsx'), 'export default () => null;\n');
      await fs.mkdir(path.join(root, 'notes'));
      await fs.writeFile(path.join(root, 'notes', 'README.md'), '# not an email\n');
      await fs.mkdir(path.join(root, 'bad id!'));
      await fs.writeFile(path.join(root, 'bad id!', 'index.tsx'), 'export default () => null;\n');

      const entries = await findEmails(root, '.');
      expect(entries.map((e) => e.id)).toEqual(['digest', 'welcome']);
      expect(entries[1].file).toBe(path.join(root, 'welcome', 'index.tsx'));
    });
  });

  it('returns nothing for a missing directory', async () => {
    expect(await findEmails('/nonexistent/open-pages', 'emails')).toEqual([]);
  });
});

describe('extractEmailMeta', () => {
  it('reads title, subject, description, and createdAt literals', () => {
    const src = `import type { EmailMeta } from '@autono/open-pages';
export const meta: EmailMeta = {
  title: 'Welcome',
  subject: "Welcome to Acme",
  description: 'Sent after signup.',
  createdAt: '2026-09-27T20:00:00.000Z',
};
export default function Welcome() { return null; }
`;
    expect(extractEmailMeta(src)).toEqual({
      title: 'Welcome',
      subject: 'Welcome to Acme',
      description: 'Sent after signup.',
      createdAt: '2026-09-27T20:00:00.000Z',
    });
  });

  it('is null for every field without a meta export', () => {
    expect(extractEmailMeta('export default function E() { return null; }')).toEqual({
      title: null,
      subject: null,
      description: null,
      createdAt: null,
    });
  });
});

describe('generateEmailsModule', () => {
  it('exports ids, meta with the id as fallback title, and createdAt millis', async () => {
    await withEmailsRoot(async (root) => {
      await writeEmail(
        root,
        'welcome',
        "title: 'Welcome', subject: 'Hi', createdAt: '2026-01-02T00:00:00.000Z'",
      );
      await writeEmail(root, 'receipt', "description: 'Order receipt'");
      const entries = await findEmails(root, '.');
      const code = await generateEmailsModule(entries);
      expect(code).toContain('export const emailIds = ["receipt","welcome"]');
      expect(code).toContain(
        '"receipt":{"title":"receipt","subject":null,"description":"Order receipt"}',
      );
      expect(code).toContain('"welcome":{"title":"Welcome","subject":"Hi","description":null}');
      expect(code).toContain(`"welcome":${Date.parse('2026-01-02T00:00:00.000Z')}`);
      expect(code).not.toContain('"receipt":1');
    });
  });
});

describe('emailsSignature', () => {
  it('changes when an entry file changes', () => {
    const a = emailsSignature([{ id: 'x', file: '/w/emails/x/index.tsx' }]);
    const b = emailsSignature([{ id: 'x', file: '/w/emails/x/index.jsx' }]);
    expect(a).not.toBe(b);
  });
});

describe('stripLocTags', () => {
  it('removes every inspector location attribute', () => {
    const html = '<table data-op-loc="12:4"><tr data-op-loc="13:6"><td>hi</td></tr></table>';
    expect(stripLocTags(html)).toBe('<table><tr><td>hi</td></tr></table>');
  });
});

describe('unresolvedClasses', () => {
  it('lists bare class names left behind, ignoring variant-backed ones', () => {
    const html =
      '<td class="bg-background text-foreground mobile:px-4" style="padding:8px"></td>' +
      '<p class="text-foreground"></p><span class="">x</span>';
    expect(unresolvedClasses(html)).toEqual(['bg-background', 'text-foreground']);
  });

  it('is empty when every utility was inlined', () => {
    expect(unresolvedClasses('<td style="padding:8px">x</td>')).toEqual([]);
  });
});

describe('email theme aliases', () => {
  const emailcnModule = `
export const createEmailTailwindConfig = (theme) => ({
  presets: [],
  theme: {
    extend: {
      colors: { bg: theme.colorBackground, fg: theme.colorText, brand: theme.colorPrimary },
      maxWidth: { email: theme.containerWidth },
    },
  },
});
`;
  const theme = {
    colorBackground: '#ffffff',
    colorBackgroundMuted: '#f9fafb',
    colorText: '#111827',
    colorTextMuted: '#6b7280',
    colorPrimary: '#111827',
    colorPrimaryForeground: '#ffffff',
    colorBorder: '#e5e7eb',
    containerWidth: '600px',
  };

  async function load(code: string) {
    const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
    return (await import(url)) as {
      createEmailTailwindConfig: (t: typeof theme) => {
        theme: { extend: { colors: Record<string, string>; maxWidth: Record<string, string> } };
      };
    };
  }

  it('matches only the workspace email-theme module', () => {
    expect(isEmailThemeModule('/w/components/email/email-theme.ts', '/w')).toBe(true);
    expect(isEmailThemeModule('/w/components/email/email-theme.ts?v=1', '/w')).toBe(true);
    expect(isEmailThemeModule('/w/components/email/theme-default.ts', '/w')).toBe(false);
    expect(isEmailThemeModule('/elsewhere/components/email/email-theme.ts', '/w')).toBe(false);
  });

  it('adds the block class names the registry theme leaves out', async () => {
    const patched = aliasEmailThemeModule(emailcnModule);
    expect(patched).not.toBeNull();
    const mod = await load(patched as string);
    const { colors, maxWidth } = mod.createEmailTailwindConfig(theme).theme.extend;
    expect(colors).toMatchObject({
      bg: '#ffffff',
      background: '#ffffff',
      'background-muted': '#f9fafb',
      foreground: '#111827',
      'foreground-muted': '#6b7280',
      primary: '#111827',
      'primary-fg': '#ffffff',
      border: '#e5e7eb',
    });
    expect(maxWidth).toEqual({ email: '600px', container: '600px' });
  });

  it('keeps names the theme already defines', async () => {
    const own = emailcnModule.replace(
      'brand: theme.colorPrimary }',
      "brand: theme.colorPrimary, background: '#123456' }",
    );
    const mod = await load(aliasEmailThemeModule(own) as string);
    expect(mod.createEmailTailwindConfig(theme).theme.extend.colors.background).toBe('#123456');
  });

  it('leaves modules without the factory alone', () => {
    expect(aliasEmailThemeModule('export const x = 1;')).toBeNull();
  });
});
