import { NextResponse } from 'next/server';
import { fetchTrades, fetchLeaderboard, fetchGammaEvents } from '@/lib/pulse/polymarket-data';
import { withPulseCache, PULSE_KEYS } from '@/lib/pulse/cache';
import { classifyWhalesFromLeaderboard } from '@/lib/pulse/whale-detection';
import type { WhaleFeedItem } from '@/lib/pulse/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);

  const result = await withPulseCache(PULSE_KEYS.whaleFeed(), async () => {
    // 1. Get top whale wallets from leaderboard
    const leaderboard = await fetchLeaderboard({ limit: 25, orderBy: 'PNL' });
    const whaleWallets = classifyWhalesFromLeaderboard(leaderboard);
    const whaleMap = new Map(whaleWallets.map((w) => [w.address, w]));

    // 2. Fetch recent trades FROM whale wallets (not from markets)
    //    This guarantees we find actual whale activity
    const topWhales = whaleWallets.slice(0, 10);
    const whaleTrades = await Promise.allSettled(
      topWhales.map((w) => fetchTrades({ user: w.address, limit: 10 }))
    );

    // 3. Collect all unique condition IDs from whale trades
    const conditionIds = new Set<string>();
    for (const result of whaleTrades) {
      if (result.status !== 'fulfilled') continue;
      for (const trade of result.value) {
        conditionIds.add(trade.conditionId);
      }
    }

    // 4. Fetch market metadata for these condition IDs
    const events = await fetchGammaEvents({
      limit: 50,
      active: true,
      closed: false,
      order: 'volume24hr',
      ascending: false,
    });

    const marketMap = new Map<string, { title: string; slug: string; eventSlug: string; liquidity: number }>();
    for (const event of events) {
      for (const market of event.markets ?? []) {
        if (market.conditionId) {
          marketMap.set(market.conditionId, {
            title: market.question ?? event.title,
            slug: market.slug ?? '',
            eventSlug: event.slug ?? '',
            liquidity: market.liquidity ?? 0,
          });
        }
      }
    }

    // 5. Build feed from whale trades (all trades from whales qualify)
    const feed: WhaleFeedItem[] = [];

    for (const result of whaleTrades) {
      if (result.status !== 'fulfilled') continue;
      for (const trade of result.value) {
        const usdcSize = Math.round(trade.size * trade.price * 100) / 100;
        if (usdcSize < 1000) continue; // Only show $1K+ trades

        const marketInfo = marketMap.get(trade.conditionId);
        const wallet = whaleMap.get(trade.proxyWallet);

        // Anomaly score based on trade size
        let score = 0;
        if (usdcSize >= 10000) score += 0.3;
        if (usdcSize >= 50000) score += 0.3;
        if (usdcSize >= 100000) score += 0.2;
        if (wallet && wallet.pnl > 1000000) score += 0.2;

        feed.push({
          walletAddress: trade.proxyWallet,
          walletUsername: wallet?.username ?? trade.name ?? trade.pseudonym ?? trade.proxyWallet.slice(0, 10),
          walletProfileImage: wallet?.profileImage ?? trade.profileImage ?? '',
          side: trade.side,
          outcome: trade.outcome ?? '',
          size: trade.size,
          price: trade.price,
          usdcSize,
          marketTitle: marketInfo?.title ?? trade.title ?? '',
          marketSlug: marketInfo?.slug ?? trade.slug ?? '',
          eventSlug: marketInfo?.eventSlug ?? trade.eventSlug ?? '',
          conditionId: trade.conditionId,
          timestamp: trade.timestamp,
          txHash: trade.transactionHash ?? '',
          anomalyScore: Math.min(score, 1),
        });
      }
    }

    // Sort by timestamp descending, take top N
    feed.sort((a, b) => b.timestamp - a.timestamp);
    return feed.slice(0, limit);
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
