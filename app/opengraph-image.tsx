import { ImageResponse } from 'next/og';
import { ogSize, loadOgFonts, OgCard } from '@/lib/og-template';

export const dynamic = 'force-dynamic';
export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Predictions Market Fans — Sharp analysis for uncertain markets';

export default async function Image() {
  const fonts = await loadOgFonts();
  return new ImageResponse(
    (
      <OgCard
        title="Sharp analysis for uncertain markets"
        badge="Predictions Market Fans"
        badgeColor="#FF00B8"
        metaLeft="Prediction markets"
        metaRight="Forecasting & analysis"
      />
    ),
    { ...ogSize, fonts }
  );
}
