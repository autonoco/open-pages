# Email theme mapping

`components/email/theme-<id>.ts` is the workspace theme expressed as an emailcn `EmailTheme`: hex colors, pixel sizes, plain font stacks. `email-theme-from-css.mjs` in this folder generates it from `themes/<id>.css`; this file records what it does so the output can be reviewed.

```bash
node .agents/skills/create-theme/references/email-theme-from-css.mjs themes/<id>.css <id> > components/email/theme-<id>.ts
```

Only the `:root` block is read. Emails are light-mode documents; mail clients that force dark mode recolor on their own and cannot be steered by a `.dark` block.

## Token → field

| CSS token (`:root`) | EmailTheme field | Notes |
| --- | --- | --- |
| `--background` | `colorBackground` | body and container fill |
| `--foreground` | `colorText` | body copy, and the secondary button's text |
| `--muted` | `colorBackgroundMuted` | bands, table stripes |
| `--secondary` | `colorBackgroundSubtle` | quieter fills |
| `--muted-foreground` | `colorTextMuted` | supporting copy |
| `--muted-foreground` lightened (+0.14 L) | `colorTextSubtle` | captions, legal lines |
| `--primary` | `colorPrimary`, `button.primary.backgroundColor` | the accent and the CTA fill |
| `--primary` darkened (−0.08 L) | `colorPrimaryHover` | link hover where clients honor it |
| `--primary-foreground` | `colorPrimaryForeground`, `button.primary.color` | text on the accent |
| `--border` | `colorBorder`, `button.secondary.border` | hairlines, outline buttons |
| `--input` (else `--muted`) | `colorBorderSubtle` | softer rules |
| `--destructive` | `colorDanger` | errors |
| `--radius` (rem × 16) | `borderRadius`, both buttons' `borderRadius`; ×2 → `borderRadiusLg` | |
| `--font-sans` | `fontFamily` | `var()` entries dropped; keep a web-safe family at the end |
| `--font-mono` | `fontFamilyMono` | same |

Fixed at emailcn's defaults because the CSS has no equivalent: `colorSuccess` `#10b981`, `colorWarning` `#f59e0b`, `containerWidth` `600px`, the `fontSize*`, `fontWeight*`, `lineHeightBase`, and `spacing*` fields, and the button padding.

## Review after generating

- Web fonts: Gmail ignores them. The stack must end in `Arial, sans-serif` or a similar system family; the script keeps whatever the CSS listed, so add one if the CSS relied on `system-ui` alone.
- Contrast: `colorTextMuted` on `colorBackground` and `colorPrimaryForeground` on `colorPrimary` are the pairs to check; they inherit the CSS values, so they pass when the CSS did.
- Serif headings: `EmailTheme` has one `fontFamily`. If the page theme uses a serif `--font-heading`, emails set it per heading with `<Font>` plus a `font-serif` class or an explicit `style`, and the theme's `.md` should say so under "Email".

## Using the theme in an email

```tsx
import { createEmailTailwindConfig } from '@/components/email/email-theme';
import { midnightSaasTheme } from '@/components/email/theme-midnight-saas';

<Tailwind config={createEmailTailwindConfig(midnightSaasTheme)}>…</Tailwind>
```

emailcn sections take a `theme` prop; blocks pin their theme inside the file and need a copy under `emails/<id>/components/` to swap it. The `create-email` skill covers both.
