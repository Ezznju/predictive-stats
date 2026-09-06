import { NextResponse } from 'next/server';
import { fetchKalshiSmartMoney } from '@/lib/kalshi-smart-money';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    const board = await fetchKalshiSmartMoney(10);
    return NextResponse.json(board, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300' },
    });
  } catch {
    return NextResponse.json(
      { bigMoney: [], momentum: [], decisionWeek: [], updatedAt: new Date().toISOString() },
      { status: 200 }
    );
  }
}
