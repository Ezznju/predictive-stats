/**
 * Shared SEO, text-sanitization, and color-contrast helpers.
 */

export const SITE_URL = 'https://predictionsmarketfans.com';
export const SITE_NAME = 'Predictions Market Fans';
export const DEFAULT_OG_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'Predictions Market Fans — Polymarket & Kalshi Analysis, Tools & Live Data',
};

/**
 * Strip HTML tags and normalize whitespace for metadata, alt attributes,
 * share URLs, and JSON-LD fields.
 */
export function stripHtml(input?: string | null): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Accurate word count from HTML content (strips tags first). */
export function countWords(html?: string | null): number {
  const plain = stripHtml(html);
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

/**
 * Return accessible dark (#0B1120) or light (#FFFFFF) foreground ink for a
 * given hex background color using WCAG 2.1 relative luminance.
 */
export function getContrastInk(hex?: string | null): '#0B1120' | '#FFFFFF' {
  if (!hex) return '#FFFFFF';
  const clean = hex.trim().replace(/^#/, '');
  let r = 0;
  let g = 0;
  let b = 0;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  } else {
    return '#FFFFFF';
  }
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return '#FFFFFF';

  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  // Contrast against #0B1120 (L ≈ 0.005) vs #FFFFFF (L = 1.0)
  // Threshold ~0.22 favors crisp black text on bright yellows, greens, cyans, oranges.
  return L > 0.22 ? '#0B1120' : '#FFFFFF';
}

/** Normalize a social handle or partial URL into a valid https:// URL for Schema.org sameAs. */
export function normalizeSocialUrl(
  value: string | undefined | null,
  platform: 'twitter' | 'linkedin'
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (platform === 'twitter') {
    const handle = trimmed.replace(/^@/, '').replace(/^(?:twitter|x)\.com\//i, '');
    return handle ? `https://x.com/${handle}` : null;
  }
  const slug = trimmed.replace(/^linkedin\.com\/in\//i, '').replace(/^\//, '');
  return slug ? `https://www.linkedin.com/in/${slug}` : null;
}
