import { NextResponse } from 'next/server';
import {
  fetchKalshiEvents,
  fetchKalshiMarketsForEvent,
  type KalshiMarket,
} from '@/lib/kalshi';
import {
  fetchPolymarketEvents,
  findArbitragePairs,
  type ArbitragePair,
} from '@/lib/arbitrage';

export const dynamic = 'force-dynamic';

/* ── In-memory cache ──────────────────────────────────────────────── */

let cachedPairs: ArbitragePair[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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

      // Step 2: For Kalshi events that could match Polymarket events,
      // fetch their individual markets. We'll fetch markets for all
      // non-sports Kalshi events (sports events rarely overlap).
      const relevantKalshiEvents = kalshiEvents.filter(
        (ev) => ev.category !== 'Sports'
      );

      // Batch fetch Kalshi markets (max 30 concurrent to be nice)
      const kalshiMarketsByEvent = new Map<string, KalshiMarket[]>();
      const batchSize = 20;

      for (let i = 0; i < relevantKalshiEvents.length; i += batchSize) {
        const batch = relevantKalshiEvents.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map((ev) => fetchKalshiMarketsForEvent(ev.event_ticker))
        );
        for (let j = 0; j < batch.length; j++) {
          if (results[j].length > 0) {
            kalshiMarketsByEvent.set(batch[j].event_ticker, results[j]);
          }
        }
      }

      cachedPairs = findArbitragePairs(
        polyEvents,
        relevantKalshiEvents,
        kalshiMarketsByEvent
      );
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
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    }
  );
}
