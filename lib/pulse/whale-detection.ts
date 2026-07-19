/**
 * Whale detection engine.
 *
 * Identifies whale wallets from the Polymarket leaderboard and
 * classifies trades as whale-sized based on multiple factors:
 *  - Absolute USD size
 *  - Percentage of market liquidity
 *  - Percentage of market open interest
 *  - Adaptive threshold based on market volume
 */

import type { LeaderboardEntry, Trade, WhaleWallet } from './types';

/* ── Constants ───────────────────────────────────────────── */

/** Minimum absolute trade size to consider whale-worthy (USD). */
const MIN_WHALE_SIZE_USD = 1000;

/** Top N leaderboard wallets to track. */
const TOP_WHALE_RANKS = 50;

/* ── Whale wallet classification ─────────────────────────── */

/**
 * Build a whale watchlist from the leaderboard.
 * Returns the top N wallets ranked by PNL or volume.
 */
export function classifyWhalesFromLeaderboard(
  entries: LeaderboardEntry[]
): WhaleWallet[] {
  return entries.slice(0, TOP_WHALE_RANKS).map((entry) => ({
    address: entry.proxyWallet,
    username: entry.userName || entry.pseudonym || entry.proxyWallet.slice(0, 10),
    bio: entry.bio ?? '',
    profileImage: entry.profileImage ?? '',
    xUsername: entry.xUsername ?? '',
    rank: parseInt(entry.rank, 10) || 0,
    pnl: entry.pnl ?? 0,
    volume: entry.vol ?? 0,
    winRate: 0,
    tradeCount: 0,
    isSmart: (entry.pnl ?? 0) > 0 && (entry.vol ?? 0) > 100000,
  }));
}

/**
 * Check if a trade is whale-sized.
 *
 * A trade is considered whale if it exceeds:
 *  1. The absolute minimum threshold ($1K)
 *  2. OR > 1% of the market's liquidity
 *  3. OR the wallet is a known whale (in our watchlist)
 */
export function isWhaleTrade(
  trade: Trade,
  knownWhales: Set<string>,
  marketLiquidity?: number
): { isWhale: boolean; score: number } {
  const usdcSize = trade.size * trade.price;
  const isKnownWhale = knownWhales.has(trade.proxyWallet);
  const exceedsMinimum = usdcSize >= MIN_WHALE_SIZE_USD;

  let liquidityScore = 0;
  if (marketLiquidity && marketLiquidity > 0) {
    liquidityScore = usdcSize / marketLiquidity;
  }

  const isWhale = isKnownWhale || exceedsMinimum || liquidityScore > 0.01;

  // Anomaly score: 0-1, higher = more unusual
  let score = 0;
  if (isKnownWhale) score += 0.3;
  if (usdcSize >= 10000) score += 0.2;
  if (usdcSize >= 50000) score += 0.2;
  if (usdcSize >= 100000) score += 0.15;
  if (liquidityScore > 0.05) score += 0.15;

  return { isWhale, score: Math.min(score, 1) };
}

/**
 * Compute adaptive threshold based on market volume.
 * Higher volume markets get a higher whale threshold.
 */
export function adaptiveThreshold(volume24hr: number): number {
  if (volume24hr <= 0) return MIN_WHALE_SIZE_USD;
  const base = Math.sqrt(volume24hr) * 0.1;
  return Math.max(MIN_WHALE_SIZE_USD, Math.min(base, 100000));
}
