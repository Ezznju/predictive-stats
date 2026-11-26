/**
 * Pure O(1) SEO lifecycle helpers (0ms Worker CPU, zero D1 calls):
 *
 * 1. Keyword cannibalization consolidation — single-hop 308 permanent redirects
 *    from weaker duplicate articles to the winning canonical article URL, plus
 *    filtering those slugs out of sitemap/RSS/llms.txt.
 *
 * 2. Expired daily match-slate lifecycle — keeps evergreen sports guides
 *    indexed while showing a live-markets banner on dated match slates older
 *    than 14 days and marking slates older than 30 days `noindex, follow`
 *    (and excluding them from sitemap.xml) so dead match dates stop dragging
 *    down site-wide CTR and crawl budget.
 */

export const CONSOLIDATED_ARTICLE_REDIRECTS: Record<string, string> = {
  // Consolidate weaker duplicate (1,461 impr, pos 9.2) onto the 66,825-impr winner
  'how-kalshi-combos-actually-work-step-by-step':
    '/platform-reviews/how-do-kalshi-combos-work-the-complete-guide-to-kalshi-combo-bets-parlays-rules-',
};

export function getConsolidatedRedirect(slug: string): string | null {
  return CONSOLIDATED_ARTICLE_REDIRECTS[slug] ?? null;
}

export function isConsolidatedArticle(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(CONSOLIDATED_ARTICLE_REDIRECTS, slug);
}

const MONTH_PREFIX_RE =
  /^(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)-(\d{1,2}-)?/i;

const MATCH_SLATE_TERM_RE =
  /(football|soccer|match|matches|pick|picks|prediction|predictions|slate|odds)/i;

export function isDatedMatchSlate(article: {
  categorySlug: string;
  slug: string;
}): boolean {
  if (article.categorySlug !== 'sports-projections') return false;
  return MONTH_PREFIX_RE.test(article.slug) && MATCH_SLATE_TERM_RE.test(article.slug);
}

export interface MatchSlateLifecycle {
  isDatedSlate: boolean;
  ageDays: number;
  showExpiredBanner: boolean;
  shouldNoindex: boolean;
}

export function getMatchSlateLifecycle(article: {
  categorySlug: string;
  slug: string;
  publishDate: string;
}): MatchSlateLifecycle {
  const publishedMs = Date.parse(article.publishDate);
  const ageDays = Number.isFinite(publishedMs)
    ? Math.max(0, Math.floor((Date.now() - publishedMs) / 86_400_000))
    : 0;

  const isDatedSlate = isDatedMatchSlate(article);
  return {
    isDatedSlate,
    ageDays,
    showExpiredBanner: isDatedSlate && ageDays >= 14,
    shouldNoindex: isDatedSlate && ageDays >= 30,
  };
}
