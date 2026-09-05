import { ImageResponse } from 'next/og';
import { ogSize, loadOgFonts, OgCard } from '@/lib/og-template';

// Edge runtime: fast cold boots keep social crawlers within their ~3s budget.
// Custom route handler (file-convention images 404 under this route group).
export const runtime = 'edge';

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
};

export async function GET() {
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
