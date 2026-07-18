/**
 * Opportunity scoring engine.
 *
 * Turns raw market fields into a single, explainable 0–100 score plus the
 * component sub-scores that produced it. Pure and deterministic so the exact
 * same ranking can be recomputed on the client for "what-if" analysis.
 */

import { clamp, sigmoid } from './intel';

export interface ScoreWeights {
  profit: number;
  liquidity: number;
  confidence: number;
  risk: number;
  time: number;
}

export const DEFAULT_WEIGHTS: ScoreWeights = {
  profit: 0.4,
  liquidity: 0.2,
  confidence: 0.2,
  risk: 0.1,
  time: 0.1,
};

export interface ScoreInput {
  /** Raw edge of the trade as a % (arb %, reward APR %, etc). */
  edgePct: number;
  /** 24h traded volume in USD (liquidity proxy). */
  volumeUsd: number;
  /** 0..1 confidence that the setup is real (match score / data integrity). */
  confidence: number;
  /** 0..1 risk penalty — higher = riskier (spread width, anomaly flags, etc). */
  risk: number;
  /** Hours until the market resolves (Infinity if unknown / far). */
  hoursToExpiry: number;
}

export interface ScoreBreakdown {
  total: number;
  profit: number;
  liquidity: number;
  confidence: number;
  risk: number;
  time: number;
  grade: 'A' | 'B' | 'C' | 'D';
}

/** Scale volume onto a smooth 0..1 curve ($10k ≈ 0.5, $1M ≈ 0.9). */
export function liquidityScore(volumeUsd: number): number {
  if (volumeUsd <= 0) return 0;
  // log10 scaling: $1k→0.25, $10k→0.5, $100k→0.75, $1M→1.0
  return clamp(Math.log10(volumeUsd + 1) / 4, 0, 1);
}

/** Reward setups that resolve sooner (capital freed faster) score higher. */
export function timeScore(hoursToExpiry: number): number {
  if (!Number.isFinite(hoursToExpiry) || hoursToExpiry <= 0) return 0.5;
  // 24h → ~1.0, 1 week → ~0.6, 30 days → ~0.2
  return clamp(24 / (24 + hoursToExpiry), 0, 1);
}

/** Map raw edge % to 0..1 with diminishing returns past ~15%. */
export function profitScore(edgePct: number): number {
  if (edgePct <= 0) return 0;
  return sigmoid((edgePct - 5) / 4);
}

export function scoreOpportunity(
  input: ScoreInput,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): ScoreBreakdown {
  const profit = profitScore(input.edgePct);
  const liquidity = liquidityScore(input.volumeUsd);
  const confidence = clamp(input.confidence, 0, 1);
  const riskPenalty = clamp(input.risk, 0, 1);
  const time = timeScore(input.hoursToExpiry);

  const total01 = clamp(
    profit * weights.profit +
      liquidity * weights.liquidity +
      confidence * weights.confidence +
      (1 - riskPenalty) * weights.risk +
      time * weights.time,
    0,
    1
  );

  const total = Math.round(total01 * 100);
  const grade: ScoreBreakdown['grade'] =
    total >= 75 ? 'A' : total >= 55 ? 'B' : total >= 35 ? 'C' : 'D';

  return {
    total,
    profit: Math.round(profit * 100),
    liquidity: Math.round(liquidity * 100),
    confidence: Math.round(confidence * 100),
    risk: Math.round((1 - riskPenalty) * 100),
    time: Math.round(time * 100),
    grade,
  };
}

/* ── Adaptive weight learning ──────────────────────────────────────── */

/**
 * Simple online learner that nudges weights toward the signals that have
 * historically predicted successful opportunities.
 *
 * This is intentionally a *bounded, explainable* update (not a black-box ML
 * model) — each outcome shifts the relevant weight by a small learning rate,
 * then weights are renormalised to sum to 1. It never produces negative
 * weights or unstable oscillation.
 */
export class WeightLearner {
  private weights: ScoreWeights;
  private readonly lr: number;

  constructor(initial: ScoreWeights = DEFAULT_WEIGHTS, learningRate = 0.05) {
    this.weights = { ...initial };
    this.lr = learningRate;
  }

  get current(): ScoreWeights {
    return { ...this.weights };
  }

  /**
   * Record an outcome.
   * @param feature  which signal drove the decision
   * @param success  did the opportunity actually close profitably?
   */
  recordOutcome(feature: keyof ScoreWeights, success: boolean): void {
    const delta = success ? this.lr : -this.lr;
    const w = this.weights as Record<keyof ScoreWeights, number>;
    w[feature] = Math.max(0.02, Math.min(0.8, w[feature] + delta));
    this.normalize();
  }

  private normalize(): void {
    const w = this.weights as Record<keyof ScoreWeights, number>;
    const sum = Object.values(w).reduce((s, v) => s + v, 0);
    if (sum <= 0) {
      this.weights = { ...DEFAULT_WEIGHTS };
      return;
    }
    (Object.keys(w) as (keyof ScoreWeights)[]).forEach((k) => {
      w[k] = w[k] / sum;
    });
  }

  /** Persist / restore as JSON so the learner can survive across requests. */
  serialize(): string {
    return JSON.stringify(this.weights);
  }

  static restore(json: string | null | undefined): WeightLearner {
    if (json) {
      try {
        const parsed = JSON.parse(json) as ScoreWeights;
        if (parsed && typeof parsed === 'object') {
          return new WeightLearner({ ...DEFAULT_WEIGHTS, ...parsed });
        }
      } catch {
        /* fall through to defaults */
      }
    }
    return new WeightLearner();
  }
}
