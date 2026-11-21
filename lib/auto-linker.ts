/**
 * Single-pass O(N) auto-linker for article HTML content.
 *
 * Scans rendered article HTML once and injects internal links for key terms,
 * tools, and platform names — strictly on plain text nodes outside HTML tags,
 * attributes, <a>, <h1-h6>, <code>, <pre>, <script>, <style>, and <figcaption>.
 *
 * Pre-compiled combined regex (longest terms first) keeps execution < 0.2ms
 * per article so it stays far below Cloudflare Workers' 10ms CPU cap.
 */

interface LinkRule {
  terms: string[];
  href: string;
  title?: string;
}

const LINK_RULES: LinkRule[] = [
  // Multi-word tool & live-board phrases FIRST
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

// Build one pre-compiled regex sorted by descending term length so longer
// phrases (e.g. "Polymarket whale tracker") always beat shorter words ("Polymarket").
const TERM_TO_RULE = new Map<string, LinkRule>();
const ALL_TERMS: string[] = [];
for (const rule of LINK_RULES) {
  for (const term of rule.terms) {
    const key = term.toLowerCase();
    if (!TERM_TO_RULE.has(key)) {
      TERM_TO_RULE.set(key, rule);
      ALL_TERMS.push(term);
    }
  }
}
ALL_TERMS.sort((a, b) => b.length - a.length);

const COMBINED_REGEX = new RegExp(
  `\\b(${ALL_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'gi'
);

const SKIP_OPEN_RE = /^<(a|h[1-6]|code|pre|script|style|figcaption)(?:[\s>]|$)/i;
const SKIP_CLOSE_RE = /^<\/(a|h[1-6]|code|pre|script|style|figcaption)>/i;

/**
 * Inject internal links into article HTML in a single O(N) pass on text nodes only.
 */
export function autoLink(html: string): string {
  if (!html) return html;

  const linkedHrefs = new Set<string>();
  const hrefRe = /href=["']([^"']+)["']/gi;
  let hm: RegExpExecArray | null;
  while ((hm = hrefRe.exec(html))) {
    linkedHrefs.add(hm[1]);
  }

  const tokens = html.split(/(<[^>]+>)/g);
  let skipDepth = 0;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (!tok) continue;

    if (tok.charCodeAt(0) === 60 /* '<' */) {
      if (SKIP_CLOSE_RE.test(tok)) {
        if (skipDepth > 0) skipDepth--;
      } else if (!tok.endsWith('/>') && SKIP_OPEN_RE.test(tok)) {
        skipDepth++;
      }
      continue;
    }

    if (skipDepth > 0) continue;

    tokens[i] = tok.replace(COMBINED_REGEX, (match) => {
      const rule = TERM_TO_RULE.get(match.toLowerCase());
      if (!rule || linkedHrefs.has(rule.href)) return match;
      linkedHrefs.add(rule.href);
      const titleAttr = rule.title ? ` title="${rule.title}"` : '';
      return `<a href="${rule.href}"${titleAttr}>${match}</a>`;
    });
  }

  return tokens.join('');
}
