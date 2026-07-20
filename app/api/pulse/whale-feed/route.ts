import { NextResponse } from 'next/server';
import { fetchTrades, fetchLeaderboard, fetchGammaEvents } from '@/lib/pulse/polymarket-data';
import { withPulseCache, PULSE_KEYS } from '@/lib/pulse/cache';
import { classifyWhalesFromLeaderboard, scoreWhaleTrade, aggregateWhaleFlow } from '@/lib/pulse/whale-detection';
import type { WhaleFeedItem } from '@/lib/pulse/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);

  const result = await withPulseCache(PULSE_KEYS.whaleFeed(), async () => {
    // 1. Get most ACTIVE wallets (by volume, last 30 days)
    const leaderboard = await fetchLeaderboard({ limit: 25, orderBy: 'VOL', timePeriod: 'MONTH' });
    const whaleWallets = classifyWhalesFromLeaderboard(leaderboard);
    const whaleMap = new Map(whaleWallets.map((w) => [w.address, w]));

    // 2. Fetch recent trades FROM active wallets
    const topWhales = whaleWallets.slice(0, 15);
    const whaleTrades = await Promise.allSettled(
      topWhales.map((w) => fetchTrades({ user: w.address, limit: 15 }))
    );

    // 3. Fetch market metadata
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

    // 4. Build feed with conviction scoring
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
    const feed: WhaleFeedItem[] = [];

    for (const result of whaleTrades) {
      if (result.status !== 'fulfilled') continue;
      for (const trade of result.value) {
        if (trade.timestamp < sevenDaysAgo) continue;

        const usdcSize = Math.round(trade.size * trade.price * 100) / 100;
        if (usdcSize < 1000) continue;

        const marketInfo = marketMap.get(trade.conditionId);
        const wallet = whaleMap.get(trade.proxyWallet);

        // Score using conviction engine
        const convictionInput = {
          wallet: trade.proxyWallet,
          marketId: trade.conditionId,
          marketTitle: marketInfo?.title ?? trade.title ?? '',
          category: 'POLITICS',
          side: trade.side,
          outcome: trade.outcome ?? '',
          sizeUsd: usdcSize,
          liquidityUsd: marketInfo?.liquidity ?? 50000,
          timestamp: new Date(trade.timestamp * 1000).toISOString(),
        };

        const walletStats = wallet ? {
          address: wallet.address,
          trades: 0,
          winRate: wallet.winRate,
          roi: wallet.pnl / Math.max(1, wallet.volume),
          avgSizeUsd: wallet.volume / Math.max(1, 30),
          sizeStdUsd: wallet.volume / Math.max(1, 30) * 0.5,
          brier: 0.25,
          categoryExpertise: {} as Record<string, number>,
        } : null;

        const conviction = scoreWhaleTrade(convictionInput, walletStats, Date.now());

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
          anomalyScore: conviction.conviction,
          convictionScore: conviction.conviction,
          convictionParts: {
            sizeZ: conviction.sizeScore,
            walletSkill: conviction.walletSkill,
            categoryExpertise: 0.45,
            liquidityFactor: 0.5,
            recencyDecay: conviction.recencyScore,
            confidence: conviction.conviction,
            compositeScore: conviction.conviction,
            riskFlags: [],
          },
          riskFlags: [],
        });
      }
    }

    feed.sort((a, b) => (b.convictionScore ?? 0) - (a.convictionScore ?? 0));
    const topFeed = feed.slice(0, limit);

    // 5. Aggregate whale flow
    const aggregatedInput = topFeed.map((item) => ({
      wallet: item.walletAddress,
      marketId: item.conditionId,
      marketTitle: item.marketTitle,
      category: 'POLITICS',
      side: item.side as 'BUY' | 'SELL',
      outcome: item.outcome,
      sizeUsd: item.usdcSize,
      liquidityUsd: 50000,
      timestamp: new Date(item.timestamp * 1000).toISOString(),
    }));

    const statsMap = new Map();
    for (const w of whaleWallets) {
      statsMap.set(w.address, {
        address: w.address,
        trades: 0,
        winRate: w.winRate,
        roi: w.pnl / Math.max(1, w.volume),
        avgSizeUsd: w.volume / Math.max(1, 30),
        sizeStdUsd: w.volume / Math.max(1, 30) * 0.5,
        brier: 0.25,
        categoryExpertise: {} as Record<string, number>,
      });
    }

    const aggregated = aggregateWhaleFlow(aggregatedInput, statsMap, Date.now());

    return {
      feed: topFeed,
      aggregatedFlow: aggregated,
    };
  });

  return NextResponse.json({
    data: result.payload?.feed ?? [],
    aggregatedFlow: result.payload?.aggregatedFlow ?? null,
    meta: {
      updatedAt: result.updatedAt,
      stale: result.stale,
      source: result.source,
    },
  });
}
