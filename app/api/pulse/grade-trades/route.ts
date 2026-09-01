import { NextResponse } from 'next/server';
import { gradeMarketTrades } from '@/lib/pulse/outcome';
import { getPulseWhaleTrades } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { conditionId, resolution } = body as { conditionId?: string; resolution?: string };
    if (!conditionId || typeof conditionId !== 'string') {
      return NextResponse.json({ error: 'conditionId is required' }, { status: 400 });
    }
    if (resolution !== 'YES' && resolution !== 'NO') {
      return NextResponse.json({ error: 'resolution must be YES or NO' }, { status: 400 });
    }
    const trades = await getPulseWhaleTrades(conditionId);
    if (!trades || trades.length === 0) {
      return NextResponse.json({ data: [], walletStats: {}, message: 'No whale trades found for this market' });
    }
    const formatted = trades.map((t: any) => ({
      walletAddress: t.wallet_address,
      conditionId: t.condition_id,
      side: t.side as 'BUY' | 'SELL',
      outcome: t.outcome ?? 'YES',
      entryPrice: Number(t.price),
      usdcSize: Number(t.usdc_size ?? 0),
    }));
    const result = gradeMarketTrades(formatted, resolution);
    return NextResponse.json({ conditionId, resolution, tradeCount: trades.length, graded: result.graded, walletStats: result.walletStats });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
