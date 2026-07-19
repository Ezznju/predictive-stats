import { NextResponse } from 'next/server';
import { fetchTrades, fetchWalletProfile } from '@/lib/pulse/polymarket-data';
import { withPulseCache, PULSE_KEYS } from '@/lib/pulse/cache';
import { computeAllScores } from '@/lib/pulse/scoring';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { address: string } }
) {
  const address = params.address;

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  const result = await withPulseCache(PULSE_KEYS.walletProfile(address), async () => {
    const [profile, trades] = await Promise.all([
      fetchWalletProfile(address),
      fetchTrades({ user: address, limit: 200 }),
    ]);

    // Compute basic stats
    const totalVolume = trades.reduce((sum, t) => sum + t.size * t.price, 0);
    const tradeCount = trades.length;
    const uniqueMarkets = new Set(trades.map((t) => t.conditionId)).size;

    // Group trades by market
    const tradesByMarket = new Map<string, typeof trades>();
    for (const trade of trades) {
      const existing = tradesByMarket.get(trade.conditionId) ?? [];
      existing.push(trade);
      tradesByMarket.set(trade.conditionId, existing);
    }

    // Compute scores
    const buyTrades = trades.filter((t) => t.side === 'BUY');
    const sellTrades = trades.filter((t) => t.side === 'SELL');
    const sizes = trades.map((t) => t.size * t.price);
    const timestamps = trades.map((t) => t.timestamp).sort();

    const scores = computeAllScores({
      wonCount: 0,
      lostCount: 0,
      totalInvested: buyTrades.reduce((sum, t) => sum + t.size * t.price, 0),
      totalReturned: sellTrades.reduce((sum, t) => sum + t.size * t.price, 0),
      tradeTimestamps: timestamps,
      tradeSizes: sizes,
      uniqueMarkets,
      totalVolume,
    });

    return {
      address,
      username: profile?.username ?? address.slice(0, 10),
      bio: profile?.bio ?? '',
      profileImage: profile?.profileImage ?? '',
      xUsername: profile?.xUsername ?? '',
      totalVolume,
      tradeCount,
      uniqueMarkets,
      buyCount: buyTrades.length,
      sellCount: sellTrades.length,
      avgPositionSize: scores.avgPositionSize,
      scores,
      recentTrades: trades.slice(0, 50),
    };
  });

  return NextResponse.json({
    data: result.payload,
    meta: {
      updatedAt: result.updatedAt,
      stale: result.stale,
      source: result.source,
    },
  });
}
