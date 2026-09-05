import { ImageResponse } from 'next/og';
import { unstable_cache } from 'next/cache';
import { getArticleBySlug, getCategoryBySlug, formatDate } from '@/lib/db';
import { ogSize, loadOgFonts, OgCard } from '@/lib/og-template';

export const runtime = 'nodejs';
export const revalidate = 3600;

// Cached article lookup: OG renders were paying a D1 round-trip per request.
// 10-min TTL, purged with the same 'articles' tag as the page cache.
const getOgArticle = unstable_cache(
  async (slug: string) => {
    const article = await getArticleBySlug(slug);
    if (!article) return null;
    const category = await getCategoryBySlug(article.categorySlug);
    return {
      title: article.title,
      badge: category?.name,
      badgeColor: category?.color,
      publishDate: article.publishDate,
      readTime: article.readTime,
    };
  },
  ['og-article'],
  { revalidate: 600, tags: ['articles'] }
);

// Long CDN hold + stale-while-revalidate: social crawlers (Twitter ~3s
// budget) get the cached copy instantly even while a fresh one re-renders.
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
};

export async function GET(
  _req: Request,
  { params }: { params: { category: string; slug: string } }
) {
  const [article, fonts] = await Promise.all([getOgArticle(params.slug), loadOgFonts()]);

  return new ImageResponse(
    (
      <OgCard
        title={article?.title || 'Predictions Market Fans'}
        badge={article?.badge}
        badgeColor={article?.badgeColor || '#FF00B8'}
        metaLeft={article ? formatDate(article.publishDate) : undefined}
        metaRight={article ? `${article.readTime} min read` : undefined}
      />
    ),
    {
      ...ogSize,
      fonts,
      headers: CACHE_HEADERS,
    }
  );
}
