import { NextResponse } from 'next/server';
import {
  fetchKalshiEvents,
  type KalshiEvent,
  type KalshiMarket,
} from '@/lib/kalshi';
import {
  fetchPolymarketEvents,
  findArbitragePairs,
  type ArbitragePair,
} from '@/lib/arbitrage';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Allow up to 30s for Vercel serverless

/* ── In-memory cache ──────────────────────────────────────────────── */

let cachedPairs: ArbitragePair[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

/* ── Bulk fetch Kalshi markets ─────────────────────────────────────── */

const KALSHI_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

async function fetchAllKalshiMarkets(): Promise<Map<string, KalshiMarket[]>> {
  const marketsByEvent = new Map<string, KalshiMarket[]>();
  let cursor: string | undefined;

  // Paginate through ALL open markets in bulk (much faster than per-event)
  for (let page = 0; page < 10; page++) {
    const url = new URL(`${KALSHI_BASE}/markets`);
    url.searchParams.set('limit', '200');
    url.searchParams.set('status', 'open');
    if (cursor) url.searchParams.set('cursor', cursor);

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    });

    if (!res.ok) break;
    const json = await res.json();
    const markets: KalshiMarket[] = json.markets ?? [];

    for (const m of markets) {
      if (!marketsByEvent.has(m.event_ticker)) {
        marketsByEvent.set(m.event_ticker, []);
      }
      marketsByEvent.get(m.event_ticker)!.push(m);
    }

    cursor = json.cursor;
    if (!cursor || markets.length < 200) break;
  }

  return marketsByEvent;
}

/* ── GET /api/arbitrage-scanner ────────────────────────────────────── */

export async function GET() {
  const now = Date.now();

  if (!cachedPairs || now - cacheTimestamp > CACHE_TTL_MS) {
    try {
      // Fetch everything in parallel — 3 requests total instead of 160+
      const [polyEvents, kalshiEvents, kalshiMarketsByEvent] =
        await Promise.all([
          fetchPolymarketEvents(),
          fetchKalshiEvents(),
          fetchAllKalshiMarkets(),
        ]);

      // Filter to non-sports Kalshi events
      const relevantEvents: KalshiEvent[] = kalshiEvents.filter(
        (ev) => ev.category !== 'Sports'
      );

      cachedPairs = findArbitragePairs(
        polyEvents,
        relevantEvents,
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
