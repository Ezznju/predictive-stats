/**
 * Whale detection engine with conviction scoring.
 *
 * Identifies whale wallets from the Polymarket leaderboard and
 * classifies trades using multi-factor conviction scoring:
 *  - Size z-score (how unusual is this trade for this wallet?)
 *  - Wallet skill (win rate, ROI, Brier calibration)
 *  - Category expertise (does this wallet trade this type of market?)
 *  - Liquidity factor (market depth)
 *  - Recency decay (half-life based)
 *
 * Based on the Golden Professor Engine Pulse model.
 */

import { clamp, sigmoid } from '../intel';
import type { LeaderboardEntry, Trade, WhaleWallet } from './types';

/* ── Constants ───────────────────────────────────────────────────── */

/** Minimum absolute trade size to consider whale-worthy (USD). */
const MIN_WHALE_SIZE_USD = 1000;

/** Top N leaderboard wallets to track. */
const TOP_WHALE_RANKS = 50;

/** Half-life for recency decay in milliseconds (8 hours). */
const RECENCY_HALF_LIFE_MS = 8 * 3600000;

/* ── Types ───────────────────────────────────────────────────────── */

export interface WalletStats {
  address: string;
  trades: number;
  winRate: number;
  roi: number;
  brier: number;
  avgSizeUsd: number;
  sizeStdUsd: number;
  categoryExpertise: Record<string, number>;
}

export interface ConvictionResult {
  walletSkill: number;
  sizeScore: number;
  recencyScore: number;
  conviction: number;
}

export interface WhaleTradeInput {
  wallet: string;
  marketId: string;
  marketTitle: string;
  category: string;
  side: 'BUY' | 'SELL';
  outcome: string;
  sizeUsd: number;
  liquidityUsd: number;
  timestamp: string;
}

