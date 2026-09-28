#!/usr/bin/env node
// Derives an emailcn EmailTheme module from a workspace theme's CSS.
//
//   node <this file> themes/<id>.css <id> > components/email/theme-<id>.ts
//
// Reads the :root block (emails are light-mode documents), converts each
// OKLCH token to hex, and maps the shadcn roles onto EmailTheme fields.
// Fields the CSS cannot decide (success, warning, type scale, spacing) take
// emailcn's defaults so the file stays a drop-in for createEmailTailwindConfig.

import { readFileSync } from 'node:fs';

const [, , cssPath, rawId] = process.argv;
if (!cssPath || !rawId) {
  process.stderr.write('usage: email-theme-from-css.mjs themes/<id>.css <id>\n');
  process.exit(1);
}

const css = readFileSync(cssPath, 'utf8');
const rootBlock = css.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? '';
const tokens = {};
for (const m of rootBlock.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) tokens[m[1]] = m[2].trim();

const missing = ['background', 'foreground', 'primary', 'primary-foreground', 'border'].filter(
  (t) => !tokens[t],
);
if (missing.length) {
  process.stderr.write(`${cssPath} :root is missing ${missing.map((t) => `--${t}`).join(', ')}\n`);
  process.exit(1);
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}
function linToSrgb(c) {
  const v = clamp01(c);
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
}
function oklchToRgb(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(linToSrgb);
}
function toHex([r, g, b]) {
  return `#${[r, g, b]
    .map((v) =>
      Math.round(v * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}
function parseOklch(value) {
  const m = value.match(/oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/);
  if (!m) return null;
  let L = Number(m[1]);
  if (value.includes('%')) L /= 100;
  return { L, C: Number(m[2]), H: Number(m[3]) };
}
function hex(value) {
  if (!value) return null;
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
  const m = value.match(/rgb\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
  if (m) return toHex([m[1], m[2], m[3]].map((n) => Number(n) / 255));
  const o = parseOklch(value);
  if (!o) return null;
  return toHex(oklchToRgb(o.L, o.C, o.H));
}
function shifted(value, dL) {
  const o = parseOklch(value);
  if (!o) return hex(value);
  return toHex(oklchToRgb(clamp01(o.L + dL), o.C, o.H));
}
function px(value, fallback) {
  if (!value) return fallback;
  const m = value.match(/([\d.]+)\s*(rem|px)/);
  if (!m) return fallback;
  const n = Number(m[1]);
  return `${Math.round(m[2] === 'rem' ? n * 16 : n)}px`;
}
function fontStack(value, fallback) {
  if (!value) return fallback;
  return value
    .split(',')
    .map((f) => f.trim())
    .filter((f) => !f.startsWith('var('))
    .map((f) => f.replace(/^'(.*)'$/, '"$1"'))
    .join(', ');
}

const color = (name, fallback) => hex(tokens[name]) ?? fallback;
const background = color('background', '#ffffff');
const foreground = color('foreground', '#111827');
const primary = color('primary', '#111827');
const primaryForeground = color('primary-foreground', '#ffffff');
const border = color('border', '#e5e7eb');
const muted = color('muted', '#f9fafb');
const mutedForeground = color('muted-foreground', '#6b7280');
const secondary = color('secondary', '#f3f4f6');
const radius = px(tokens.radius, '6px');
const radiusPx = Number.parseInt(radius, 10);

const theme = {
  borderRadius: radius,
  borderRadiusLg: `${radiusPx * 2}px`,
  button: {
    primary: {
      backgroundColor: primary,
      borderRadius: radius,
      color: primaryForeground,
      fontSize: '14px',
      fontWeight: '500',
      paddingX: '24px',
      paddingY: '12px',
    },
    secondary: {
      backgroundColor: 'transparent',
      border: `1px solid ${border}`,
      borderRadius: radius,
      color: foreground,
      fontSize: '14px',
      fontWeight: '500',
      paddingX: '24px',
      paddingY: '12px',
    },
  },
  colorBackground: background,
  colorBackgroundMuted: muted,
  colorBackgroundSubtle: secondary,
  colorBorder: border,
  colorBorderSubtle: tokens.input ? color('input', border) : muted,
  colorDanger: color('destructive', '#ef4444'),
  colorPrimary: primary,
  colorPrimaryForeground: primaryForeground,
  colorPrimaryHover: tokens.primary ? shifted(tokens.primary, -0.08) : '#374151',
  colorSuccess: '#10b981',
  colorText: foreground,
  colorTextMuted: mutedForeground,
  colorTextSubtle: tokens['muted-foreground']
    ? shifted(tokens['muted-foreground'], 0.14)
    : '#9ca3af',
  colorWarning: '#f59e0b',
  containerWidth: '600px',
  fontFamily: fontStack(
    tokens['font-sans'],
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ),
  fontFamilyMono: fontStack(tokens['font-mono'], '"Menlo", "Monaco", "Courier New", monospace'),
  fontSizeBase: '14px',
  fontSizeHeading: '28px',
  fontSizeLg: '16px',
  fontSizeSm: '12px',
  fontSizeXl: '20px',
  fontWeightBold: '600',
  fontWeightMedium: '500',
  fontWeightNormal: '400',
  lineHeightBase: '1.6',
  spacingBase: '24px',
  spacingLg: '32px',
  spacingXl: '48px',
};

const id = rawId.replace(/\.css$/, '');
const exportName = `${id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())}Theme`;
// Unquoted keys, single-quoted strings unless the string itself holds one.
const body = JSON.stringify(theme, null, 2)
  .replace(/"([a-zA-Z]+)":/g, '$1:')
  .replace(/"((?:[^"\\]|\\.)*)"/g, (_, str) =>
    str.includes("'") ? `"${str}"` : `'${str.replace(/\\"/g, '"')}'`,
  );

process.stdout.write(
  `import type { EmailTheme } from '@/components/email/email-theme';\n\n// Derived from themes/${id}.css by the create-theme skill. Re-run the script\n// after changing the CSS rather than editing colors here by hand.\nexport const ${exportName}: EmailTheme = ${body};\n`,
);
