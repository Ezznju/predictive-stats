import { NextResponse } from 'next/server';
import { fetchTrades, fetchGammaEvents } from '@/lib/pulse/polymarket-data';
import { withPulseCache, PULSE_KEYS } from '@/lib/pulse/cache';
import { classifyWhalesFromLeaderboard, isWhaleTrade } from '@/lib/pulse/whale-detection';
import { fetchLeaderboard } from '@/lib/pulse/polymarket-data';
import type { WhaleFeedItem } from '@/lib/pulse/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);

  const result = await withPulseCache(PULSE_KEYS.whaleFeed(), async () => {
    // 1. Get top whale wallets
    const leaderboard = await fetchLeaderboard({ limit: 50, orderBy: 'PNL' });
    const whaleWallets = classifyWhalesFromLeaderboard(leaderboard);
    const whaleAddresses = new Set(whaleWallets.map((w) => w.address));
    const whaleMap = new Map(whaleWallets.map((w) => [w.address, w]));

    // 2. Get top events by volume for market metadata
    const events = await fetchGammaEvents({
      limit: 30,
      active: true,
      closed: false,
      order: 'volume24hr',
      ascending: false,
    });

    // Build conditionId -> market info map
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

    // 3. Fetch recent trades for top markets
    const topConditionIds = Array.from(marketMap.keys()).slice(0, 20);
    const allTrades = await Promise.allSettled(
      topConditionIds.map((cid) =>
        fetchTrades({ market: cid, limit: 20 })
      )
    );

    const feed: WhaleFeedItem[] = [];

    for (const result of allTrades) {
      if (result.status !== 'fulfilled') continue;
      for (const trade of result.value) {
        const marketInfo = marketMap.get(trade.conditionId);
        const { isWhale, score } = isWhaleTrade(
          trade,
          whaleAddresses,
          marketInfo?.liquidity
        );

        if (!isWhale) continue;

        const wallet = whaleMap.get(trade.proxyWallet);

        feed.push({
          walletAddress: trade.proxyWallet,
          walletUsername: wallet?.username ?? trade.name ?? trade.pseudonym ?? trade.proxyWallet.slice(0, 10),
          walletProfileImage: wallet?.profileImage ?? trade.profileImage ?? '',
          side: trade.side,
          outcome: trade.outcome ?? '',
          size: trade.size,
          price: trade.price,
          usdcSize: Math.round(trade.size * trade.price * 100) / 100,
          marketTitle: marketInfo?.title ?? trade.title ?? '',
          marketSlug: marketInfo?.slug ?? trade.slug ?? '',
          eventSlug: marketInfo?.eventSlug ?? trade.eventSlug ?? '',
          conditionId: trade.conditionId,
          timestamp: trade.timestamp,
          txHash: trade.transactionHash ?? '',
          anomalyScore: score,
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
