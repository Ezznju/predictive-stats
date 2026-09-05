import { ImageResponse } from 'next/og';
import { ogSize, loadOgFonts, OgCard } from '@/lib/og-template';

import { ImageResponse } from 'next/og';
import { ogSize, loadOgFonts, OgCard } from '@/lib/og-template';

// Edge runtime for fast cold boots
export const runtime = 'edge';
export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Polymarket Trending Markets — Live Volume Board';

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
};

export default async function Image() {
  const fonts = await loadOgFonts();

  return new ImageResponse(
    (
      <OgCard
        title="Polymarket Trending Markets — Live Volume Board"
        badge="LIVE"
        badgeColor="#2BD96E"
        metaLeft="Top markets by 24h volume"
        metaRight="Updated every minute"
      />
    ),
    { ...ogSize, fonts, headers: CACHE_HEADERS }
  );
}
