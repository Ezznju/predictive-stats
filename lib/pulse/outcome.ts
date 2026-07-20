/**
 * Outcome Loop — grades resolved whale trades.
 *
 * Given a trade and how the market resolved, compute the return.
 * Pure functions — no DB writes, no side effects.
 */

export interface GradedTrade {
  walletAddress: string;
  conditionId: string;
  side: 'BUY' | 'SELL';
  outcome: string;
  entryPrice: number;
  /** YES, NO, or null if unresolved */
  resolution: 'YES' | 'NO' | null;
  /** Return as a decimal: +0.5 = 50% profit, -1.0 = total loss */
  returnPct: number;
  /** Did the whale's position win? */
  won: boolean;
  /** Dollar P&L assuming usdcSize was the position */
  pnl: number;
  grade: 'WIN' | 'LOSS' | 'PUSH' | 'UNGRADED';
}

/**
 * Grade a single trade against a market resolution.
 *
 * Logic:
 * - BUY YES at price P:
 *   - Resolution YES → return = (1 - P) / P  (bought at P, worth 1)
 *   - Resolution NO  → return = -1            (total loss)
 * - BUY NO at price P:
 *   - Resolution NO  → return = (1 - P) / P
 *   - Resolution YES → return = -1
 * - SELL YES at price P:
 *   - Resolution YES → return = -(1 - P) / P  (owed the full amount)
 *   - Resolution NO  → return = P              (keep the premium)
 * - SELL NO at price P:
 *   - Resolution NO  → return = -(1 - P) / P
 *   - Resolution YES → return = P
 */
export function gradeTrade(
  side: 'BUY' | 'SELL',
  outcome: string,
  entryPrice: number,
  resolution: 'YES' | 'NO' | null,
  usdcSize: number,
): GradedTrade {
  const entry = Math.max(0.001, Math.min(0.999, entryPrice)); // clamp to avoid div by 0

  if (resolution === null) {
    return {
      walletAddress: '',
      conditionId: '',
      side,
      outcome,
      entryPrice: entry,
      resolution: null,
      returnPct: 0,
      won: false,
      pnl: 0,
      grade: 'UNGRADED',
    };
  }

  const outcomeNormalized = outcome.toUpperCase().trim();
  const resolutionMatches =
    (outcomeNormalized === 'YES' && resolution === 'YES') ||
    (outcomeNormalized === 'NO' && resolution === 'NO');

  let returnPct: number;

  if (side === 'BUY') {
    // Bought shares. If resolution matches, each share pays $1. Otherwise $0.
    returnPct = resolutionMatches ? (1 - entry) / entry : -1;
  } else {
    // Sold shares. If resolution matches, you owe $1 per share (loss).
    // If resolution doesn't match, you keep the premium.
    returnPct = resolutionMatches ? -(1 - entry) / entry : entry;
  }

  const won = returnPct > 0;
  const pnl = usdcSize * returnPct;
  const grade = resolutionMatches ? 'WIN' : returnPct === 0 ? 'PUSH' : 'LOSS';

  return {
    walletAddress: '',
    conditionId: '',
    side,
    outcome,
    entryPrice: entry,
    resolution,
    returnPct,
    won,
    pnl,
    grade,
  };
}

/**
 * Grade multiple trades for a single resolved market.
 * Returns summary stats per wallet.
 */
export function gradeMarketTrades(
  trades: Array<{
    walletAddress: string;
    conditionId: string;
    side: 'BUY' | 'SELL';
    outcome: string;
    entryPrice: number;
    usdcSize: number;
  }>,
  resolution: 'YES' | 'NO',
): {
  graded: GradedTrade[];
  walletStats: Record<string, {
    wins: number;
    losses: number;
    totalPnl: number;
    avgReturn: number;
    winRate: number;
  }>;
} {
  const graded = trades.map((t) => {
    const g = gradeTrade(t.side, t.outcome, t.entryPrice, resolution, t.usdcSize);
    g.walletAddress = t.walletAddress;
    g.conditionId = t.conditionId;
    return g;
  });

  // Aggregate per wallet
  const walletStats: Record<string, {
    wins: number;
    losses: number;
    totalPnl: number;
    returns: number[];
    winRate: number;
    avgReturn: number;
  }> = {};

  for (const g of graded) {
    if (g.grade === 'UNGRADED') continue;
    if (!walletStats[g.walletAddress]) {
      walletStats[g.walletAddress] = { wins: 0, losses: 0, totalPnl: 0, returns: [], winRate: 0, avgReturn: 0 };
    }
    const ws = walletStats[g.walletAddress];
    if (g.won) ws.wins++;
    else ws.losses++;
    ws.totalPnl += g.pnl;
    ws.returns.push(g.returnPct);
  }

  // Compute derived stats
  for (const addr of Object.keys(walletStats)) {
    const ws = walletStats[addr];
    const total = ws.wins + ws.losses;
    ws.winRate = total > 0 ? ws.wins / total : 0;
    ws.avgReturn = ws.returns.length > 0
      ? ws.returns.reduce((a, b) => a + b, 0) / ws.returns.length
      : 0;
    delete (ws as Record<string, unknown>).returns; // clean up helper field
  }

  return { graded, walletStats };
}
