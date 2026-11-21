import { NextResponse } from 'next/server';
import { fetchTrendingMarkets } from '@/lib/trending';
export const runtime = 'edge';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const markets = await fetchTrendingMarkets(5);
    return NextResponse.json(
      { markets, updatedAt: Date.now() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { markets: [], updatedAt: Date.now() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60',
        },
      }
    );
  }
}
