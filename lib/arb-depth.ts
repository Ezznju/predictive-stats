/**
 * Real order-book depth for arbitrage pairs.
 *
 * The scanner's arb % is a mid-price gap. This module answers the questions
 * that decide whether a gap is actually tradeable: how many contracts can
 * you fill on BOTH venues at profitable prices, and what's left after
 * Kalshi's trading fee?
 *
 * Sources:
 *  - Kalshi: /markets/{ticker}/orderbook (orderbook_fp, prices in dollars)
 *  - Polymarket: clob.polymarket.com/book?token_id=... (asks, prices as strings)
 *
 * Kalshi's fee is the published schedule: 7% × price × (1 − price) per
 * contract (rounded up per order in reality, so treat the numbers as est.).
 * Polymarket currently charges no trading fee.
 */

import { z } from 'zod';
import { safeFetchJson } from './safe-fetch';
import { pMap } from './async-utils';
import type { ArbitragePair, ArbitrageDepth } from './arbitrage';

const KALSHI_MARKETS = 'https://api.elections.kalshi.com/trade-api/v2/markets';
const CLOB_BOOK = 'https://clob.polymarket.com/book';

const KALSHI_FEE_RATE = 0.07;

/* ── Schemas (defensive: upstream shapes are loosely typed) ────────── */

const KalshiBookSchema = z
  .object({
    orderbook_fp: z
      .object({
        yes_dollars: z.array(z.array(z.any())).optional().default([]),
        no_dollars: z.array(z.array(z.any())).optional().default([]),
      })
      .optional(),
  })
  .passthrough();

const ClobBookSchema = z
  .object({
    asks: z
      .array(z.object({ price: z.string(), size: z.string() }))
      .optional()
      .default([]),
  })
  .passthrough();

/* ── Levels ────────────────────────────────────────────────────────── */

interface Level {
  price: number;
  size: number;
}

function toLevels(rows: unknown[][], invert: boolean): Level[] {
  return rows
    .map((lv) => {
      const p = Number(lv?.[0]);
      const q = Number(lv?.[1]);
      return { price: invert ? 1 - p : p, size: q };
    })
    .filter(
      (l) =>
        Number.isFinite(l.price) &&
        Number.isFinite(l.size) &&
        l.price > 0.001 &&
        l.price < 0.999 &&
        l.size > 0
    )
    .sort((a, b) => a.price - b.price);
}

/**
 * Kalshi's book lists resting orders on each side. To BUY YES you lift the
 * NO side (a NO bid at $0.60 is a YES offer at $0.40) and vice versa.
 */
async function fetchKalshiBooks(
  ticker: string
): Promise<{ buyYes: Level[]; buyNo: Level[] } | null> {
  const json = await safeFetchJson(
    `${KALSHI_MARKETS}/${encodeURIComponent(ticker)}/orderbook`,
    KalshiBookSchema,
    {},
    {
      label: `kalshi book ${ticker}`,
      retries: 3,
      backoffBaseMs: 900,
      maxRetryAfterMs: 20000,
    }
  );
  const yes = json.orderbook_fp?.yes_dollars ?? [];
  const no = json.orderbook_fp?.no_dollars ?? [];
  const buyYes = toLevels(no, true);
  const buyNo = toLevels(yes, true);
  if (buyYes.length === 0 && buyNo.length === 0) return null;
  return { buyYes, buyNo };
}

async function fetchPolyAsks(tokenId: string): Promise<Level[]> {
  const json = await safeFetchJson(
    `${CLOB_BOOK}?token_id=${encodeURIComponent(tokenId)}`,
    ClobBookSchema,
    {},
    { label: 'clob book', retries: 2, backoffBaseMs: 600, maxRetryAfterMs: 5000 }
  );
  return json.asks
    .map((a) => ({ price: parseFloat(a.price), size: parseFloat(a.size) }))
    .filter(
      (l) =>
        Number.isFinite(l.price) &&
        Number.isFinite(l.size) &&
        l.price > 0.001 &&
        l.price < 0.999 &&
        l.size > 0
    )
    .sort((a, b) => a.price - b.price);
}

/* ── Book walk: how much fills while the trade stays profitable? ───── */

