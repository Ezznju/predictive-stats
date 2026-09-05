import { ImageResponse } from 'next/og';
import { ogSize, loadOgFonts, OgCard } from '@/lib/og-template';

export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Predictions Market Fans article';

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
};

export default async function Image() {
  const fonts = await loadOgFonts();

  return new ImageResponse(
    (
      <OgCard
        title="Predictions Market Fans"
        badge="PMF"
        badgeColor="#FFBF00"
        metaLeft="Sharp analysis for uncertain markets"
        metaRight="predictionsmarketfans.com"
      />
    ),
    { ...ogSize, fonts, headers: CACHE_HEADERS }
  );
}
