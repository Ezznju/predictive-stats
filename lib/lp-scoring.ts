/**
 * LP Risk-Adjusted Scoring Engine.
 *
 * Evaluates liquidity provider positions by computing net APR after
 * hidden costs: adverse selection, inventory risk, reward dilution.
 * Outputs a risk-adjusted score and recommended allocation.
 *
 * Based on the Golden Professor Engine LP model.
 */

import { clamp, sigmoid } from './intel';

/* ── Types ─────────────────────────────────────────────────────────── */

export interface LPInput {
  marketId: string;
  name: string;
  liquidityUsd: number;
  dailyRewardUsd: number;
  volume24hUsd: number;
  spreadDecimal: number;
  adverseSelectionBps: number;
  volatilityDaily: number;
  rewardDilutionPctAnnual: number;
  feeCaptureShare: number;
  platformRiskScore: number;
}

export interface LPResult {
  marketId: string;
  name: string;
  grossRewardApr: number;
  spreadApr: number;
  adverseSelectionApr: number;
  inventoryCostApr: number;
  dilutionApr: number;
  netApr: number;
  riskAdjustedScore: number;
  score100: number;
  recommendedAllocationPct: number;
  riskFlags: RiskFlag[];
  volumeToLiquidity: number;
  professorNotes: string[];
}

export interface RiskFlag {
  severity: 0 | 1 | 2 | 3; // 0=clear, 1=low, 2=medium, 3=high
  message: string;
}

/* ── Helpers ───────────────────────────────────────────────────────── */

function pct(v: number): string {
  return (v * 100).toFixed(1) + '%';
}

/* ── Core LP Scoring ───────────────────────────────────────────────── */

export function scoreLP(input: LPInput): LPResult | null {
  const liquidity = input.liquidityUsd || 0;
  if (liquidity <= 0) return null;

  // Gross reward APR from daily rewards
  const grossRewardApr = ((input.dailyRewardUsd || 0) * 365) / liquidity;

  // Spread capture APR from trading volume
  const spreadApr =
    ((input.volume24hUsd || 0) *
      (input.spreadDecimal || 0.01) *
      clamp(input.feeCaptureShare ?? 0.05, 0, 1) *
      365) /
    liquidity;

  // Adverse selection cost — informed flow eats into rewards
  const adverseSelectionApr =
    ((input.volume24hUsd || 0) *
      ((input.adverseSelectionBps || 10) / 10000) *
      365) /
    liquidity;

  // Inventory cost — volatility × holding period factor
  const volatilityAnnual = (input.volatilityDaily || 0.03) * Math.sqrt(365);
  const inventoryCostApr = volatilityAnnual * 0.18;

  // Reward dilution — new entrants diluting your share
  const dilutionApr = input.rewardDilutionPctAnnual || 0;

  // Platform risk
  const platformRisk = clamp(input.platformRiskScore ?? 0.2, 0, 1);

  // Net APR after all costs
  const netApr =
    grossRewardApr + spreadApr - adverseSelectionApr - inventoryCostApr - dilutionApr;

  // Composite risk factor
  const risk = clamp(
    volatilityAnnual * 0.5 + adverseSelectionApr + dilutionApr + platformRisk * 0.15,
    0.08,
    3
  );

  // Risk-adjusted score
  const riskAdjustedScore = netApr / risk;

  // Score 0-100 using sigmoid
  const score100 = Math.round(100 * sigmoid((riskAdjustedScore - 0.55) * 2.4));

  // Recommended allocation as % of bankroll
  const recommendedAllocationPct = clamp(riskAdjustedScore * 3.2, 0, 10);

  // Volume to liquidity ratio
  const volumeToLiquidity = (input.volume24hUsd || 0) / liquidity;

  // Risk flags
  const riskFlags: RiskFlag[] = [];

  if (volumeToLiquidity < 0.05) {
    riskFlags.push({
      severity: 2,
      message: 'Liquidity is barely utilized — low turnover.',
    });
  }

  if (adverseSelectionApr > grossRewardApr * 0.5) {
    riskFlags.push({
      severity: 3,
      message: 'Informed flow is eating a large share of the reward.',
    });
  }

  if (volatilityAnnual > 1.2) {
    riskFlags.push({
      severity: 2,
      message: 'High inventory risk — market is very volatile.',
    });
  }

  if (netApr < 0.12 && grossRewardApr > 0.25) {
    riskFlags.push({
      severity: 2,
      message: 'Headline trap: net APR is far below the advertised reward rate.',
    });
  }

  // Find biggest drag
  const drags: Array<[string, number]> = (
    [
      ['adverse selection', adverseSelectionApr],
      ['inventory risk', inventoryCostApr],
      ['dilution', dilutionApr],
    ] as const
  )
    .map(([label, val]) => [label, val] as [string, number])
    .sort((a, b) => b[1] - a[1]);

  const professorNotes = [
    `Headline reward APR is ${pct(grossRewardApr)} — estimated net after hidden costs is ${pct(netApr)}.`,
    `Biggest drag: ${drags[0][0]} (${pct(drags[0][1])}).`,
    `Risk-adjusted score ${riskAdjustedScore.toFixed(2)} → suggested allocation ${recommendedAllocationPct.toFixed(1)}% of bankroll.`,
  ];

  return {
    marketId: input.marketId,
    name: input.name,
    grossRewardApr,
    spreadApr,
    adverseSelectionApr,
    inventoryCostApr,
    dilutionApr,
    netApr,
    riskAdjustedScore,
    score100,
    recommendedAllocationPct,
    riskFlags,
    volumeToLiquidity,
    professorNotes,
  };
}
