/**
 * Optimal execution path & position sizing.
 *
 * Given a detected cross-platform price gap, compute the exact sequence of
 * trades that maximises guaranteed profit, the capital required, and a Kelly-
 * based size recommendation. Pure functions — no I/O.
 */

import { kellyCriterion, round, clamp } from './intel';

export type Platform = 'polymarket' | 'kalshi';

export interface ExecutionLeg {
  platform: Platform;
  side: 'BUY_YES' | 'BUY_NO';
  /** Price paid per share (0..1). */
  price: number;
  /** Number of shares/contracts to trade. */
  shares: number;
  /** Cost of this leg in USD. */
  cost: number;
}

export interface ExecutionPlan {
  legs: ExecutionLeg[];
  /** Total capital needed to put on both legs. */
  totalCost: number;
  /** Guaranteed payout at resolution (always `shares` for a perfect hedge). */
  payout: number;
  /** Guaranteed profit before fees. */
  grossProfit: number;
  /** Estimated taker/maker fees on both platforms. */
  estimatedFees: number;
  /** Profit after fees. */
  netProfit: number;
  /** Return on capital as a % (netProfit / totalCost). */
  roiPct: number;
  /** Half-Kelly recommended stake as a fraction of bankroll. */
  kellyFraction: number;
  /** True when the trade is profitable after fees. */
  viable: boolean;
  /** Step-by-step instructions for the UI. */
  steps: string[];
}

export interface PlanInput {
  polyYesAsk: number; // cost to buy YES on Polymarket
  polyNoAsk: number; // cost to buy NO on Polymarket  (= 1 - yesBid)
  kalshiYesAsk: number;
  kalshiNoAsk: number;
  /** Per-leg fee rate as a fraction (e.g. 0.005 = 0.5%). */
  polyFeeRate?: number;
  kalshiFeeRate?: number;
  /** Max shares the trader wants to deploy (liquidity cap). */
  maxShares?: number;
  /** Bankroll for Kelly sizing (optional). */
  bankroll?: number;
  /** Estimated win probability used for Kelly (defaults to implied consensus). */
  winProb?: number;
}

/**
 * Find the best riskless(ish) cross-platform hedge:
 * buy YES where it's cheapest and buy NO where it's cheapest, such that
 * combined cost < $1 (guaranteed $1 payout).
 */
export function buildExecutionPlan(input: PlanInput): ExecutionPlan {
  const polyFee = input.polyFeeRate ?? 0.0; // Polymarket has no trading fee (maker)
  const kalshiFee = input.kalshiFeeRate ?? 0.007; // ~0.7% taker approximation
  const maxShares = Math.max(1, input.maxShares ?? 100);

  // Two candidate structures:
  //  A: buy YES on Poly  + buy NO on Kalshi
  //  B: buy YES on Kalshi + buy NO on Poly
  const candidates = [
    {
      yesLeg: { platform: 'polymarket' as Platform, side: 'BUY_YES' as const, price: input.polyYesAsk },
      noLeg: { platform: 'kalshi' as Platform, side: 'BUY_NO' as const, price: input.kalshiNoAsk },
    },
    {
      yesLeg: { platform: 'kalshi' as Platform, side: 'BUY_YES' as const, price: input.kalshiYesAsk },
      noLeg: { platform: 'polymarket' as Platform, side: 'BUY_NO' as const, price: input.polyNoAsk },
    },
  ];

  // Choose the structure with the lowest combined cost per share.
  const best = candidates
    .map((c) => ({ ...c, combined: c.yesLeg.price + c.noLeg.price }))
    .filter((c) => c.yesLeg.price > 0 && c.noLeg.price > 0)
    .sort((a, b) => a.combined - b.combined)[0];

  if (!best || best.combined >= 1) {
    return {
      legs: [],
      totalCost: 0,
      payout: 0,
      grossProfit: 0,
      estimatedFees: 0,
      netProfit: 0,
      roiPct: 0,
      kellyFraction: 0,
      viable: false,
      steps: ['No profitable hedge — combined cost of YES + NO ≥ $1.00.'],
    };
  }

  const shares = maxShares;
  const yesCost = best.yesLeg.price * shares;
  const noCost = best.noLeg.price * shares;
  const totalCost = yesCost + noCost;
  const payout = shares; // each pair pays $1 regardless of outcome
  const grossProfit = payout - totalCost;

  const estimatedFees =
    yesCost * (best.yesLeg.platform === 'kalshi' ? kalshiFee : polyFee) +
    noCost * (best.noLeg.platform === 'kalshi' ? kalshiFee : polyFee);

  const netProfit = grossProfit - estimatedFees;
  const roiPct = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  // Kelly: treat as near-certain hedge; edge comes from the price gap.
  const impliedWinProb = clamp(input.winProb ?? 0.99, 0.01, 0.99);
  const kelly = kellyCriterion(impliedWinProb, clamp(totalCost / payout, 0.01, 0.99));
  const kellyFraction = input.bankroll
    ? clamp(kelly.half, 0, 1)
    : clamp(kelly.half, 0, 1);

  const steps = [
    `Buy ${shares} YES on ${label(best.yesLeg.platform)} @ ${(best.yesLeg.price * 100).toFixed(1)}¢ (cost ${usd(yesCost)})`,
    `Buy ${shares} NO on ${label(best.noLeg.platform)} @ ${(best.noLeg.price * 100).toFixed(1)}¢ (cost ${usd(noCost)})`,
    `Total cost ${usd(totalCost)} → guaranteed payout ${usd(payout)}`,
    `Net profit after fees: ${usd(netProfit)} (${round(roiPct, 2)}% ROI)`,
  ];

  return {
    legs: [
      { ...best.yesLeg, shares, cost: round(yesCost, 4) },
      { ...best.noLeg, shares, cost: round(noCost, 4) },
    ],
    totalCost: round(totalCost, 4),
    payout: round(payout, 4),
    grossProfit: round(grossProfit, 4),
    estimatedFees: round(estimatedFees, 4),
    netProfit: round(netProfit, 4),
    roiPct: round(roiPct, 3),
    kellyFraction: round(kellyFraction, 4),
    viable: netProfit > 0,
    steps,
  };
}

function label(p: Platform): string {
  return p === 'polymarket' ? 'Polymarket' : 'Kalshi';
}

function usd(n: number): string {
  return `$${round(n, 2).toFixed(2)}`;
}
