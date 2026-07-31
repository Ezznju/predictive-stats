import { ImageResponse } from 'next/og';
import { getArticleBySlug, getCategoryBySlug, formatDate } from '@/lib/db';
import { ogSize, loadOgFonts, OgCard } from '@/lib/og-template';

export const dynamic = 'force-dynamic';
export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Predictions Market Fans article';

export default async function Image({ params }: { params: { category: string; slug: string } }) {
  const [article, fonts] = await Promise.all([getArticleBySlug(params.slug), loadOgFonts()]);
  const category = article ? await getCategoryBySlug(article.categorySlug) : null;

  return new ImageResponse(
    (
      <OgCard
        title={article?.title || 'Predictions Market Fans'}
        badge={category?.name}
        badgeColor={category?.color || '#FF00B8'}
        metaLeft={article ? formatDate(article.publishDate) : undefined}
        metaRight={article ? `${article.readTime} min read` : undefined}
      />
    ),
    { ...ogSize, fonts }
  );
}
