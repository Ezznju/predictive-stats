import { ImageResponse } from 'next/og';
import { unstable_cache } from 'next/cache';
import { getArticleBySlug, getCategoryBySlug, formatDate } from '@/lib/db';
import { ogSize, loadOgFonts, OgCard } from '@/lib/og-template';

export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Predictions Market Fans article';

// Same caching as the /og route: 10-min data cache + 7-day CDN hold with
// stale-while-revalidate so social crawlers never hit a cold 4s render.
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

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
};

export default async function Image({ params }: { params: { slug: string } }) {
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
    { ...ogSize, fonts, headers: CACHE_HEADERS }
  );
}
