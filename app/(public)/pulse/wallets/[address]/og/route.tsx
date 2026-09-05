import { ImageResponse } from 'next/og';
import { ogSize, loadOgFonts, OgCard } from '@/lib/og-template';

// Edge runtime + custom route (file-convention images 404 in this group).
export const runtime = 'edge';

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
};

export async function GET(
  _req: Request,
  { params }: { params: { address: string } }
) {
  const fonts = await loadOgFonts();
  const addr = params.address;
  const shortAddr = addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

  return new ImageResponse(
    (
      <OgCard
        title={`Whale Profile: ${shortAddr}`}
        badge="WHALE PROFILE"
        badgeColor="#29C5F6"
        metaLeft="Polymarket Whale Tracker"
        metaRight="Intelligence scores & history"
      />
    ),
    { ...ogSize, fonts, headers: CACHE_HEADERS }
  );
}
