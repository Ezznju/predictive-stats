import { ImageResponse } from 'next/og';
import { getArticleBySlug, getCategoryBySlug, formatDate } from '@/lib/db';
import { ogSize, OgCard } from '@/lib/og-template';

export const runtime = 'edge';
export const revalidate = 3600;

async function loadOgFontsEdge(): Promise<ImageResponse['options']['fonts']> {
  const [boldRes, mediumRes] = await Promise.all([
    fetch('https://predictionsmarketfans.com/fonts/SpaceGrotesk-Bold.woff'),
    fetch('https://predictionsmarketfans.com/fonts/SpaceGrotesk-Medium.woff'),
  ]);
  const [bold, medium] = await Promise.all([boldRes.arrayBuffer(), mediumRes.arrayBuffer()]);
  return [
    { name: 'Space Grotesk', data: bold, weight: 700 as const, style: 'normal' as const },
    { name: 'Space Grotesk', data: medium, weight: 500 as const, style: 'normal' as const },
  ];
}

export async function GET(
  _req: Request,
  { params }: { params: { category: string; slug: string } }
) {
  const [article, fonts] = await Promise.all([getArticleBySlug(params.slug), loadOgFontsEdge()]);
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
    {
      ...ogSize,
      fonts,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, immutable',
      },
    }
  );
}
