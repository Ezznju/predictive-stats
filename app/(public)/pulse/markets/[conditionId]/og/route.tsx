import { ImageResponse } from 'next/og';
import { ogSize, loadOgFonts, OgCard } from '@/lib/og-template';
import { fetchGammaEvents } from '@/lib/pulse/polymarket-data';

// Edge runtime + custom route (file-convention images 404 in this group).
export const runtime = 'edge';
export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Market Whale Activity';

// Per-isolate cache for the gamma event scan (up to 10 min staleness is fine
// for a share image; the scan itself walks ~100 events).
const cache = new Map<string, { at: number; title: string }>();
const TTL = 10 * 60 * 1000;

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
};

export default async function Image({ params }: { params: { conditionId: string } }) {
  const [fonts] = await Promise.all([loadOgFonts()]);
  const cid = params.conditionId;
  let title = 'Market Whale Activity';

  const hit = cache.get(cid);
  if (hit && Date.now() - hit.at < TTL) {
    title = hit.title;
  } else {
    try {
      const events = await fetchGammaEvents({ limit: 100, active: true });
      outer: for (const event of events) {
        for (const market of event.markets ?? []) {
          if (market.conditionId === cid) {
            title = market.question ?? event.title ?? title;
            break outer;
          }
        }
      }
    } catch {
      // fallback title
    }
    cache.set(cid, { at: Date.now(), title });
  }

  return new ImageResponse(
    (
      <OgCard
        title={title}
        badge="WHALE ACTIVITY"
        badgeColor="#FF00B8"
        metaLeft="Polymarket Whale Tracker"
        metaRight="Real-time whale trades"
      />
    ),
    { ...ogSize, fonts, headers: CACHE_HEADERS }
  );
}
