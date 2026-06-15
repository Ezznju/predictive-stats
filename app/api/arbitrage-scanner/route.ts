import { NextResponse } from 'next/server';
import {
  fetchKalshiEvents,
  fetchKalshiMarketsForEvent,
  type KalshiMarket,
} from '@/lib/kalshi';
import {
  fetchPolymarketEvents,
  findArbitragePairs,
  preMatchEvents,
  type ArbitragePair,
} from '@/lib/arbitrage';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/* ── In-memory cache ──────────────────────────────────────────────── */

let cachedPairs: ArbitragePair[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

/* ── GET /api/arbitrage-scanner ────────────────────────────────────── */

export async function GET() {
  const now = Date.now();

  if (!cachedPairs || now - cacheTimestamp > CACHE_TTL_MS) {
    try {
      // Step 1: Fetch events from both platforms in parallel
      const [polyEvents, kalshiEvents] = await Promise.all([
        fetchPolymarketEvents(),
        fetchKalshiEvents(),
      ]);

      // Step 2: Pre-match events by title similarity to avoid
      // fetching markets for every Kalshi event (saves 150+ API calls)
      const relevantKalshiEvents = kalshiEvents.filter(
        (ev) => ev.category !== 'Sports'
      );
      const matchedTickers = preMatchEvents(polyEvents, relevantKalshiEvents);

      // Step 3: Only fetch markets for matched Kalshi events
      const kalshiMarketsByEvent = new Map<string, KalshiMarket[]>();
      const eventsToFetch = relevantKalshiEvents.filter((ev) =>
        matchedTickers.has(ev.event_ticker)
      );

      // Batch fetch (20 concurrent)
      const batchSize = 20;
      for (let i = 0; i < eventsToFetch.length; i += batchSize) {
        const batch = eventsToFetch.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map((ev) => fetchKalshiMarketsForEvent(ev.event_ticker))
        );
        for (let j = 0; j < batch.length; j++) {
          if (results[j].length > 0) {
            kalshiMarketsByEvent.set(batch[j].event_ticker, results[j]);
          }
        }
      }

      const totalKalshiMarkets = Array.from(
        kalshiMarketsByEvent.values()
      ).reduce((s, v) => s + v.length, 0);

      cachedPairs = findArbitragePairs(
        polyEvents,
        relevantKalshiEvents,
        kalshiMarketsByEvent
      );

      // Store debug stats alongside cache
      (globalThis as Record<string, unknown>).__arbDebug = {
        polyEvents: polyEvents.length,
        kalshiEvents: relevantKalshiEvents.length,
        matchedTickers: matchedTickers.size,
        kalshiEventsWithMarkets: kalshiMarketsByEvent.size,
        totalKalshiMarkets,
        pairsFound: cachedPairs.length,
      };

      cacheTimestamp = now;
    } catch (err) {
      console.error('Arbitrage Scanner fetch error:', err);

      if (cachedPairs) {
        return NextResponse.json({
          pairs: cachedPairs,
          cached: true,
          stale: true,
          updatedAt: new Date(cacheTimestamp).toISOString(),
        });
      }
      return NextResponse.json(
        { error: 'Failed to fetch market data' },
        { status: 502 }
      );
    }
  }

  return NextResponse.json(
    {
      pairs: cachedPairs,
      cached: now - cacheTimestamp > 0,
      updatedAt: new Date(cacheTimestamp).toISOString(),
      debug:
        (globalThis as Record<string, unknown>).__arbDebug ?? null,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    }
  );
}
