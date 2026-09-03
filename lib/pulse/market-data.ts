import { fetchTrades, fetchHolders, fetchGammaEvents, fetchLeaderboard } from './polymarket-data';
import { classifyWhalesFromLeaderboard, isWhaleTrade } from './whale-detection';

/**
 * Build market-level whale activity stats from live Polymarket data.
 * Shared by the /api/pulse/market/[conditionId] route and the
 * /pulse/markets/[conditionId] page so pages never self-fetch over HTTP.
 */
export async function fetchMarketStatsData(conditionId: string) {
  // 1. Get market metadata from Gamma
  const events = await fetchGammaEvents({ limit: 100, active: true });
  let marketInfo: { title: string; slug: string; eventSlug: string; volume24hr: number; liquidity: number; category: string } | null = null;

  for (const event of events) {
    for (const market of event.markets ?? []) {
      if (market.conditionId === conditionId) {
        marketInfo = {
          title: market.question ?? event.title,
          slug: market.slug ?? '',
          eventSlug: event.slug ?? '',
          volume24hr: event.volume24hr ?? 0,
          liquidity: market.liquidity ?? 0,
          category: event.category ?? '',
        };
        break;
      }
    }
    if (marketInfo) break;
  }

  // 2. Get whale wallets
  const leaderboard = await fetchLeaderboard({ limit: 50, orderBy: 'PNL' });
  const whaleWallets = classifyWhalesFromLeaderboard(leaderboard);
  const whaleAddresses = new Set(whaleWallets.map((w) => w.address));
  const whaleMap = new Map(whaleWallets.map((w) => [w.address, w]));

  // 3. Get trades for this market
  const trades = await fetchTrades({ market: conditionId, limit: 200 });

  // 4. Get top holders
  const holders = await fetchHolders(conditionId);

  // 5. Identify whale trades
  const whaleTrades = trades
    .map((t) => {
      const { isWhale, score } = isWhaleTrade(t, whaleAddresses, marketInfo?.liquidity);
      const wallet = whaleMap.get(t.proxyWallet);
      return { trade: t, isWhale, score, wallet };
    })
    .filter((x) => x.isWhale);

  // 6. Aggregate stats
  const whaleBuyCount = whaleTrades.filter(
    (x) => x.trade.side === 'BUY'
  ).length;
  const whaleSellCount = whaleTrades.filter(
    (x) => x.trade.side === 'SELL'
  ).length;
  const whaleVolume = whaleTrades.reduce(
    (sum, x) => sum + x.trade.size * x.trade.price,
    0
  );
  const uniqueWhaleWallets = new Set(whaleTrades.map((x) => x.trade.proxyWallet)).size;

  return {
    conditionId,
    marketTitle: marketInfo?.title ?? 'Unknown Market',
    marketSlug: marketInfo?.slug ?? '',
    eventSlug: marketInfo?.eventSlug ?? '',
    category: marketInfo?.category ?? '',
    volume24hr: marketInfo?.volume24hr ?? 0,
    liquidity: marketInfo?.liquidity ?? 0,
    whaleVolume: Math.round(whaleVolume * 100) / 100,
    whaleBuyCount,
    whaleSellCount,
    whaleUnique: uniqueWhaleWallets,
    topHolders: holders,
    whaleTradeDetails: whaleTrades.slice(0, 50).map((x) => ({
      walletAddress: x.trade.proxyWallet,
      walletUsername: x.wallet?.username ?? x.trade.name ?? x.trade.proxyWallet.slice(0, 10),
      walletProfileImage: x.wallet?.profileImage ?? x.trade.profileImage ?? '',
      side: x.trade.side,
      outcome: x.trade.outcome ?? '',
      size: x.trade.size,
      price: x.trade.price,
      usdcSize: Math.round(x.trade.size * x.trade.price * 100) / 100,
      timestamp: x.trade.timestamp,
      txHash: x.trade.transactionHash ?? '',
      anomalyScore: x.score,
    })),
  };
}
