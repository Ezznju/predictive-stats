import { NextResponse } from 'next/server';
import { fetchTrades, fetchLeaderboard, fetchGammaEvents } from '@/lib/pulse/polymarket-data';
import { withPulseCache, PULSE_KEYS } from '@/lib/pulse/cache';
import { classifyWhalesFromLeaderboard, scoreWhaleTrade, aggregateWhaleFlow } from '@/lib/pulse/whale-detection';
import type { WhaleFeedItem, AggregatedWhaleCard } from '@/lib/pulse/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

/** Clean wallet username: filter out "0", empty, or numeric-only garbage */
function cleanUsername(name: string | undefined | null, address: string): string {
  const raw = (name ?? '').trim();
  // Reject "0", empty, pure numbers, or very short strings
  if (!raw || raw === '0' || /^\d+$/.test(raw) || raw.length < 2) {
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  }
  return raw;
}

/** Detect if a buy at >95% is capital parking, not a directional signal */
function isParking(side: string, price: number): boolean {
  return side === 'BUY' && price > 0.95;
}

/** Edge room: how much room before $1 payout (in percentage points) */
function edgeRoom(side: string, price: number): number {
  if (side === 'BUY') return Math.max(0, (1 - price) * 100);
  return Math.max(0, price * 100);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);
  const minSize = Number(searchParams.get('minSize') ?? 0);

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

    // 3. Fetch market metadata — include closed/resolved for outcome tracking
    const events = await fetchGammaEvents({
      limit: 50,
      active: true,
      closed: false,
      order: 'volume24hr',
      ascending: false,
    });

    const marketMap = new Map<string, { title: string; slug: string; eventSlug: string; liquidity: number; closed: boolean }>();
    for (const event of events) {
      for (const market of event.markets ?? []) {
        if (market.conditionId) {
          marketMap.set(market.conditionId, {
            title: market.question ?? event.title,
            slug: market.slug ?? '',
            eventSlug: event.slug ?? '',
            liquidity: market.liquidity ?? 0,
            closed: market.closed ?? false,
          });
        }
      }
    }

    // 4. Build feed — skip resolved markets, clean usernames, detect parking
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
    const feed: WhaleFeedItem[] = [];

    // Count trades per wallet (within window) so conviction's sample factor is real
    const tradeCountByWallet = new Map<string, number>();
    for (const r of whaleTrades) {
      if (r.status !== 'fulfilled') continue;
      for (const t of r.value) {
        if (t.timestamp >= sevenDaysAgo) {
          tradeCountByWallet.set(
            t.proxyWallet,
            (tradeCountByWallet.get(t.proxyWallet) ?? 0) + 1
          );
        }
      }
    }

    for (const result of whaleTrades) {
      if (result.status !== 'fulfilled') continue;
      for (const trade of result.value) {
        if (trade.timestamp < sevenDaysAgo) continue;

        // Skip resolved/closed markets
        const marketInfo = marketMap.get(trade.conditionId);
        if (marketInfo?.closed) continue;

        const usdcSize = Math.round(trade.size * trade.price * 100) / 100;
        if (usdcSize < 1000) continue;

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
          trades: Math.max(1, tradeCountByWallet.get(wallet.address) ?? 1),
          winRate: wallet.winRate,
          roi: wallet.pnl / Math.max(1, wallet.volume),
          avgSizeUsd: wallet.volume / Math.max(1, 30),
          sizeStdUsd: wallet.volume / Math.max(1, 30) * 0.5,
          brier: 0.25,
          categoryExpertise: {} as Record<string, number>,
        } : null;

        const conviction = scoreWhaleTrade(convictionInput, walletStats, Date.now());
        const parking = isParking(trade.side, trade.price);

        feed.push({
          walletAddress: trade.proxyWallet,
          walletUsername: cleanUsername(wallet?.username ?? trade.name ?? trade.pseudonym, trade.proxyWallet),
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
          riskFlags: parking ? ['POSITION CLOSE — not a directional signal'] : [],
          isParking: parking,
          edgeRoom: edgeRoom(trade.side, trade.price),
        });
      }
    }

    // Sort by timestamp descending (newest first)
    feed.sort((a, b) => b.timestamp - a.timestamp);

    // Apply min size filter
    const filtered = minSize > 0 ? feed.filter((t) => t.usdcSize >= minSize) : feed;
    const topFeed = filtered.slice(0, limit * 3); // extra for aggregation

    // 5. Aggregate same-wallet-same-market trades into cards
    const aggMap = new Map<string, AggregatedWhaleCard>();
    for (const item of topFeed) {
      const key = `${item.walletAddress}::${item.conditionId}`;
      const existing = aggMap.get(key);

      if (existing) {
        existing.tradeCount++;
        existing.totalUsdcSize += item.usdcSize;
        existing.minPrice = Math.min(existing.minPrice, item.price);
        existing.maxPrice = Math.max(existing.maxPrice, item.price);
        existing.lastTimestamp = Math.min(existing.lastTimestamp, item.timestamp);
        existing.firstTimestamp = Math.max(existing.firstTimestamp, item.timestamp);
        existing.avgConviction = (existing.avgConviction + (item.convictionScore ?? 0)) / 2;
        existing.isParking = existing.isParking || (item.isParking ?? false);
        existing.trades.push(item);
      } else {
        aggMap.set(key, {
          walletAddress: item.walletAddress,
          walletUsername: item.walletUsername,
          walletProfileImage: item.walletProfileImage,
          marketTitle: item.marketTitle,
          marketSlug: item.marketSlug,
          eventSlug: item.eventSlug,
          conditionId: item.conditionId,
          side: item.side,
          tradeCount: 1,
          totalUsdcSize: item.usdcSize,
          avgPrice: item.price,
          minPrice: item.price,
          maxPrice: item.price,
          firstTimestamp: item.timestamp,
          lastTimestamp: item.timestamp,
          avgConviction: item.convictionScore ?? 0,
          isParking: item.isParking ?? false,
          edgeRoom: item.edgeRoom ?? 0,
          isRapidRepeat: false,
          trades: [item],
        });
      }
    }

    // Detect rapid-repeat patterns (3+ trades in 20 min on same market)
    const cardsArray = Array.from(aggMap.values());
    for (const card of cardsArray) {
      if (card.tradeCount >= 3) {
        const timeSpan = card.firstTimestamp - card.lastTimestamp; // first is newest
        if (timeSpan < 20 * 60) { // 20 minutes
          card.isRapidRepeat = true;
        }
      }
      // Compute average price across all trades
      const prices: number[] = card.trades.map((t: WhaleFeedItem) => t.price);
      card.avgPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
    }

    // Sort aggregated cards: total size descending, then by recency
    const cards = cardsArray
      .sort((a: AggregatedWhaleCard, b: AggregatedWhaleCard) => b.totalUsdcSize - a.totalUsdcSize)
      .slice(0, limit);

    // 6. Aggregate whale flow
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
      feed: topFeed.slice(0, limit),
      cards,
      aggregatedFlow: aggregated,
    };
  });

  return NextResponse.json({
    data: result.payload?.feed ?? [],
    cards: result.payload?.cards ?? [],
    aggregatedFlow: result.payload?.aggregatedFlow ?? null,
    meta: {
      updatedAt: result.updatedAt,
      stale: result.stale,
      source: result.source,
    },
  });
}
