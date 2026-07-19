import { ImageResponse } from 'next/og';
import { ogSize, loadOgFonts, OgCard } from '@/lib/og-template';

export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Whale Wallet Profile';

export default async function Image({ params }: { params: { address: string } }) {
  const fonts = await loadOgFonts();
  const addr = params.address;
  const shortAddr = `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return new ImageResponse(
    (
      <OgCard
        title={`Whale Profile: ${shortAddr}`}
        badge="WHALE PROFILE"
        badgeColor="#29C5F6"
        metaLeft="Prediction Pulse"
        metaRight="Intelligence scores & history"
      />
    ),
    { ...ogSize, fonts }
  );
}
