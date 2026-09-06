/**
 * Auto-linker for article HTML content.
 *
 * Scans rendered article HTML and injects internal links for key terms,
 * tools, and platform names — but only when the term isn't already inside
 * an <a>, <h1-h6>, or <code> tag. Each term is linked at most once per
 * article to keep things clean.
 */

interface LinkRule {
  /** Regex-safe terms (case-insensitive). First match wins per article. */
  terms: string[];
  href: string;
  /** Optional title attribute for the link */
  title?: string;
}

const LINK_RULES: LinkRule[] = [
  // Tools
  {
    terms: ['LP scanner', 'LP reward scanner', 'liquidity reward scanner'],
    href: '/tools/lp-scanner',
    title: 'Free LP Reward Scanner tool',
  },
  {
    terms: ['arbitrage scanner', 'arb scanner', 'arbitrage tool'],
    href: '/tools/arbitrage-scanner',
    title: 'Free Arbitrage Scanner tool',
  },
  // Platforms (only link to our review, not external)
  {
    terms: ['Polymarket'],
    href: '/platforms/polymarket',
    title: 'Polymarket review',
  },
  {
    terms: ['Kalshi'],
    href: '/platforms/kalshi',
    title: 'Kalshi review',
  },
  {
    terms: ['Metaculus'],
    href: '/platforms/metaculus',
    title: 'Metaculus review',
  },
  {
    terms: ['PredictIt'],
    href: '/platforms/predictit',
    title: 'PredictIt review',
  },
  // Key pages
  {
    terms: ['prediction market platforms', 'prediction market sites', 'best prediction markets'],
    href: '/platforms',
    title: 'Compare prediction market platforms',
  },
  {
    terms: ['LP rewards', 'liquidity provider rewards', 'liquidity rewards'],
    href: '/tools/lp-scanner',
    title: 'Scan current LP rewards',
  },
  {
    terms: ['cross-platform arbitrage', 'prediction market arbitrage'],
    href: '/tools/arbitrage-scanner',
    title: 'Find arbitrage opportunities',
  },
  // Before the platform rules so "Polymarket trending markets" links here,
  // not to the Polymarket review.
  {
    terms: ['trending markets', 'most active Polymarket markets', 'active Polymarket markets', 'hot Polymarket markets'],
    href: '/polymarket-trending-markets',
    title: 'Live Polymarket trending markets board',
  },
  {
    terms: ['most active Kalshi markets', 'active Kalshi markets', 'hot Kalshi markets', 'Kalshi trending markets'],
    href: '/kalshi-trending-markets',
    title: 'Live Kalshi trending markets board',
  },
];

/**
 * Inject internal links into article HTML.
 *
 * Rules:
 * - Each rule fires at most once (first occurrence only)
 * - Never links inside existing <a>, heading, or <code> tags
 * - Skips if the term already links to the same href elsewhere
 */
export function autoLink(html: string): string {
  let result = html;
  const alreadyLinked = new Set<string>();

  // Extract existing hrefs so we don't double-link
  const existingHrefs = new Set(
    Array.from(html.matchAll(/href=["']([^"']+)["']/g)).map((m) => m[1])
  );

  for (const rule of LINK_RULES) {
    if (existingHrefs.has(rule.href)) {
      // Article already links to this destination — skip
      continue;
    }
    if (alreadyLinked.has(rule.href)) continue;

    for (const term of rule.terms) {
      // Build a regex that matches the term only when NOT inside a tag attribute
      // or inside <a>...</a>, <h1-6>...</h6>, <code>...</code>
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(
        `(?<![<\\/\\w])(?<!<a[^>]*>.*?)\\b(${escaped})\\b(?![^<]*<\\/a>)(?![^<]*<\\/h[1-6]>)(?![^<]*<\\/code>)`,
        'i'
      );

      const match = result.match(pattern);
      if (match && match.index !== undefined) {
        // Check we're not inside a tag
        const before = result.slice(0, match.index);
        const openA = (before.match(/<a[\s>]/gi) || []).length;
        const closeA = (before.match(/<\/a>/gi) || []).length;
        if (openA > closeA) continue; // inside an <a> tag

        const openH = (before.match(/<h[1-6][\s>]/gi) || []).length;
        const closeH = (before.match(/<\/h[1-6]>/gi) || []).length;
        if (openH > closeH) continue; // inside a heading

        const openCode = (before.match(/<code[\s>]/gi) || []).length;
        const closeCode = (before.match(/<\/code>/gi) || []).length;
        if (openCode > closeCode) continue; // inside <code>

        const original = match[0];
        const titleAttr = rule.title ? ` title="${rule.title}"` : '';
        const link = `<a href="${rule.href}"${titleAttr}>${original}</a>`;
        result = result.slice(0, match.index) + link + result.slice(match.index + original.length);
        alreadyLinked.add(rule.href);
        break; // move to next rule
      }
    }
  }

  return result;
}
