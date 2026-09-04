import { ImageResponse } from 'next/og';
import { ogSize, loadOgFonts, OgCard } from '@/lib/og-template';

export const dynamic = 'force-dynamic';
export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Polymarket Trending Markets — Live Volume Board';

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
    { ...ogSize, fonts }
  );
}
