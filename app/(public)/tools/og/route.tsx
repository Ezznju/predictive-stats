import { ImageResponse } from 'next/og';
import { ogSize, loadOgFonts, OgCard } from '@/lib/og-template';

// Edge runtime: fast cold boots keep social crawlers within their ~3s budget.
export const runtime = 'edge';

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
};

export async function GET() {
  const fonts = await loadOgFonts();

  return new ImageResponse(
    (
      <OgCard
        title="Free Prediction Market Tools"
        badge="ARBITRAGE · LP · WHALES · TRENDING"
        badgeColor="#FF7900"
        metaLeft="Live data, zero cost"
        metaRight="No signup"
      />
    ),
    { ...ogSize, fonts, headers: CACHE_HEADERS }
  );
}
