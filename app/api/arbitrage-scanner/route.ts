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
import { withSharedCache } from '@/lib/scanner-cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const CACHE_KEY = 'arbitrage-scanner';

/* ── Heavy scan: Polymarket × Kalshi cross-platform arbitrage ──────── */

async function scanArbitrage(): Promise<ArbitragePair[]> {
  // Step 1: fetch events from both platforms in parallel
  const [polyEvents, kalshiEvents] = await Promise.all([
    fetchPolymarketEvents(),
    fetchKalshiEvents(),
  ]);

  // Step 2: pre-match events by title similarity so we only fetch markets
  // for events that plausibly match (saves 150+ API calls)
  const relevantKalshiEvents = kalshiEvents.filter(
    (ev) => ev.category !== 'Sports'
  );
  const matchedTickers = preMatchEvents(polyEvents, relevantKalshiEvents);

  // Step 3: fetch markets only for matched Kalshi events (batched)
  const kalshiMarketsByEvent = new Map<string, KalshiMarket[]>();
  const eventsToFetch = relevantKalshiEvents.filter((ev) =>
    matchedTickers.has(ev.event_ticker)
  );

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

  return findArbitragePairs(
    polyEvents,
    relevantKalshiEvents,
    kalshiMarketsByEvent
  );
}

/* ── GET /api/arbitrage-scanner ────────────────────────────────────── */

export async function GET() {
  try {
    const result = await withSharedCache<ArbitragePair[]>(
      CACHE_KEY,
      scanArbitrage
    );

    return NextResponse.json(
      {
        pairs: result.payload,
        cached: result.source !== 'fresh',
        stale: result.stale,
        updatedAt: result.updatedAt,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      }
    );
  } catch (err) {
    console.error('Arbitrage Scanner fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 502 }
    );
  }
}
