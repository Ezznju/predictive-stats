import { NextRequest, NextResponse } from 'next/server';
import { fetchRewardMarkets, fetchOrderBook } from '@/lib/polymarket';
import type { ScannerMarket } from '@/lib/polymarket';

export const dynamic = 'force-dynamic';

/* ── In-memory cache (survives across requests in the same serverless instance) ── */

let cachedMarkets: ScannerMarket[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/* ── GET /api/lp-scanner ──────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // If requesting order book for a specific token
  const tokenId = searchParams.get('book');
  if (tokenId) {
    const book = await fetchOrderBook(tokenId);
    if (!book) {
      return NextResponse.json({ error: 'Failed to fetch order book' }, { status: 502 });
    }
    return NextResponse.json(book, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  }

  // Otherwise return all reward markets
  const now = Date.now();
  if (!cachedMarkets || now - cacheTimestamp > CACHE_TTL_MS) {
    try {
      cachedMarkets = await fetchRewardMarkets();
      cacheTimestamp = now;
    } catch (err) {
      console.error('LP Scanner fetch error:', err);
      // Serve stale cache if available
      if (cachedMarkets) {
        return NextResponse.json({
          markets: cachedMarkets,
          cached: true,
          stale: true,
          updatedAt: new Date(cacheTimestamp).toISOString(),
        });
      }
      return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 502 });
    }
  }

  return NextResponse.json(
    {
      markets: cachedMarkets,
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
