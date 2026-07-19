/**
 * Wallet intelligence scoring for Prediction Pulse.
 *
 * Computes behavioral scores for whale wallets based on their
 * trading history from the Polymarket Data API.
 */

/* ── Score interfaces ────────────────────────────────────── */

export interface WalletScores {
  winRate: number;
  roi: number;
  avgPositionSize: number;
  consistency: number;
  conviction: number;
  reliability: number;
  copyTradeScore: number;
}

/* ── Scoring functions ───────────────────────────────────── */

/**
 * Compute win rate from closed positions.
 * Won = redeemable=true (resolved in their favor).
 * Lost = currentValue=0 && redeemable=false.
 */
export function computeWinRate(
  wonCount: number,
  lostCount: number
): number {
  const total = wonCount + lostCount;
  if (total === 0) return 0;
  return Math.round((wonCount / total) * 100) / 100;
}

/**
 * Compute ROI from total invested vs total returns.
 */
export function computeROI(
  totalInvested: number,
  totalReturned: number
): number {
  if (totalInvested <= 0) return 0;
  return Math.round(((totalReturned - totalInvested) / totalInvested) * 100) / 100;
}

/**
 * Consistency score: 0-1 based on how regular the trading pattern is.
 * High consistency = trades regularly, low variance in position sizes.
 */
export function computeConsistency(
  tradeTimestamps: number[],
  tradeSizes: number[]
): number {
  if (tradeTimestamps.length < 3) return 0;

  // Time regularity: coefficient of variation of gaps
  const gaps: number[] = [];
  for (let i = 1; i < tradeTimestamps.length; i++) {
    gaps.push(tradeTimestamps[i] - tradeTimestamps[i - 1]);
  }
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const variance = gaps.reduce((sum, g) => sum + (g - avgGap) ** 2, 0) / gaps.length;
  const cv = avgGap > 0 ? Math.sqrt(variance) / avgGap : 1;
  const timeScore = Math.max(0, 1 - cv);

  // Size regularity
  const avgSize = tradeSizes.reduce((a, b) => a + b, 0) / tradeSizes.length;
  const sizeVariance = tradeSizes.reduce((sum, s) => sum + (s - avgSize) ** 2, 0) / tradeSizes.length;
  const sizeCv = avgSize > 0 ? Math.sqrt(sizeVariance) / avgSize : 1;
  const sizeScore = Math.max(0, 1 - sizeCv);

  return Math.round((timeScore * 0.5 + sizeScore * 0.5) * 100) / 100;
}

/**
 * Conviction score: how concentrated is the wallet's betting.
 * High conviction = bets big on few markets, not spread thin.
 */
export function computeConviction(
  uniqueMarkets: number,
  totalVolume: number
): number {
  if (uniqueMarkets === 0 || totalVolume === 0) return 0;
  const avgPerMarket = totalVolume / uniqueMarkets;
  // $1K avg = 0.3, $10K = 0.6, $50K+ = 0.9
  return Math.round(Math.min(0.9, Math.log10(avgPerMarket + 1) * 0.3) * 100) / 100;
}

/**
 * Reliability score: composite of win rate + consistency + ROI.
 */
export function computeReliability(scores: {
  winRate: number;
  consistency: number;
  roi: number;
}): number {
  const winComponent = scores.winRate * 0.4;
  const consistComponent = scores.consistency * 0.3;
  const roiComponent = Math.min(1, Math.max(0, scores.roi / 2)) * 0.3;
  return Math.round((winComponent + consistComponent + roiComponent) * 100) / 100;
}

/**
 * Copy-trade score: overall desirability of following this wallet.
 * Weighted combination of all other scores.
 */
export function computeCopyTradeScore(scores: WalletScores): number {
  return Math.round(
    (scores.winRate * 0.25 +
      scores.roi * 0.25 +
      scores.consistency * 0.2 +
      scores.conviction * 0.15 +
      scores.reliability * 0.15) *
      100
  ) / 100;
}

/**
 * Compute all wallet scores from trading data.
 */
export function computeAllScores(data: {
  wonCount: number;
  lostCount: number;
  totalInvested: number;
  totalReturned: number;
  tradeTimestamps: number[];
  tradeSizes: number[];
  uniqueMarkets: number;
  totalVolume: number;
}): WalletScores {
  const winRate = computeWinRate(data.wonCount, data.lostCount);
  const roi = computeROI(data.totalInvested, data.totalReturned);
  const consistency = computeConsistency(data.tradeTimestamps, data.tradeSizes);
  const conviction = computeConviction(data.uniqueMarkets, data.totalVolume);
  const avgPositionSize =
    data.tradeSizes.length > 0
      ? data.tradeSizes.reduce((a, b) => a + b, 0) / data.tradeSizes.length
      : 0;
  const reliability = computeReliability({ winRate, consistency, roi });
  const scores: WalletScores = {
    winRate,
    roi,
    avgPositionSize,
    consistency,
    conviction,
    reliability,
    copyTradeScore: 0,
  };
  scores.copyTradeScore = computeCopyTradeScore(scores);
  return scores;
}
