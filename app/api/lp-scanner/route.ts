import { NextRequest, NextResponse } from 'next/server';
import { fetchRewardMarkets, fetchOrderBook } from '@/lib/polymarket';
import type { ScannerMarket } from '@/lib/polymarket';
import { withSharedCache } from '@/lib/scanner-cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CACHE_KEY = 'lp-scanner';

/* ── GET /api/lp-scanner ──────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Order book for a specific token (not cached in the shared layer)
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

  // All reward markets — served from the shared, pre-warmed cache
  try {
    const result = await withSharedCache<ScannerMarket[]>(
      CACHE_KEY,
      fetchRewardMarkets
    );

    return NextResponse.json(
      {
        markets: result.payload,
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
    console.error('LP Scanner fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 502 });
  }
}
