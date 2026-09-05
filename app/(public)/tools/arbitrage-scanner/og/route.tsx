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
        title="Polymarket × Kalshi Arbitrage Scanner"
        badge="FREE & LIVE"
        badgeColor="#29C5F6"
        metaLeft="Execution plans net of fees"
        metaRight="No signup"
      />
    ),
    { ...ogSize, fonts, headers: CACHE_HEADERS }
  );
}
