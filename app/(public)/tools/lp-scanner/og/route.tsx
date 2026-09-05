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
        title="Polymarket LP Reward Scanner"
        badge="LIVE APR"
        badgeColor="#2BD96E"
        metaLeft="Realistic yield, net of fees"
        metaRight="Live order books"
      />
    ),
    { ...ogSize, fonts, headers: CACHE_HEADERS }
  );
}
