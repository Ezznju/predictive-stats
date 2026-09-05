import { ImageResponse } from 'next/og';
import { getArticleBySlug, getCategoryBySlug, formatDate } from '@/lib/db';
import { ogSize, loadOgFonts, OgCard } from '@/lib/og-template';

// Edge runtime for fast cold boots (crawlers time out on slow OG routes).
export const runtime = 'edge';
export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Predictions Market Fans article';

const ogCache = new Map<string, { at: number; data: OgArticleData | null }>();
const OG_TTL = 10 * 60 * 1000;

interface OgArticleData {
  title: string;
  badge?: string;
  badgeColor?: string;
  publishDate: string;
  readTime: number;
}

async function getOgArticle(slug: string): Promise<OgArticleData | null> {
  const hit = ogCache.get(slug);
  if (hit && Date.now() - hit.at < OG_TTL) return hit.data;
  const article = await getArticleBySlug(slug);
  if (!article) {
    ogCache.set(slug, { at: Date.now(), data: null });
    return null;
  }
  const category = await getCategoryBySlug(article.categorySlug);
  const data: OgArticleData = {
    title: article.title,
    badge: category?.name,
    badgeColor: category?.color,
    publishDate: article.publishDate,
    readTime: article.readTime,
  };
  ogCache.set(slug, { at: Date.now(), data });
  return data;
}

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
