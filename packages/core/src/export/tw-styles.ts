// Resolve the Tailwind subset our docs use into concrete values the DOCX
// serializer can emit. Environment-neutral: pure data + math.
import twColors from 'tailwindcss/colors';

export type ResolvedStyle = {
  /** Font size in CSS px. */
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  uppercase?: boolean;
  /** RRGGBB, no hash. */
  color?: string;
  /** RRGGBB, no hash. */
  background?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  /** Line height multiplier. */
  lineHeight?: number;
  /** Letter spacing in em. */
  tracking?: number;
  /** Space above the block in CSS px (from mt-*). */
  spaceBefore?: number;
  /** Bottom border, from `border-b` (+ border color). */
  borderBottom?: { color: string };
  /** Explicit width in CSS px (w-[Npx]). */
  width?: number;
  pageBreakBefore?: boolean;
  keepTogether?: boolean;
};

const NAMED_SIZES: Record<string, number> = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

const NAMED_LEADING: Record<string, number> = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
};

const NAMED_TRACKING: Record<string, number> = {
  tighter: -0.05,
  tight: -0.025,
  normal: 0,
  wide: 0.025,
  wider: 0.05,
  widest: 0.1,
};

// ── Tailwind v4 palette: OKLCH strings → sRGB hex ───────────────────────────

function oklchToHex(oklch: string): string | undefined {
  const m = /oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)/.exec(oklch);
  if (!m) return undefined;
  const L = Number(m[1]) / 100;
  const C = Number(m[2]);
  const H = (Number(m[3]) * Math.PI) / 180;
  const a = C * Math.cos(H);
  const b = C * Math.sin(H);
  const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lr = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  const lg = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  const lb = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_;
  const gamma = (v: number) => {
    const c = Math.max(0, Math.min(1, v));
    const g = c >= 0.0031308 ? 1.055 * c ** (1 / 2.4) - 0.055 : 12.92 * c;
    return Math.round(g * 255);
  };
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `${hex(gamma(lr))}${hex(gamma(lg))}${hex(gamma(lb))}`.toUpperCase();
}

const colorCache = new Map<string, string | undefined>();

/** `slate-500`, `white`, `black`, or `[#rrggbb]` → RRGGBB (no hash). */
function resolveColorToken(token: string): string | undefined {
  const cached = colorCache.get(token);
  if (cached !== undefined || colorCache.has(token)) return cached;
  let out: string | undefined;
  const arb = /^\[#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\]$/.exec(token);
  if (arb) {
    const raw = arb[1];
    out = (
      raw.length === 3
        ? raw
            .split('')
            .map((c) => c + c)
            .join('')
        : raw
    ).toUpperCase();
  } else if (token === 'white') {
    out = 'FFFFFF';
  } else if (token === 'black') {
    out = '000000';
  } else {
    const m = /^([a-z]+)-(\d{2,3})$/.exec(token);
    if (m) {
      const hue = (twColors as Record<string, unknown>)[m[1]];
      const value =
        hue && typeof hue === 'object' ? (hue as Record<string, string>)[m[2]] : undefined;
      if (typeof value === 'string') {
        out = value.startsWith('#') ? value.slice(1).toUpperCase() : oklchToHex(value);
      }
    }
  }
  colorCache.set(token, out);
  return out;
}

// ── Class list → resolved style ──────────────────────────────────────────────

/** Spacing scale: N → px (Tailwind's 4px grid; arbitrary [Npx] handled inline). */
const spacingPx = (v: string): number | undefined => {
  const arb = /^\[([\d.]+)px\]$/.exec(v);
  if (arb) return Number(arb[1]);
  const n = Number(v);
  return Number.isFinite(n) ? n * 4 : undefined;
};

export function resolveTw(tw: string | undefined, style?: Record<string, unknown>): ResolvedStyle {
  const out: ResolvedStyle = {};
  for (const cls of (tw ?? '').split(/\s+/)) {
    if (!cls) continue;

    const sizeArb = /^text-\[([\d.]+)px\]$/.exec(cls);
    if (sizeArb) {
      out.fontSize = Number(sizeArb[1]);
      continue;
    }
    const sizeNamed = /^text-(xs|sm|base|lg|xl|\dxl)$/.exec(cls);
    if (sizeNamed) {
      out.fontSize = NAMED_SIZES[sizeNamed[1]];
      continue;
    }
    if (
      cls === 'font-bold' ||
      cls === 'font-extrabold' ||
      cls === 'font-black' ||
      cls === 'font-semibold'
    ) {
      out.bold = true;
      continue;
    }
    if (cls === 'font-normal' || cls === 'font-medium') {
      out.bold = false;
      continue;
    }
    if (cls === 'italic') {
      out.italic = true;
      continue;
    }
    if (cls === 'underline') {
      out.underline = true;
      continue;
    }
    if (cls === 'uppercase') {
      out.uppercase = true;
      continue;
    }
    if (cls === 'text-left' || cls === 'text-center' || cls === 'text-right') {
      out.align = cls.slice(5) as ResolvedStyle['align'];
      continue;
    }
    if (cls === 'text-justify') {
      out.align = 'justify';
      continue;
    }
    const textColor = /^text-(.+)$/.exec(cls);
    if (textColor) {
      const color = resolveColorToken(textColor[1]);
      if (color) out.color = color;
      continue;
    }
    const bg = /^bg-(.+)$/.exec(cls);
    if (bg) {
      const color = resolveColorToken(bg[1]);
      if (color) out.background = color;
      continue;
    }
    const leadingArb = /^leading-\[([\d.]+)\]$/.exec(cls);
    if (leadingArb) {
      out.lineHeight = Number(leadingArb[1]);
      continue;
    }
    const leadingNamed = /^leading-(none|tight|snug|normal|relaxed|loose)$/.exec(cls);
    if (leadingNamed) {
      out.lineHeight = NAMED_LEADING[leadingNamed[1]];
      continue;
    }
    const tracking = /^tracking-(tighter|tight|normal|wide|wider|widest)$/.exec(cls);
    if (tracking) {
      out.tracking = NAMED_TRACKING[tracking[1]];
      continue;
    }
    const mt = /^mt-(.+)$/.exec(cls);
    if (mt) {
      const px = spacingPx(mt[1]);
      if (px !== undefined) out.spaceBefore = px;
      continue;
    }
    const width = /^w-\[([\d.]+)px\]$/.exec(cls);
    if (width) {
      out.width = Number(width[1]);
      continue;
    }
    if (cls === 'border-b') {
      out.borderBottom = { color: 'D1D5DB' };
      continue;
    }
    const borderColor = /^border-(.+)$/.exec(cls);
    if (borderColor && out.borderBottom) {
      const color = resolveColorToken(borderColor[1]);
      if (color) out.borderBottom = { color };
    }
  }
  if (style) {
    if (style.breakBefore === 'page') out.pageBreakBefore = true;
    if (style.breakInside === 'avoid') out.keepTogether = true;
  }
  return out;
}

/** Inline-inheritable subset for run context. */
export function inheritInline(parent: ResolvedStyle, child: ResolvedStyle): ResolvedStyle {
  return {
    ...parent,
    ...Object.fromEntries(Object.entries(child).filter(([, v]) => v !== undefined)),
    // Block-only concerns never inherit into children.
    spaceBefore: child.spaceBefore,
    borderBottom: child.borderBottom,
    pageBreakBefore: undefined,
    keepTogether: undefined,
    background: child.background ?? parent.background,
  };
}
