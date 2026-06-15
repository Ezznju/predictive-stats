import { NextResponse } from 'next/server';
import { fetchTopKalshiMarkets } from '@/lib/kalshi';
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
      // Fetch from both platforms in parallel
      const [polyEvents, kalshiMarkets] = await Promise.all([
        fetchPolymarketEvents(),
        fetchTopKalshiMarkets(),
      ]);

      cachedPairs = findArbitragePairs(polyEvents, kalshiMarkets);
      cacheTimestamp = now;
    } catch (err) {
      console.error('Arbitrage Scanner fetch error:', err);

      // Serve stale cache if available
      if (cachedPairs) {
        return NextResponse.json({
          pairs: cachedPairs,
          cached: true,
          stale: true,
          updatedAt: new Date(cacheTimestamp).toISOString(),
          polyCount: 0,
          kalshiCount: 0,
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
