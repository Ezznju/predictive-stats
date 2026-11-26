import {
  fetchTrades,
  fetchWalletProfile,
  fetchWalletPositions,
  fetchWalletClosedPositions,
} from './polymarket-data';
import { computeAllScores } from './scoring';

/**
 * Build a whale wallet profile from live Polymarket Data API endpoints:
 * combines profile metadata, recent trades, open positions (unrealized PnL),
 * and closed positions (real realized PnL & true won/lost market counts).
 */
export async function fetchWalletProfileData(address: string) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return null;

  const [profile, trades, openPositions, closedPositions] = await Promise.all([
    fetchWalletProfile(address).catch(() => null),
    fetchTrades({ user: address, limit: 200 }).catch(() => []),
    fetchWalletPositions(address, 100),
    fetchWalletClosedPositions(address, 100),
  ]);

  // Basic trade volume & activity stats
  const totalVolume = trades.reduce((sum, t) => sum + t.size * t.price, 0);
  const tradeCount = trades.length;
  const uniqueMarkets = new Set([
    ...trades.map((t) => t.conditionId),
    ...openPositions.map((p) => p.conditionId ?? '').filter(Boolean),
    ...closedPositions.map((p) => p.conditionId ?? '').filter(Boolean),
  ]).size;

  const buyTrades = trades.filter((t) => t.side === 'BUY');
  const sellTrades = trades.filter((t) => t.side === 'SELL');
  const sizes = trades.map((t) => t.size * t.price);
  const timestamps = trades.map((t) => t.timestamp).sort((a, b) => a - b);

  // True on-chain Won / Lost counts & Realized + Unrealized PnL
  let wonCount = 0;
  let lostCount = 0;
  let realizedPnl = 0;
  let closedInvested = 0;

  for (const pos of closedPositions) {
    const rp = Number(pos.realizedPnl ?? 0);
    realizedPnl += rp;
    const bought = Number(pos.totalBought ?? pos.initialValue ?? 0);
    closedInvested += bought;
    if (rp > 1) wonCount++;
    else if (rp < -1) lostCount++;
  }

  let unrealizedPnl = 0;
  let openInvested = 0;
  let openValue = 0;
  for (const pos of openPositions) {
    const init = Number(pos.initialValue ?? 0);
    const cur = Number(pos.currentValue ?? 0);
    const cp = Number(pos.cashPnl ?? (cur - init));
    openInvested += init;
    openValue += cur;
    unrealizedPnl += cp;
    // Count redeemable winning positions that haven't moved to closed-positions yet
    if (pos.redeemable && cp > 1) wonCount++;
  }

  const totalPnl = realizedPnl + unrealizedPnl;
  const positionInvested = closedInvested + openInvested;
  const fallbackInvested = buyTrades.reduce((sum, t) => sum + t.size * t.price, 0);
  const totalInvested = positionInvested > 0 ? positionInvested : fallbackInvested;
  const totalReturned =
    positionInvested > 0
      ? Math.max(0, totalInvested + totalPnl)
      : sellTrades.reduce((sum, t) => sum + t.size * t.price, 0);

  const scores = computeAllScores({
    wonCount,
    lostCount,
    totalInvested,
    totalReturned,
    tradeTimestamps: timestamps,
    tradeSizes: sizes,
    uniqueMarkets,
    totalVolume: Math.max(totalVolume, positionInvested),
  });

  const topOpenPositions = openPositions
    .filter((p) => Number(p.currentValue ?? 0) >= 10)
    .sort((a, b) => Number(b.currentValue ?? 0) - Number(a.currentValue ?? 0))
    .slice(0, 10)
    .map((p) => ({
      title: String(p.title ?? 'Market position'),
      outcome: String(p.outcome ?? ''),
      size: Number(p.size ?? 0),
      avgPrice: Number(p.avgPrice ?? 0),
      curPrice: Number(p.curPrice ?? 0),
      currentValue: Number(p.currentValue ?? 0),
      cashPnl: Number(p.cashPnl ?? 0),
    }));

  return {
    address,
    username: profile?.username || address.slice(0, 10),
    bio: profile?.bio ?? '',
    profileImage: profile?.profileImage ?? '',
    xUsername: profile?.xUsername ?? '',
    totalVolume: Math.max(totalVolume, positionInvested),
    tradeCount,
    uniqueMarkets,
    buyCount: buyTrades.length,
    sellCount: sellTrades.length,
    wonCount,
    lostCount,
    realizedPnl,
    unrealizedPnl,
    totalPnl,
    openValue,
    openPositions: topOpenPositions,
    avgPositionSize: scores.avgPositionSize,
    scores,
    recentTrades: trades.slice(0, 50),
  };
}
