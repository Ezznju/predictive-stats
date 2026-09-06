import { ImageResponse } from 'next/og';
import { ogSize, loadOgFonts, OgCard } from '@/lib/og-template';

export const runtime = 'edge';

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
};

export async function GET() {
  const fonts = await loadOgFonts();

  return new ImageResponse(
    (
      <OgCard
        title="Kalshi Smart Money Signals — Where Big Money Rests"
        badge="ORDER BOOK INTEL"
        badgeColor="#00A36C"
        metaLeft="Order book walls · Momentum · Decision week"
        metaRight="Updated every 10 minutes"
      />
    ),
    { ...ogSize, fonts, headers: CACHE_HEADERS }
  );
}