export interface AggregatedFlow {
  marketId: string;
  rawNetUsd: number;
  convictionNetUsd: number;
  tradeCount: number;
  totalConviction: number;
  bullishScore: number;
  confidence: number;
  signal: 'YES' | 'NO' | 'NEUTRAL';
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function round(x: number, dp = 4): number {
  const f = 10 ** dp;
  return Math.round(x * f) / f;
}

/* ── Whale wallet classification ─────────────────────────────────── */

/**
 * Build a whale watchlist from the leaderboard.
 * Returns the top N wallets ranked by PNL or volume.
 */
export function classifyWhalesFromLeaderboard(
  entries: LeaderboardEntry[]
): WhaleWallet[] {
  return entries.slice(0, TOP_WHALE_RANKS).map((entry) => {
    const pnl = entry.pnl ?? 0;
    const vol = entry.vol ?? 0;
    const winRate = vol > 0 ? Math.max(0, Math.min(1, (pnl / vol) * 5 + 0.5)) : 0.5;
    const skillScore = clamp(
      0.3 * winRate + 0.3 * Math.min(1, pnl / 500000) + 0.4 * Math.min(1, vol / 1000000),
      0, 1
    );
    return {
      address: entry.proxyWallet,
      username: entry.userName || entry.pseudonym || entry.proxyWallet.slice(0, 10),
      bio: entry.bio ?? '',
      profileImage: entry.profileImage ?? '',
      xUsername: entry.xUsername ?? '',
      rank: parseInt(entry.rank, 10) || 0,
      pnl,
      volume: vol,
      winRate,
      tradeCount: 0,
      isSmart: pnl > 0 && vol > 100000,
      skillScore,
    };
  });
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

/* ── Conviction Scoring (Golden Professor Engine) ────────────────── */

/**
 * Score a whale trade using multi-factor conviction analysis.
 *
 * conviction = sizeZ × walletSkill × categoryExpertise × liquidityFactor × recencyDecay
 *
 * Each factor is 0..1, so conviction is 0..1.
 */
export function scoreWhaleTrade(
  trade: WhaleTradeInput,
  stats: WalletStats | null,
  now: number
): ConvictionResult {
  // Recency decay — exponential with 8h half-life
  const ageMs = Math.max(0, now - new Date(trade.timestamp).getTime());
  const recencyScore = Math.exp(-Math.log(2) * ageMs / RECENCY_HALF_LIFE_MS);

  // Sample factor — more trades = more reliable skill estimate
  const sampleFactor = stats ? 1 - Math.exp(-(stats.trades || 0) / 50) : 0.1;

  // Wallet skill — composite of win rate, ROI, and calibration
  const winRate = stats ? clamp(stats.winRate ?? 0.5, 0, 1) : 0.5;
  const normRoi = stats ? sigmoid((stats.roi || 0) * 8) : 0.2;
  const calibration = stats ? 1 - clamp(stats.brier ?? 0.25, 0, 1) : 0.4;
  const walletSkill = clamp(
    (0.4 * winRate + 0.3 * normRoi + 0.3 * calibration) * sampleFactor,
    0,
    1
  );

  // Size z-score — how unusual is this trade for this wallet?
  const sizeZ =
    stats && stats.sizeStdUsd > 0
      ? (trade.sizeUsd - stats.avgSizeUsd) / stats.sizeStdUsd
      : trade.sizeUsd > (stats?.avgSizeUsd || 0)
        ? 2
        : 0.5;
  const sizeScore = clamp(sizeZ / 3, 0, 1);

  // Category expertise — does this wallet trade this type of market?
  const categoryExpertise = stats?.categoryExpertise?.[trade.category] ?? 0.45;

  // Liquidity factor — deeper markets = more reliable signal
  const liquidityFactor = trade.liquidityUsd
    ? clamp(Math.log10(trade.liquidityUsd + 10) / 6, 0, 1)
    : 0.5;

  // Final conviction — multiplicative combination
  const conviction = clamp(
    sizeScore * walletSkill * categoryExpertise * liquidityFactor * recencyScore,
    0,
    1
  );

  return {
    walletSkill: round(walletSkill),
    sizeScore: round(sizeScore),
    recencyScore: round(recencyScore),
    conviction: round(conviction),
  };
}

/**
 * Aggregate whale flow across markets using conviction-weighted notional.
 *
 * Returns markets ranked by absolute conviction-weighted net flow.
 */
export function aggregateWhaleFlow(
  trades: WhaleTradeInput[],
  statsMap: Map<string, WalletStats>,
  now: number
): AggregatedFlow[] {
  const map: Record<
    string,
    {
      rawNetUsd: number;
      convictionNetUsd: number;
      tradeCount: number;
      totalConviction: number;
    }
  > = {};

  for (const t of trades) {
    const stats = statsMap.get(t.wallet) ?? null;
    const s = scoreWhaleTrade(t, stats, now);

    const signed = t.side === 'BUY' ? t.sizeUsd : -t.sizeUsd;

    const e =
      map[t.marketId] ||
      (map[t.marketId] = {
        rawNetUsd: 0,
        convictionNetUsd: 0,
        tradeCount: 0,
        totalConviction: 0,
      });

    e.rawNetUsd += signed;
    e.convictionNetUsd += signed * s.conviction;
    e.tradeCount++;
    e.totalConviction += s.conviction;
  }

  // Scale factor for sigmoid normalization
  const scale = 15000;

  return Object.entries(map)
    .map(([marketId, e]) => {
      const bullishScore = sigmoid(e.convictionNetUsd / scale);
      const confidence = clamp(
        (e.totalConviction / 3) * Math.min(1, e.tradeCount / 8),
        0,
        1
      );

      return {
        marketId,
        rawNetUsd: e.rawNetUsd,
        convictionNetUsd: e.convictionNetUsd,
        tradeCount: e.tradeCount,
        totalConviction: e.totalConviction,
        bullishScore,
        confidence,
        signal:
          bullishScore > 0.62
            ? ('YES' as const)
            : bullishScore < 0.38
              ? ('NO' as const)
              : ('NEUTRAL' as const),
      };
    })
    .sort((a, b) => Math.abs(b.convictionNetUsd) - Math.abs(a.convictionNetUsd));
}
