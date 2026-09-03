import { fetchTrades, fetchWalletProfile } from './polymarket-data';
import { computeAllScores } from './scoring';

/**
 * Build a whale wallet profile from live Polymarket data.
 * Shared by the /api/pulse/wallet/[address] route and the
 * /pulse/wallets/[address] page so pages never self-fetch over HTTP.
 * Returns null for invalid addresses or empty wallets.
 */
export async function fetchWalletProfileData(address: string) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return null;

  const [profile, trades] = await Promise.all([
    fetchWalletProfile(address),
    fetchTrades({ user: address, limit: 200 }),
  ]);

  // Compute basic stats
  const totalVolume = trades.reduce((sum, t) => sum + t.size * t.price, 0);
  const tradeCount = trades.length;
  const uniqueMarkets = new Set(trades.map((t) => t.conditionId)).size;

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
}
