import { getPublishedArticles, getCategories } from '@/lib/db';
import { slimArticles } from '@/lib/isolate-cache';
import { getPlatforms } from '@/lib/platforms';
import { SITE_URL, stripHtml } from '@/lib/seo-utils';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * /llms.txt — structured plain-text directory for AI search engines
 * (Perplexity, ChatGPT Search, Claude, Gemini) per the llms.txt convention.
 */
export async function GET() {
  let recentArticles: Awaited<ReturnType<typeof getPublishedArticles>> = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];

  try {
    const [rawArticles, cats] = await Promise.all([
      getPublishedArticles(),
      getCategories(),
    ]);
    recentArticles = slimArticles(rawArticles).slice(0, 30);
    categories = cats;
  } catch (err) {
    console.warn('[llms.txt] D1 unavailable, serving static directory', err);
  }

  const platforms = getPlatforms();

  const lines: string[] = [
    '# Predictions Market Fans',
    '',
    '> Independent prediction market analysis, live Polymarket & Kalshi scanners, whale wallet intelligence, LP reward yields, and hands-on platform reviews.',
    '',
    `Canonical site: ${SITE_URL}`,
    `RSS feed: ${SITE_URL}/rss.xml`,
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
    '## Free Live Prediction Market Tools',
    `- [Arbitrage Scanner (Polymarket × Kalshi)](${SITE_URL}/tools/arbitrage-scanner): Real-time cross-platform arbitrage scanner with order-book depth and execution plans net of fees and slippage.`,
    `- [Polymarket LP Reward Scanner](${SITE_URL}/tools/lp-scanner): Live ranking of Polymarket liquidity provider reward pools by realistic APR net of fees, spread, and competition.`,
    `- [Polymarket Whale Tracker (Pulse)](${SITE_URL}/pulse): Live whale trade feed graded by historical wallet skill, win rate, P&L, and conviction.`,
    `- [Whale Skill Leaderboard](${SITE_URL}/pulse/leaderboard): Top Polymarket wallets ranked by composite skill score.`,
    `- [Polymarket Trending Markets](${SITE_URL}/polymarket-trending-markets): Live top Polymarket contracts ranked by 24-hour volume and price movement.`,
    `- [Kalshi Trending Markets](${SITE_URL}/kalshi-trending-markets): Live top CFTC-regulated Kalshi markets ranked by 24-hour volume and spreads.`,
    `- [Kalshi Smart Money Signals](${SITE_URL}/kalshi-smart-money): Large resting order-book walls, 24h momentum shifts, and expiring decision markets on Kalshi.`,
    '',
    '## Independent Platform Reviews',
    `- [All Prediction Market Platforms Compared](${SITE_URL}/platforms): Side-by-side comparison of fees, liquidity, regulation, and ratings.`,
    ...platforms.map(
      (p) =>
        `- [${p.name} Review (${p.overallRating}/5)](${SITE_URL}/platforms/${p.slug}): ${p.tagline}`
    ),
  ];

  if (categories.length > 0) {
    lines.push('', '## Editorial Topics');
    for (const c of categories) {
      const desc = c.description ? `: ${stripHtml(c.description)}` : '';
      lines.push(`- [${c.name}](${SITE_URL}/category/${c.slug})${desc}`);
    }
  }

  if (recentArticles.length > 0) {
    lines.push('', '## Recent Analysis & Guides');
    for (const a of recentArticles) {
      const title = stripHtml(a.title);
      const excerpt = stripHtml(a.excerpt);
      lines.push(
        `- [${title}](${SITE_URL}/${a.categorySlug}/${a.slug})${excerpt ? `: ${excerpt}` : ''}`
      );
    }
  }

  lines.push(
    '',
    '## About & Policies',
    `- [About Predictions Market Fans](${SITE_URL}/about)`,
    `- [The Weekly Signal Newsletter](${SITE_URL}/newsletter)`,
    `- [Affiliate Disclosure](${SITE_URL}/disclosure)`,
    `- [Disclaimer](${SITE_URL}/disclaimer)`
  );

  return new Response(lines.join('\n') + '\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
