---
name: create-email
description: Use this skill when the user wants to create, build, draft, or edit an email template in this open-pages repo — a welcome email, receipt, password reset, newsletter, notification, invite, or any HTML email. Triggers on phrases like "make an email for X", "email template", "transactional email", "newsletter", "onboarding email", or when the user asks to add or change content under `emails/`. Do NOT use for web pages (that is `create-page`) or for the framework itself.
---

# Create an email in open-pages

An email is one folder under `emails/<id>/` with an `index.tsx` that default-exports a [react-email](https://react.email) component. The workspace renders it on the server to a single HTML document with inlined styles plus a plain-text alternative, previews both live, and exports them with `open-pages export`. Nothing in an email runs in a browser: no hooks with effects, no state, no event handlers, no browser APIs.

This skill owns both the **workflow** and the **technical reference** for emails. The `page-authoring` skill does not apply here: emails are not web pages, and the shadcn `ui/` set cannot be used in them.

You only write files under `emails/<id>/`, plus whatever `npx shadcn@latest add @emailcn/...` installs under `components/email/`. Never modify `package.json`, `open-pages.config.ts`, `components.json`, or other emails.

## Step 1 — Clarify requirements (MUST ask before writing code)

Lock in the decisions below with `AskUserQuestion` before writing. Skip a question only when the user's message already answers it unambiguously, and restate your assumption when you skip.

1. **Email type** — offer the closest fits: transactional (welcome / onboarding, receipt, password reset, magic link, OTP, invite, notification) or marketing (newsletter, announcement, promotion). Mark the best fit "(Recommended)". Transactional emails are short, one action, no images required; marketing emails carry sections and imagery.

2. **Starting point** — offer: an emailcn block (Recommended when one matches: `block-onboarding-*`, `block-receipt-*`, `block-auth-*`, `block-invite-*`, `block-newsletter-*`, `block-notification-*`), emailcn components composed by you (headers, heroes, CTAs, footers, stats, pricing tables), or react-email primitives from scratch. The block route is fastest and already email-client-safe.

3. **Look** — list every `components/email/theme-<id>.ts` that pairs with a `themes/<id>.md` first (Recommended when one exists: the email will match the workspace's pages), then the emailcn themes that fit the brand: `theme-default` (neutral), `theme-linear`, `theme-vercel`, `theme-stripe`, `theme-notion`, `theme-slack`, `theme-github`, `theme-raycast`, `theme-apple`, `theme-airbnb`, `theme-dropbox`, `theme-nike`, `theme-twitch`, `theme-stack-overflow`. Step 3b covers applying a workspace theme.

4. **Content** — the subject line, the preheader (the preview text mail clients show next to the subject), the sender name or product name, the one thing the reader should do (CTA label + URL), and any real copy, prices, or names. Real emails live on real content; ask rather than invent.

Ask follow-ups only if still unclear: logo URL, brand color, footer address and unsubscribe URL (marketing emails legally need both).

## Step 2 — Pick an email id

Kebab-case, short, descriptive: `welcome`, `receipt`, `password-reset`, `weekly-digest`, `invite-teammate`. Check `emails/` to avoid collisions. Page ids and email ids are separate namespaces, so `welcome` can be both a page and an email.

## Step 3 — Install what the email needs

The workspace ships `react-email` (components, `Tailwind`, `render`) and a `components.json` with the `@emailcn` registry registered. Everything else is installed per item with the shadcn CLI:

```bash
# a full email as a block (installs its theme, fonts, sections)
npx shadcn@latest add @emailcn/react-email/block-onboarding-default

# individual sections and a theme
npx shadcn@latest add @emailcn/react-email/theme-linear @emailcn/react-email/split-hero @emailcn/react-email/navigation-footer

# see everything available
curl -s https://emailcn.run/r/registry.json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).items.filter(i=>i.name.startsWith("react-email/")).map(i=>i.name).join("\n")))'
```

Files land under `components/email/` (`email-theme.ts`, `theme-<id>.ts`, `email-assets.ts`, one file per section or block). They are the email equivalent of `ui/`: shared by every email, read but not edited per email. Wrap or extend a section inside `emails/<id>/components/` when one email needs a different look. Always use the `react-email/` variants of registry items; the `mjml-react/` and `jsx-email/` variants need packages this workspace does not install.

### Step 3b — Using a workspace theme

Every workspace theme authored by `create-theme` ships `components/email/theme-<id>.ts`, the same palette as an `EmailTheme` object (mail clients cannot read `themes/<id>.css`). To put an email on that theme:

```tsx
import { createEmailTailwindConfig } from '@/components/email/email-theme';
import { autonoTheme } from '@/components/email/theme-autono';

<Tailwind config={createEmailTailwindConfig(autonoTheme)}>…</Tailwind>
```

emailcn **sections** (`split-hero`, `call-to-action`, `navigation-footer`, `button`, …) take a `theme` prop and default to `defaultTheme`, so pass the workspace theme to each one you compose. emailcn **blocks** (`block-*`) pin `defaultTheme` (or their named theme) inside the file; to put a block on a workspace theme, copy it into `emails/<id>/components/` and swap the theme import there rather than editing the shared copy.

If `themes/<id>.css` exists but `components/email/theme-<id>.ts` does not, generate it the way `create-theme` does instead of converting colors by hand:

```bash
node .agents/skills/create-theme/references/email-theme-from-css.mjs themes/<id>.css <id> > components/email/theme-<id>.ts
```

(`components/email/email-theme.ts` must exist first: `npx shadcn@latest add @emailcn/react-email/theme-default` installs it.)

## Step 4 — Write `emails/<id>/index.tsx`

### File contract

```tsx
import type { EmailMeta } from '@autono/open-pages';
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Tailwind, Text } from 'react-email';
import { createEmailTailwindConfig } from '@/components/email/email-theme';
import { defaultTheme } from '@/components/email/theme-default';

export const meta: EmailMeta = {
  title: 'Welcome',
  subject: 'Welcome to Acme',
  description: 'Sent right after signup.',
  createdAt: '2026-09-27T20:00:00.000Z',
};

export default function Welcome() {
  return (
    <Html lang="en">
      <Head />
      <Preview>Your workspace is ready. Here is how to get started.</Preview>
      <Tailwind config={createEmailTailwindConfig(defaultTheme)}>
        <Body className="bg-bg font-sans">
          <Container className="mx-auto max-w-email p-8">
            <Heading className="m-0 font-24 text-fg">Welcome to Acme</Heading>
            <Text className="font-16 text-fg-2">Your workspace is ready.</Text>
            <Section className="my-6">
              <Button href="https://acme.example/app" className="rounded bg-brand px-5 py-3 font-14 font-medium text-brand-fg">
                Open Acme
              </Button>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
```

- **`meta`** — `title` is the workspace card name; `subject` is the subject line the email ships with; `description` is what it is for; `createdAt` is an ISO literal set once (the framework reads these with a regex, so keep them plain string literals).
- **The default export** takes no props. When composing an emailcn block that takes props (`_firstName`, `ctaHref`, …), pass sample values in the email; the sending system will substitute real ones later. Keep sample data plausible, not `Lorem ipsum`.
- **Structure** is always `Html > Head + Preview + Tailwind > Body > Container`. `Preview` is the preheader; keep it under 90 characters and make it continue the subject line, not repeat it.
- **Helper components** go under `emails/<id>/components/`. Split sections out when `index.tsx` passes ~120 lines.
- **Images** must be absolute `https://` URLs with `width`, `height`, and `alt`. Email clients do not load relative paths or local files. emailcn's `emailAsset()` helper points at hosted sample imagery; replace it with the user's hosted assets before shipping.

### What react-email gives you

`Html`, `Head`, `Preview`, `Body`, `Container` (centered column, set `max-w-container` or `max-w-[600px]`), `Section` (a table row band), `Row` + `Column` (side-by-side cells), `Heading`, `Text`, `Link`, `Button` (a padded anchor that survives Outlook), `Img`, `Hr`, `Font` (web font with fallback), `Markdown`, `CodeBlock` / `CodeInline`. Every one of them renders to nested tables and inline styles; you never write `<table>` yourself.

`Tailwind` compiles the utilities in `className` to inline styles at render time. Only utilities it can read literally are compiled (no runtime string building), and only properties email clients support survive: spacing, colors, typography, borders, widths, alignment. `flex`, `grid`, `gap`, `position`, `transform`, `transition`, `hover:` and `dark:` variants, and CSS variables are not email-safe; use `Row` / `Column` for layout and `Section` padding for spacing. A utility the compiler cannot resolve is left behind as a `class` attribute and does nothing in mail clients; the viewer shows an amber "N classes did not compile" chip (hover it for the list) and the dev server logs the same.

The emailcn theme config (`components/email/email-theme.ts`) adds semantic names on top of Tailwind: colors `bg`, `bg-2`, `bg-3`, `fg`, `fg-2`, `fg-3`, `brand`, `brand-fg`, `brand-hover`, `stroke`, `danger`, `success`, `warning` (so `bg-bg`, `text-fg-2`, `bg-brand text-brand-fg`, `border-stroke`), `max-w-email` for the 600px column, `rounded` / `rounded-lg` from the theme radii, `font-11` … `font-28` type steps, and a `mobile:` variant. Read that file for the current list before inventing names. Prefer these over raw hex so swapping the theme file restyles the email.

**Registry quirk, handled for you.** emailcn's react-email blocks and sections use `bg-background`, `text-foreground`, `text-foreground-muted`, `bg-primary`, `text-primary-fg`, `border-border`, and `max-w-container`, which the `email-theme.ts` the same registry installs does not define. open-pages patches that module at load time so those names resolve to the matching theme fields (`colorBackground`, `colorText`, `colorPrimary`, `containerWidth`, …) in dev, export, and build. Both vocabularies work in your own emails; do not edit `components/email/email-theme.ts` to add them by hand.

### Email constraints that differ from pages

- **One column, 600px.** Multi-column layouts stack on phones only when built with `Row` / `Column`; keep them to two columns and put the important one first.
- **Fonts**: a web font via `<Font>` with a system fallback, or a plain stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`). Gmail ignores web fonts; the fallback must look right on its own.
- **Type**: 16px body (14px minimum), 24–32px headings, line-height 1.5. Dark text on light backgrounds; many clients force-invert dark designs unpredictably.
- **Buttons** are `<Button href>` with padding classes, never `<button>`; there is no JavaScript.
- **Footer** of a marketing email: physical address and an unsubscribe link. Transactional emails: a one-line reason ("You are receiving this because you created an account.").
- **Plain text** is derived automatically from the HTML. Make sure the HTML reads top to bottom as prose: the CTA text plus its URL, no meaning carried only by images.
- **No `window`, `document`, `useState`, `useEffect`, `fetch`, event handlers** anywhere. The module is evaluated in Node.

## Step 5 — Preview and check

The dev server renders the email at `http://localhost:5173/e/<id>` with **HTML** and **Text** views, a **Mobile** (375px) toggle, **Copy HTML**, and **Open** (the raw document by itself). The frame re-renders on every save of the email or of anything it imports. An error banner in the frame means the module threw on the server; the dev server output has the stack.

Check both views. In Text, every link should read as `label URL`, and nothing important should be missing. If the header shows an amber "classes did not compile" chip, resolve every name it lists before handing off; a shipped email must have zero.

## Step 6 — Self-review

- [ ] `emails/<id>/index.tsx` default-exports one zero-prop component; `meta` has `title`, `subject`, and a fresh `createdAt` literal.
- [ ] `Preview` is set, under 90 characters, and does not repeat the subject.
- [ ] Only `react-email` components and files under `components/email/` are imported. Nothing from `@/ui`, `@/lib`, `@/hooks`, `lucide-react`, or any browser-only package.
- [ ] No hooks, state, effects, handlers, or browser globals.
- [ ] Every `className` is a literal Tailwind utility the email compiler supports; layout uses `Section` / `Row` / `Column`, not flex or grid. The viewer reports zero uncompiled classes.
- [ ] Every `Img` has an absolute `https://` `src`, `width`, `height`, and `alt`.
- [ ] Every CTA is a `<Button href>` or `<Link href>` with an absolute URL, and the primary CTA appears once.
- [ ] Body text is 14px or larger; the layout holds at 375px in the Mobile toggle.
- [ ] Marketing emails carry a physical address and an unsubscribe link; transactional emails carry a one-line reason for receipt.
- [ ] The Text view reads as complete prose with every link's URL present.
- [ ] Nothing under `components/email/` was edited for this one email; nothing outside `emails/<id>/` changed except emailcn installs.

## Step 7 — Hand off to the user

Tell the user:

- The email id, its file path, and the `subject` it carries.
- The preview URL — `http://localhost:5173/e/<id>` — with HTML / Text views, a Mobile toggle, Copy HTML, and Inspect (press `i`, click any element, leave a note, then ask you to run `apply-comments`).
- That `open-pages export <id>` writes `export/emails/<id>/index.html` and `index.txt`, ready to paste into Resend, SendGrid, Postmark, Mailchimp, Customer.io, or any sender that takes raw HTML; `Copy HTML` in the viewer gives the same document.
- That the email's look comes from `components/email/theme-*.ts`; swapping the theme import restyles it without touching its structure.
- If dev isn't running: run the project's `dev` script from the project root with its package manager (`npm run dev`, `pnpm dev`, … — match the lockfile).

Don't run the dev server yourself unless asked.
