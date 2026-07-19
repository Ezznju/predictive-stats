import { ImageResponse } from 'next/og';
import { ogSize, loadOgFonts, OgCard } from '@/lib/og-template';

export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Prediction Pulse — Live Whale Tracker';

export default async function Image() {
  const fonts = await loadOgFonts();

  return new ImageResponse(
    (
      <OgCard
        title="Prediction Pulse — Live Whale Tracker"
        badge="WHALE INTEL"
        badgeColor="#D9F24B"
        metaLeft="Real-time whale intelligence"
        metaRight="Polymarket & Kalshi"
      />
    ),
    { ...ogSize, fonts }
  );
}
