/**
 * Anomaly & market-integrity detection.
 *
 * Flags suspicious patterns — wash trading, price manipulation, spread
 * spoofing, volume outliers — so the scanner can down-rank or warn on
 * opportunities that look too good to be true.
 */

export type AnomalyKind =
  | 'wash_trading'
  | 'price_spike'
  | 'spread_anomaly'
  | 'volume_outlier'
  | 'stale_data'
  | 'thin_book';

export type Severity = 'info' | 'warn' | 'critical';

export interface AnomalyFlag {
  kind: AnomalyKind;
  severity: Severity;
  /** Human-readable explanation shown in the UI. */
  message: string;
  /** Numeric evidence backing the flag. */
  value: number;
}

export interface AnomalyInput {
  /** 24h volume in USD. */
  volume24h: number;
  /** Total volume in USD. */
  volumeTotal: number;
  /** Open interest / liquidity in USD. */
  liquidity: number;
  /** Current bid-ask spread (decimal, e.g. 0.04 = 4¢). */
  spread: number;
  /** Absolute 24h price change (decimal). */
  priceChange24h: number;
  /** Best bid size (shares) — used to detect thin books. */
  bestBidSize?: number;
  /** Best ask size (shares). */
  bestAskSize?: number;
  /** Seconds since the data was last updated (for staleness). */
  dataAgeSeconds?: number;
}

export interface AnomalyReport {
  flags: AnomalyFlag[];
  /** 0..1 — 0 = perfectly clean, 1 = highly suspicious. */
  riskScore: number;
  /** Whether the opportunity should be hidden by default. */
  blocked: boolean;
}

/** Median absolute deviation — robust outlier threshold helper. */
export function mad(values: number[]): { median: number; mad: number } {
  if (values.length === 0) return { median: 0, mad: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const devs = sorted.map((v) => Math.abs(v - median)).sort((a, b) => a - b);
  const madVal = devs.length % 2 ? devs[mid] : (devs[mid - 1] + devs[mid]) / 2;
  return { median, mad: madVal };
}

/** Analyse a single market's integrity. */
export function analyzeMarket(input: AnomalyInput): AnomalyReport {
  const flags: AnomalyFlag[] = [];

  // Wash trading: volume vastly exceeds liquidity (churn), a classic signal.
  if (input.liquidity > 0) {
    const churn = input.volume24h / input.liquidity;
    if (churn > 20) {
      flags.push({
        kind: 'wash_trading',
        severity: 'critical',
        message: `24h volume is ${churn.toFixed(0)}× the open interest — possible wash trading.`,
        value: churn,
      });
    } else if (churn > 8) {
      flags.push({
        kind: 'wash_trading',
        severity: 'warn',
        message: `Unusually high turnover (${churn.toFixed(1)}× liquidity).`,
        value: churn,
      });
    }
  }

  // Price spike: |Δ24h| > 25¢ suggests news-driven volatility / manipulation.
  if (Math.abs(input.priceChange24h) > 0.25) {
    flags.push({
      kind: 'price_spike',
      severity: 'warn',
      message: `Price moved ${(Math.abs(input.priceChange24h) * 100).toFixed(0)}¢ in 24h — elevated volatility.`,
      value: input.priceChange24h,
    });
  }

  // Spread anomaly: very wide spread = unreliable mid price.
  if (input.spread > 0.15) {
    flags.push({
      kind: 'spread_anomaly',
      severity: 'warn',
      message: `Wide ${(input.spread * 100).toFixed(0)}¢ spread — quoted price may not be fillable.`,
      value: input.spread,
    });
  }

  // Thin book: top-of-book size too small to trade meaningfully.
  const topSize = Math.max(input.bestBidSize ?? 0, input.bestAskSize ?? 0);
  if (topSize > 0 && topSize < 50) {
    flags.push({
      kind: 'thin_book',
      severity: 'info',
      message: `Thin top-of-book (~${Math.round(topSize)} shares) — limited size available.`,
      value: topSize,
    });
  }

  // Stale data guard.
  if ((input.dataAgeSeconds ?? 0) > 600) {
    flags.push({
      kind: 'stale_data',
      severity: 'warn',
      message: 'Data is more than 10 minutes old.',
      value: input.dataAgeSeconds ?? 0,
    });
  }

  // Aggregate into a single 0..1 risk score.
  const weights: Record<Severity, number> = { info: 0.1, warn: 0.3, critical: 0.6 };
  const raw = flags.reduce((s, f) => s + weights[f.severity], 0);
  const riskScore = Math.min(1, raw);
  const blocked = flags.some((f) => f.severity === 'critical');

  return { flags, riskScore, blocked };
}

/**
 * Cross-market volume outlier detection using MAD across the whole scan.
 * Adds a flag to markets whose volume is a robust-z outlier.
 */
export function flagVolumeOutliers(
  volumes: number[],
  threshold = 3.5
): boolean[] {
  const { median, mad: madVal } = mad(volumes);
  if (madVal === 0) return volumes.map(() => false);
  return volumes.map((v) => {
    const robustZ = (0.6745 * (v - median)) / madVal;
    return robustZ > threshold;
  });
}
