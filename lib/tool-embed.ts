/**
 * Replaces [tool:xxx] markers in article HTML with styled tool CTA cards,
 * and picks context-matched mid-article & bottom-of-article tool cards.
 *
 * Pure HTML output for inline embeds — zero React hydration, zero extra
 * Cloudflare Worker CPU or network calls.
 *
 * Usage in article content:
 *   [tool:lp-scanner]
 *   [tool:arbitrage-scanner]
 *   [tool:pulse]
 *   [tool:kalshi-smart-money]
 *   [tool:kalshi-trending]
 *   [tool:polymarket-trending]
 *   [tool:kalshi-combo-calculator]
 *   [tool:kalshi-fee-calculator]
 */

export type ToolKey =
  | 'lp-scanner'
  | 'arbitrage-scanner'
  | 'pulse'
  | 'kalshi-smart-money'
  | 'kalshi-trending'
  | 'polymarket-trending'
  | 'kalshi-combo-calculator'
  | 'kalshi-fee-calculator';

export interface ToolCardConfig {
  href: string;
  title: string;
  subtitle: string;
  kicker: string;
  badge: string;
  description: string;
  color: string;
}

export const TOOL_CARDS: Record<ToolKey, ToolCardConfig> = {
  'kalshi-combo-calculator': {
    href: '/tools/kalshi-combo-calculator',
    title: 'Kalshi Combo & Blue Arrow Calculator',
    subtitle: 'Kalshi',
    kicker: 'Simulate your payout',
    badge: 'FREE CALCULATOR',
    description:
      'Model 2–5 leg Kalshi combo payouts, trading fees, and see how a Blue Arrow / DNP scalar settlement changes your return vs. a sportsbook void.',
    color: '#29C5F6',
  },
  'kalshi-fee-calculator': {
    href: '/tools/kalshi-fee-calculator',
    title: 'Kalshi vs. Polymarket Fee Calculator',
    subtitle: 'Kalshi × Polymarket',
    kicker: 'Check the fee drag',
    badge: 'FREE CALCULATOR',
    description:
      'Calculate exact Kalshi taker and maker fees, break-even win probability, and dollar savings on 0%-fee venues like Polymarket.',
    color: '#FFE642',
  },
  'kalshi-smart-money': {
    href: '/kalshi-smart-money',
    title: 'Kalshi Smart Money Signals',
    subtitle: 'Kalshi · Live',
    kicker: 'Follow the order book',
    badge: 'LIVE DATA',
    description:
      'Track large resting order-book walls, biggest 24h momentum shifts, and high-stakes Kalshi contracts expiring this week.',
    color: '#2BD96E',
  },
  'kalshi-trending': {
    href: '/kalshi-trending-markets',
    title: 'Kalshi Trending Markets',
    subtitle: 'Kalshi · Live',
    kicker: 'See what is moving',
    badge: 'LIVE DATA',
    description:
      'Live board of Kalshi’s top 25 active event contracts ranked by 24-hour volume, bid/ask spreads, and time to expiration.',
    color: '#29C5F6',
  },
  'lp-scanner': {
    href: '/tools/lp-scanner',
    title: 'LP Reward Scanner',
    subtitle: 'Polymarket',
    kicker: 'See the numbers',
    badge: 'LIVE DATA',
    description:
      'Rank every live Polymarket reward pool by realistic APR net of fees, competition, minimum capital, and yield per $1,000.',
    color: '#C6F23A',
  },
  'arbitrage-scanner': {
    href: '/tools/arbitrage-scanner',
    title: 'Arbitrage Scanner',
    subtitle: 'Polymarket × Kalshi',
    kicker: 'Find the spread',
    badge: 'LIVE DATA',
    description:
      'Spot real-time cross-platform price gaps between Polymarket and Kalshi with order-book depth net of fees and slippage.',
    color: '#29C5F6',
  },
  pulse: {
    href: '/pulse',
    title: 'Polymarket Whale Tracker',
    subtitle: 'Smart Money',
    kicker: 'Track sharp wallets',
    badge: 'LIVE DATA',
    description:
      'Follow real-time Polymarket whale trades graded by historical wallet skill, win rate, P&L, and conviction.',
    color: '#2BD96E',
  },
  'polymarket-trending': {
    href: '/polymarket-trending-markets',
    title: 'Polymarket Trending Markets',
    subtitle: 'Polymarket · Live',
    kicker: 'Live volume board',
    badge: 'LIVE DATA',
    description:
      'The top 25 most active Polymarket contracts ranked by 24-hour trading volume, live YES/NO odds, and daily movers.',
    color: '#FFE642',
  },
};