function walkBooks(
  yesAsks: Level[],
  noAsks: Level[],
  kalshiLeg: 'yes' | 'no'
): Omit<ArbitrageDepth, 'checkedAt' | 'yesVenue'> | null {
  if (yesAsks.length === 0 || noAsks.length === 0) return null;

  let yi = 0;
  let ni = 0;
  let yesRemain = yesAsks[0].size;
  let noRemain = noAsks[0].size;
  let contracts = 0;
  let yesCost = 0;
  let noCost = 0;
  let profit = 0;
  let fees = 0;

  while (yi < yesAsks.length && ni < noAsks.length) {
    const y = yesAsks[yi];
    const n = noAsks[ni];
    const chunk = Math.min(yesRemain, noRemain);
    if (chunk <= 0) break;

    const grossPer = 1 - y.price - n.price;
    const kalshiPrice = kalshiLeg === 'yes' ? y.price : n.price;
    const feePer = KALSHI_FEE_RATE * kalshiPrice * (1 - kalshiPrice);
    const netPer = grossPer - feePer;

    // Marginal slice no longer profitable — stop consuming depth.
    if (netPer <= 0.0001) break;

    contracts += chunk;
    yesCost += y.price * chunk;
    noCost += n.price * chunk;
    profit += netPer * chunk;
    fees += feePer * chunk;

    yesRemain -= chunk;
    noRemain -= chunk;
    if (yesRemain <= 1e-9) {
      yi++;
      yesRemain = yesAsks[yi]?.size ?? 0;
    }
    if (noRemain <= 1e-9) {
      ni++;
      noRemain = noAsks[ni]?.size ?? 0;
    }
  }

  if (contracts < 1) return null;

  const capital = yesCost + noCost;
  // Top-of-book math from the REAL asks (not mids) so the fee waterfall in
  // the UI adds up exactly for the best fill level: gross − fee = net.
  const topYes = yesAsks[0].price;
  const topNo = noAsks[0].price;
  const topGross = 1 - topYes - topNo;
  const topKalshiPrice = kalshiLeg === 'yes' ? topYes : topNo;
  const topFee = KALSHI_FEE_RATE * topKalshiPrice * (1 - topKalshiPrice);
  return {
    maxContracts: Math.round(contracts),
    capitalUsd: round(capital, 2),
    profitUsd: round(profit, 2),
    netArbPercent: round((profit / capital) * 100, 2),
    /** Volume-weighted net across every level the walk consumed. */
    netPerContractCents: round((profit / contracts) * 100, 2),
    grossPerContractCents: round(topGross * 100, 2),
    topFeePerContractCents: round(topFee * 100, 2),
    topNetPerContractCents: round((topGross - topFee) * 100, 2),
    kalshiFeePerContractCents: round((fees / contracts) * 100, 2),
    avgYesPrice: round(yesCost / contracts, 4),
    avgNoPrice: round(noCost / contracts, 4),
  };
}

/* ── Enrichment ────────────────────────────────────────────────────── */

/**
 * Attach real depth to the top `limit` pairs (by opportunity score).
 * Best-effort: any pair whose books can't be read is left without depth.
 * Returns how many pairs were enriched (for logs).
 */
export async function enrichPairsWithDepth(
  pairs: ArbitragePair[],
  limit = 12
): Promise<number> {
  const targets = pairs
    .filter(
      (p) =>
        (p.poly.clobTokenIds?.length ?? 0) >= 2 &&
        p.kalshi.ticker &&
        p.arbPercent > 0
    )
    .slice(0, limit);

  let enriched = 0;

  await pMap(
    targets,
    async (pair) => {
      try {
        const kalshiLeg: 'yes' | 'no' =
          pair.cheaperYes === 'kalshi' ? 'yes' : 'no';

        // Polymarket leg: buying YES uses the YES token book, buying NO the NO token.
        const polyToken =
          pair.cheaperYes === 'polymarket'
            ? pair.poly.clobTokenIds[0]
            : pair.poly.clobTokenIds[1];

        const [kalshi, polyAsks] = await Promise.all([
          fetchKalshiBooks(pair.kalshi.ticker),
          fetchPolyAsks(polyToken),
        ]);
        if (!kalshi) return;

        const yesAsks = kalshiLeg === 'yes' ? kalshi.buyYes : polyAsks;
        const noAsks = kalshiLeg === 'yes' ? polyAsks : kalshi.buyNo;

        const depth = walkBooks(yesAsks, noAsks, kalshiLeg);
        if (depth) {
          pair.depth = {
            ...depth,
            yesVenue: pair.cheaperYes,
            checkedAt: new Date().toISOString(),
          };
          enriched++;
        }
      } catch (err) {
        console.warn(
          `[arb-depth] books unavailable for ${pair.kalshi.ticker}:`,
          String(err)
        );
      }
    },
    2
  );

  return enriched;
}

function round(n: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
