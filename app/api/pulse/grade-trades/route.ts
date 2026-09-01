import { NextResponse } from 'next/server';
import { gradeMarketTrades } from '@/lib/pulse/outcome';
import { getPulseWhaleTrades } from '@/lib/db';
import { fetchTrades } from '@/lib/pulse/polymarket-data';

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
    let formatted: Array<{ walletAddress: string; conditionId: string; side: 'BUY' | 'SELL'; outcome: string; entryPrice: number; usdcSize: number }>;
    let tradeCount = 0;
    const stored = await getPulseWhaleTrades(conditionId);
    if (stored && stored.length > 0) {
      formatted = stored.map((t: any) => ({
        walletAddress: t.wallet_address,
        conditionId: t.condition_id,
        side: t.side as 'BUY' | 'SELL',
        outcome: t.outcome ?? 'YES',
        entryPrice: Number(t.price),
        usdcSize: Number(t.usdc_size ?? 0),
      }));
      tradeCount = stored.length;
    } else {
      // Fallback: live fetch from Polymarket Data API when D1 is empty (no ingestion yet)
      const live = await fetchTrades({ market: conditionId, limit: 200 });
      if (!live || live.length === 0) {
        return NextResponse.json({ data: [], walletStats: {}, message: 'No whale trades found for this market (D1 empty and live API returned 0)' });
      }
      formatted = live.map((t) => ({
        walletAddress: t.proxyWallet,
        conditionId: t.conditionId,
        side: t.side as 'BUY' | 'SELL',
        outcome: t.outcome ?? 'YES',
        entryPrice: Number(t.price),
        usdcSize: Math.round(Number(t.size) * Number(t.price) * 100) / 100,
      }));
      tradeCount = live.length;
    }
    const result = gradeMarketTrades(formatted, resolution);
    return NextResponse.json({ conditionId, resolution, tradeCount, graded: result.graded, walletStats: result.walletStats, source: stored && stored.length > 0 ? 'd1' : 'live' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