export function toolCardHtml(tool: string): string {
  const config = TOOL_CARDS[tool as ToolKey];
  if (!config) return '';

  return `
<aside class="tool-embed-card not-prose" data-tool="${tool}" style="margin:2rem auto;max-width:66ch;">
  <a href="${config.href}" style="display:block;background:#FFF7E6;border:2px solid #000;border-radius:1rem;padding:1.15rem 1.25rem;box-shadow:4px 4px 0 #000;text-decoration:none;transition:transform 0.15s ease,box-shadow 0.15s ease;">
    <div style="display:flex;align-items:flex-start;gap:0.9rem;">
      <div style="background:${config.color};width:2.75rem;height:2.75rem;border-radius:0.75rem;border:2px solid #000;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:0.1rem;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.4rem;margin-bottom:0.35rem;">
          <span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;font-weight:800;letter-spacing:0.06em;color:#000;background:${config.color};border:1.5px solid #000;border-radius:9999px;padding:1px 8px;">${config.badge}</span>
          <span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;font-weight:700;color:#444;text-transform:uppercase;letter-spacing:0.05em;">${config.subtitle}</span>
        </div>
        <div style="font-weight:800;font-size:1.05rem;color:#0B1120;line-height:1.3;margin:0;">
          ${config.title}
        </div>
        <p style="font-size:0.875rem;color:#333;margin:0.3rem 0 0;line-height:1.5;">
          ${config.description}
        </p>
        <span style="display:inline-flex;align-items:center;gap:0.35rem;margin-top:0.6rem;font-size:0.75rem;font-weight:800;color:#0B1120;text-transform:uppercase;letter-spacing:0.06em;">
          Open free tool &rarr;
        </span>
      </div>
    </div>
  </a>
</aside>`;
}

/**
 * Process article HTML content, replacing [tool:xxx] markers with cards.
 */
export function embedTools(html: string): string {
  return html.replace(
    /(?:<p[^>]*>\s*)?\[tool:([a-z-]+)\](?:\s*<\/p>)?/gi,
    (_, tool) => toolCardHtml(tool.toLowerCase())
  );
}

/**
 * Pick the most relevant mid-article tool and bottom CTA pair for an article
 * based on its title, slug, tags, and category (O(1) regex checks).
 */
export function pickContextualTools(article: {
  title: string;
  slug: string;
  tags: string[];
  categorySlug: string;
}): { midTool: ToolKey; bottomTools: [ToolKey, ToolKey] } {
  const haystack = `${article.title} ${article.slug} ${article.tags.join(' ')} ${article.categorySlug}`.toLowerCase();

  const isKalshi = /\bkalshi\b/.test(haystack);
  const isPolymarket = /\bpolymarket\b/.test(haystack);
  const isComboOrBlueArrow = /\b(combo|combos|parlay|parlays|blue[\s-]arrow|blue[\s-]shield|dnp|cash[\s-]out)\b/.test(haystack);
  const isFee = /\b(fee|fees|cost|pricing|commission|spread|break[\s-]even)\b/.test(haystack);
  const isLp = /\b(lp|liquidity|market[\s-]making|reward[\s-]pool|apr|yield)\b/.test(haystack);
  const isWhale = /\b(whale|whales|smart[\s-]money|wallet|wallets|insider|leaderboard)\b/.test(haystack);
  const isArb = /\b(arbitrage|arb|mispric|vs\.?|versus|compare|comparison)\b/.test(haystack);

  if (isKalshi && isComboOrBlueArrow) {
    return {
      midTool: 'kalshi-combo-calculator',
      bottomTools: ['kalshi-fee-calculator', 'kalshi-smart-money'],
    };
  }

  if (isKalshi && isFee) {
    return {
      midTool: 'kalshi-fee-calculator',
      bottomTools: ['kalshi-combo-calculator', 'arbitrage-scanner'],
    };
  }

  if (isKalshi && !isPolymarket) {
    return {
      midTool: 'kalshi-fee-calculator',
      bottomTools: ['kalshi-smart-money', 'kalshi-combo-calculator'],
    };
  }

  if (isPolymarket && isLp) {
    return {
      midTool: 'lp-scanner',
      bottomTools: ['pulse', 'arbitrage-scanner'],
    };
  }

  if (isPolymarket && isWhale) {
    return {
      midTool: 'pulse',
      bottomTools: ['lp-scanner', 'arbitrage-scanner'],
    };
  }

  if (isKalshi && isPolymarket) {
    return {
      midTool: isFee ? 'kalshi-fee-calculator' : 'arbitrage-scanner',
      bottomTools: ['kalshi-fee-calculator', 'arbitrage-scanner'],
    };
  }

  if (isPolymarket) {
    return {
      midTool: 'pulse',
      bottomTools: ['lp-scanner', 'polymarket-trending'],
    };
  }

  if (isArb) {
    return {
      midTool: 'arbitrage-scanner',
      bottomTools: ['kalshi-fee-calculator', 'lp-scanner'],
    };
  }

  return {
    midTool: 'arbitrage-scanner',
    bottomTools: ['lp-scanner', 'kalshi-fee-calculator'],
  };
}

/**
 * Automatically inject a topic-matched tool CTA card in the upper half of
 * long-form articles (before the 3rd H2, or 2nd H2 when only 2 H2s exist).
 * Skips injection if the author already placed a manual [tool:...] card
 * or the article is very short.
 */
export function insertMidArticleTool(html: string, tool: ToolKey): string {
  if (!html || html.includes('data-tool=')) return html;

  const h2Re = /<h2\b[^>]*>/gi;
  const positions: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = h2Re.exec(html))) {
    positions.push(m.index);
  }

  if (positions.length < 2) return html;

  // Prefer right before the 3rd H2 (after 2 full sections); fall back to 2nd H2
  // only if at least ~900 chars of body precede it so it doesn't crowd the intro.
  const targetPos = positions.length >= 3 ? positions[2] : positions[1];
  if (targetPos < 900) return html;

  const card = toolCardHtml(tool);
  if (!card) return html;

  return html.slice(0, targetPos) + card + html.slice(targetPos);
}
