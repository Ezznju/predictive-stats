/**
 * Auto-linker for article HTML content.
 *
 * Scans rendered article HTML and injects internal links for key terms,
 * tools, and platform names — strictly on plain text nodes outside HTML tags,
 * attributes, <a>, <h1-h6>, <code>, <pre>, <script>, and <style>.
 *
 * Multi-word specific rules run BEFORE single-word platform rules so phrases
 * like "most active Polymarket markets" or "Kalshi smart money" link to the
 * dedicated tool page rather than being preempted by "Polymarket" / "Kalshi".
 */

interface LinkRule {
  /** Plain-text terms (case-insensitive). First match wins per article. */
  terms: string[];
  href: string;
  /** Optional title attribute for the link */
  title?: string;
}

const LINK_RULES: LinkRule[] = [
  // Multi-word tool & live-board phrases FIRST so they aren't preempted by single platform names
  {
    terms: ['LP reward scanner', 'liquidity reward scanner', 'LP scanner'],
    href: '/tools/lp-scanner',
    title: 'Free LP Reward Scanner tool',
  },
  {
    terms: ['arbitrage scanner', 'arb scanner', 'arbitrage tool'],
    href: '/tools/arbitrage-scanner',
    title: 'Free Arbitrage Scanner tool',
  },
  {
    terms: [
      'most active Polymarket markets',
      'active Polymarket markets',
      'hot Polymarket markets',
      'Polymarket trending markets',
      'trending markets',
    ],
    href: '/polymarket-trending-markets',
    title: 'Live Polymarket trending markets board',
  },
  {
    terms: [
      'most active Kalshi markets',
      'active Kalshi markets',
      'hot Kalshi markets',
      'Kalshi trending markets',
    ],
    href: '/kalshi-trending-markets',
    title: 'Live Kalshi trending markets board',
  },
  {
    terms: [
      'where big money is resting on Kalshi',
      'Kalshi order book walls',
      'Kalshi smart money',
      'Kalshi order book',
    ],
    href: '/kalshi-smart-money',
    title: 'Kalshi Smart Money Signals',
  },
  {
    terms: ['prediction market platforms', 'prediction market sites', 'best prediction markets'],
    href: '/platforms',
    title: 'Compare prediction market platforms',
  },
  {
    terms: ['liquidity provider rewards', 'liquidity rewards', 'LP rewards'],
    href: '/tools/lp-scanner',
    title: 'Scan current LP rewards',
  },
  {
    terms: ['cross-platform arbitrage', 'prediction market arbitrage'],
    href: '/tools/arbitrage-scanner',
    title: 'Find arbitrage opportunities',
  },
  {
    terms: ['whale skill leaderboard', 'skill leaderboard', 'top Polymarket wallets'],
    href: '/pulse/leaderboard',
    title: 'Polymarket Whale Skill Leaderboard',
  },
  {
    terms: ['Polymarket whale tracker', 'whale tracker', 'whale trades', 'Polymarket smart money'],
    href: '/pulse',
    title: 'Live Polymarket Whale Tracker',
  },
  // Single-word platform review links LAST
  {
    terms: ['Pronostyx'],
    href: '/platforms/pronostyx',
    title: 'Pronostyx review',
  },
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
    terms: ['Manifold Markets', 'Manifold'],
    href: '/platforms/manifold',
    title: 'Manifold Markets review',
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
];

const SKIP_TAGS = new Set(['a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'script', 'style', 'figcaption']);

/**
 * Inject internal links into article HTML safely on text nodes only.
 */
export function autoLink(html: string): string {
  // Extract existing hrefs so we don't double-link to a destination already present
  const existingHrefs = new Set(
    Array.from(html.matchAll(/href=["']([^"']+)["']/gi)).map((m) => m[1])
  );
  const alreadyLinked = new Set<string>();

  // Split HTML into tag tokens (<...>) and plain text tokens
  const tokens = html.split(/(<[^>]+>)/g);

  for (const rule of LINK_RULES) {
    if (existingHrefs.has(rule.href) || alreadyLinked.has(rule.href)) {
      continue;
    }

    let linkedThisRule = false;

    for (const term of rule.terms) {
      if (linkedThisRule) break;
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b(${escaped})\\b`, 'i');

      const depth: Record<string, number> = {};

      for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i];
        if (!tok) continue;

        if (tok.startsWith('<')) {
          const closeMatch = tok.match(/^<\/([a-z0-9]+)/i);
          if (closeMatch) {
            const tag = closeMatch[1].toLowerCase();
            if (SKIP_TAGS.has(tag) && depth[tag] > 0) depth[tag]--;
          } else if (!tok.endsWith('/>')) {
            const openMatch = tok.match(/^<([a-z0-9]+)[\s>]/i);
            if (openMatch) {
              const tag = openMatch[1].toLowerCase();
              if (SKIP_TAGS.has(tag)) depth[tag] = (depth[tag] || 0) + 1;
            }
          }
          continue;
        }

        // Skip text inside forbidden tags
        const inSkipped = Object.values(depth).some((d) => d > 0);
        if (inSkipped) continue;

        const m = tok.match(regex);
        if (m && m.index !== undefined) {
          const original = m[0];
          const titleAttr = rule.title ? ` title="${rule.title}"` : '';
          const before = tok.slice(0, m.index);
          const after = tok.slice(m.index + original.length);
          // Replace the single text token with [before, <a>, original, </a>, after]
          // so subsequent rules see the newly inserted <a> tag as forbidden!
          tokens.splice(i, 1, before, `<a href="${rule.href}"${titleAttr}>`, original, '</a>', after);
          alreadyLinked.add(rule.href);
          linkedThisRule = true;
          break;
        }
      }
    }
  }

  return tokens.join('');
}
