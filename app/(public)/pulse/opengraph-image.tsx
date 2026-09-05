import { ImageResponse } from 'next/og';
import { ogSize, loadOgFonts, OgCard } from '@/lib/og-template';

// Edge runtime for fast cold boots
export const runtime = 'edge';
export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Polymarket Whale Tracker — Live Whale Feed';

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
};

export default async function Image() {
  const fonts = await loadOgFonts();

  return new ImageResponse(
    (
      <OgCard
        title="Polymarket Whale Tracker — Live Whale Feed"
        badge="WHALE INTEL"
        badgeColor="#D9F24B"
        metaLeft="Real-time whale intelligence"
        metaRight="Polymarket"
      />
    ),
    { ...ogSize, fonts, headers: CACHE_HEADERS }
  );
}
