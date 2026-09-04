import { NextResponse } from 'next/server';
import { fetchTrendingMarkets } from '@/lib/trending';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const markets = await fetchTrendingMarkets(5);
    return NextResponse.json({ markets, updatedAt: Date.now() });
  } catch {
    return NextResponse.json({ markets: [], updatedAt: Date.now() });
  }
}
