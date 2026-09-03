import { ImageResponse } from 'next/og';
import { ogSize, loadOgFonts, OgCard } from '@/lib/og-template';

export const dynamic = 'force-dynamic';
export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Polymarket Whale Tracker — Live Whale Feed';

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
    { ...ogSize, fonts }
  );
}
