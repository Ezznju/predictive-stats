import { NextResponse } from 'next/server';
import { fetchKalshiTrending } from '@/lib/kalshi-trending';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const markets = await fetchKalshiTrending(5);
    return NextResponse.json({ markets, updatedAt: Date.now() });
  } catch {
    return NextResponse.json({ markets: [], updatedAt: Date.now() });
  }
}
