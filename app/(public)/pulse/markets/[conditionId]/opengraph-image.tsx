import { ImageResponse } from 'next/og';
import { ogSize, loadOgFonts, OgCard } from '@/lib/og-template';
import { fetchGammaEvents } from '@/lib/pulse/polymarket-data';

export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Market Whale Activity';

export default async function Image({ params }: { params: { conditionId: string } }) {
  const fonts = await loadOgFonts();
  let title = 'Market Whale Activity';

  try {
    const events = await fetchGammaEvents({ limit: 100, active: true });
    for (const event of events) {
      for (const market of event.markets ?? []) {
        if (market.conditionId === params.conditionId) {
          title = market.question ?? event.title ?? title;
          break;
        }
      }
    }
  } catch {
    // Fallback to default title
  }

  return new ImageResponse(
    (
      <OgCard
        title={title}
        badge="WHALE ACTIVITY"
        badgeColor="#FF00B8"
        metaLeft="Prediction Pulse"
        metaRight="Real-time whale trades"
      />
    ),
    { ...ogSize, fonts }
  );
}
