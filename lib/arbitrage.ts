/**
 * Cross-platform event matching & arbitrage detection.
 *
 * Strategy: match at EVENT level first (looser), then pair individual
 * markets within matched events using tighter sub-title matching.
 */

import { z } from 'zod';
import { safeFetchJson } from './safe-fetch';
import { eventSimilarity } from './intel';
import { scoreOpportunity } from './scoring';
import { analyzeMarket, type AnomalyFlag } from './anomaly';
import { buildExecutionPlan, type ExecutionPlan } from './execution';
import { clamp } from './intel';

/* ── Types ─────────────────────────────────────────────────────────── */

export interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  markets: PolymarketMarket[];
}

export interface PolymarketMarket {
  id: string;
  question: string;
  outcomePrices: string[];
  bestBid: string;
  bestAsk: string;
  volume: string;
  volume24hr: number;
  liquidity: string;
  slug: string;
  image: string;
  groupItemTitle: string;
}

export interface ArbitragePair {
  eventName: string;
  category: string;
  matchScore: number;

  poly: {
    question: string;
    yesPrice: number;
    bestBid: number;
    bestAsk: number;
    volume24h: number;
    slug: string;
    image: string;
  };

  kalshi: {
    question: string;
    yesPrice: number;
    yesBid: number;
    yesAsk: number;
    volume: number;
    ticker: string;
    eventTicker: string;
    /** Market close time (ISO) — used for real days-to-resolution. */
    expirationTime?: string;
  };

  priceDiffCents: number;
  cheaperYes: 'polymarket' | 'kalshi';
  arbPercent: number;

  /** 0..1 confidence both platforms price the SAME event. */
  matchConfidence: number;
  /** 0..100 blended opportunity score. */
  opportunityScore: number;
  /** Integrity flags (wash trading, wide spread, etc). */
  anomalies: AnomalyFlag[];
  /** Exact trade sequence + Kelly sizing for max profit. */
  plan: ExecutionPlan | null;
}

/* ── Kalshi types for matching ─────────────────────────────────────── */

interface KalshiEventInput {
  event_ticker: string;
  title: string;
  category: string;
}

interface KalshiMarketInput {
  ticker: string;
  event_ticker: string;
  title: string;
  yes_sub_title: string;
  yes_bid_dollars: string;
  yes_ask_dollars: string;
  volume_fp: string;
  close_time?: string;
}

/* ── Pre-match: find which Kalshi events are worth fetching ────────── */

/**
 * Match threshold. Kept moderate so newer/quieter categories (Climate,
 * Entertainment, Companies…) still surface — the strict 0.45 used before
 * isolated to long-tail only Elections, since those titles correlate
 * strongly. Category-aware top-N caps below keep the total market fetches
 * within the scan's time budget.
 */
const EVENT_MATCH_THRESHOLD = 0.22;

/**
 * Cap the number of Kalshi events we fetch markets for across all
 * categories (the scan shares an overall deadline).
 */
const MAX_EVENT_FETCHES = 60;

/** Max events to pre-match from a single category per pass (diversity). */
const PER_CATEGORY_FETCH_CAP = 8;

export function preMatchEvents(
  polyEvents: PolymarketEvent[],
  kalshiEvents: KalshiEventInput[]
): Set<string> {
  const bestByTicker = new Map<string, { ticker: string; score: number; category: string }>();

  for (const polyEvent of polyEvents) {
    for (const kalshiEvent of kalshiEvents) {
      const { score, conflict } = eventSimilarity(polyEvent.title, kalshiEvent.title);
      if (conflict || score < EVENT_MATCH_THRESHOLD) continue;
      const prev = bestByTicker.get(kalshiEvent.event_ticker);
      if (!prev || score > prev.score) {
        bestByTicker.set(kalshiEvent.event_ticker, {
          ticker: kalshiEvent.event_ticker,
          score,
          category: kalshiEvent.category,
        });
      }
    }
  }

  // Pick per category so the total pool isn't dominated by Elections, then
  // merge and rank globally up to the fetch cap.
  const byCategory = new Map<string, { ticker: string; score: number }[]>();
  for (const v of Array.from(bestByTicker.values())) {
    const entry = byCategory.get(v.category);
    if (entry) {
      entry.push({ ticker: v.ticker, score: v.score });
    } else {
      byCategory.set(v.category, [{ ticker: v.ticker, score: v.score }]);
    }
  }

  const candidates: { ticker: string; score: number }[] = [];
  for (const list of Array.from(byCategory.values())) {
    list.sort((a, b) => b.score - a.score);
    candidates.push(...list.slice(0, PER_CATEGORY_FETCH_CAP));
  }

  const ranked = candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_EVENT_FETCHES);

  return new Set(ranked.map((r) => r.ticker));
}

/* ── Core matching engine ──────────────────────────────────────────── */

export function findArbitragePairs(
  polyEvents: PolymarketEvent[],
  kalshiEvents: KalshiEventInput[],
  kalshiMarketsByEvent: Map<string, KalshiMarketInput[]>
): ArbitragePair[] {
  const pairs: ArbitragePair[] = [];
  const usedKalshiMarkets = new Set<string>();

  // Step 1: Match events using the fuzzy title engine.
  for (const polyEvent of polyEvents) {
    let bestEvent: { event: KalshiEventInput; score: number } | null = null;
    for (const kalshiEvent of kalshiEvents) {
      const { score, conflict } = eventSimilarity(polyEvent.title, kalshiEvent.title);
      if (
        !conflict &&
        score >= EVENT_MATCH_THRESHOLD &&
        (!bestEvent || score > bestEvent.score)
      ) {
        bestEvent = { event: kalshiEvent, score };
      }
    }

    if (!bestEvent) continue;

    const kalshiEvent = bestEvent.event;
    const kalshiMarkets = kalshiMarketsByEvent.get(kalshiEvent.event_ticker) ?? [];
    if (kalshiMarkets.length === 0) continue;

    // Step 2: Within matched events, pair individual markets.
    for (const polyMarket of polyEvent.markets) {
      if (!polyMarket.outcomePrices || polyMarket.outcomePrices.length < 2)
        continue;

      const polyYesPrice = parseFloat(polyMarket.outcomePrices[0]);
      if (isNaN(polyYesPrice) || polyYesPrice < 0) continue;

      const polyQ = `${polyMarket.question} ${polyMarket.groupItemTitle || ''}`;

      let bestMarket: { market: KalshiMarketInput; score: number } | null = null;
      for (const km of kalshiMarkets) {
        if (usedKalshiMarkets.has(km.ticker)) continue;
        const kalshiQ = `${km.yes_sub_title || km.title}`;
        const { score, conflict } = eventSimilarity(polyQ, kalshiQ);
        if (!conflict && score >= 0.15 && (!bestMarket || score > bestMarket.score)) {
          bestMarket = { market: km, score };
        }
      }

      if (!bestMarket) continue;

      const km = bestMarket.market;
      usedKalshiMarkets.add(km.ticker);

      const matchConfidence = bestEvent.score * 0.4 + bestMarket.score * 0.6;

      // ── Prices ──────────────────────────────────────────────────
      const kalshiYesBid = parseFloat(km.yes_bid_dollars) || 0;
      const kalshiYesAsk = parseFloat(km.yes_ask_dollars) || 0;
      const kalshiYesMid =
        kalshiYesAsk > 0 && kalshiYesBid > 0
          ? (kalshiYesBid + kalshiYesAsk) / 2
          : kalshiYesAsk > 0
            ? kalshiYesAsk
            : kalshiYesBid;

      if (kalshiYesMid <= 0) continue;

      const polyBestBid = parseFloat(polyMarket.bestBid) || 0;
      const polyBestAsk = parseFloat(polyMarket.bestAsk) || 0;
      const polyMid =
        polyBestAsk > 0 && polyBestBid > 0
          ? (polyBestBid + polyBestAsk) / 2
          : polyYesPrice;

      const priceDiff = Math.abs(polyMid - kalshiYesMid);
      const priceDiffCents = Math.round(priceDiff * 100);
      const cheaperYes: 'polymarket' | 'kalshi' =
        polyMid < kalshiYesMid ? 'polymarket' : 'kalshi';

      // True locked-in ROI: buy YES cheap + NO(=1−YES) pricey. Cost is
      // cheapYes + (1 − expensiveYes); profit per contract = priceDiff.
      const cheapYes = Math.min(polyMid, kalshiYesMid);
      const expensiveYes = Math.max(polyMid, kalshiYesMid);
      const costToLock = cheapYes + (1 - expensiveYes);
      const arbPercent =
        costToLock > 0 ? (priceDiff / costToLock) * 100 : 0;

      // ── Integrity & anomaly detection ───────────────────────────
      const polySpread = polyBestAsk > 0 && polyBestBid > 0 ? polyBestAsk - polyBestBid : 0;
      const integrity = analyzeMarket({
        volume24h: polyMarket.volume24hr || 0,
        volumeTotal: parseFloat(polyMarket.volume) || 0,
        liquidity: parseFloat(polyMarket.liquidity) || 0,
        spread: polySpread,
        priceChange24h: 0,
      });

      // ── Optimal execution plan ──────────────────────────────────
      const plan = buildExecutionPlan({
        polyYesAsk: polyBestAsk > 0 ? polyBestAsk : polyMid,
        polyNoAsk: polyBestBid > 0 ? 1 - polyBestBid : 1 - polyMid,
        kalshiYesAsk: kalshiYesAsk > 0 ? kalshiYesAsk : kalshiYesMid,
        kalshiNoAsk: kalshiYesBid > 0 ? 1 - kalshiYesBid : 1 - kalshiYesMid,
        maxShares: 100,
      });

      // ── Blended opportunity score ───────────────────────────────
      const scoreBreakdown = scoreOpportunity({
        edgePct: arbPercent,
        volumeUsd: Math.max(polyMarket.volume24hr || 0, parseFloat(km.volume_fp) || 0),
        confidence: matchConfidence,
        risk: Math.max(integrity.riskScore, polySpread > 0 ? Math.min(1, polySpread * 4) : 0.2),
        hoursToExpiry: 24 * 7, // unknown → assume ~1 week
      });

      pairs.push({
        eventName: polyEvent.title || polyMarket.question,
        category: kalshiEvent.category,
        matchScore: matchConfidence,

        poly: {
          question: polyMarket.question,
          yesPrice: polyYesPrice,
          bestBid: polyBestBid,
          bestAsk: polyBestAsk,
          volume24h: polyMarket.volume24hr || 0,
          slug: polyMarket.slug || polyEvent.slug,
          image: polyMarket.image || '',
        },

        kalshi: {
          question: km.yes_sub_title || km.title,
          yesPrice: kalshiYesMid,
          yesBid: kalshiYesBid,
          yesAsk: kalshiYesAsk,
          volume: parseFloat(km.volume_fp) || 0,
          ticker: km.ticker,
          eventTicker: km.event_ticker,
          expirationTime: km.close_time || undefined,
        },

        priceDiffCents,
        cheaperYes,
        arbPercent,
        matchConfidence,
        opportunityScore: scoreBreakdown.total,
        anomalies: integrity.flags,
        plan: plan.viable ? plan : null,
      });
    }
  }

  // De-duplicate: one row per event. Within an event each candidate sub-market
  // otherwise produces its own pair, so "Democratic Presidential Nominee 2028"
  // would appear ~20 times (once per candidate) and dominate the table.
  const byEvent = new Map<string, ArbitragePair>();
  for (const p of pairs) {
    const existing = byEvent.get(p.eventName);
    if (!existing || p.opportunityScore > existing.opportunityScore) {
      byEvent.set(p.eventName, p);
    }
  }

  return Array.from(byEvent.values()).sort(
    (a, b) => b.opportunityScore - a.opportunityScore
  );
}

/* ── Fetch Polymarket events with pricing ─────────────────────────── */

const GAMMA_BASE = 'https://gamma-api.polymarket.com';
const MAX_EVENT_OFFSET = 400; // top events by 24h volume — wider cross-category mix

/**
 * Gamma `/events` returns a bare array. We validate the event-level shape
 * (the part that bit us before — the API returning an error object instead of
 * an array) and keep the per-market mapping defensive, since Gamma sends some
 * fields as strings and `outcomePrices` as a JSON-encoded string.
 */
const GammaEventSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    title: z.string(),
    slug: z.string().optional().default(''),
    markets: z.array(z.unknown()).optional().default([]),
  })
  .passthrough();

const GammaEventsResponseSchema = z.array(GammaEventSchema);

export async function fetchPolymarketEvents(): Promise<PolymarketEvent[]> {
  const allEvents: PolymarketEvent[] = [];

  for (let offset = 0; offset < MAX_EVENT_OFFSET; offset += 100) {
    const url = new URL(`${GAMMA_BASE}/events`);
    url.searchParams.set('active', 'true');
    url.searchParams.set('closed', 'false');
    url.searchParams.set('limit', '100');
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('order', 'volume24hr');
    url.searchParams.set('ascending', 'false');

    let events: z.infer<typeof GammaEventsResponseSchema>;
    try {
      events = await safeFetchJson(
        url.toString(),
        GammaEventsResponseSchema,
        { next: { revalidate: 0 } } as RequestInit,
        { label: `polymarket events o${offset}` }
      );
    } catch (err) {
      // First page failing = real outage → throw so the route serves stale
      // cache. A later page failing = keep the events we already have.
      if (offset === 0) throw err;
      console.warn(`[polymarket] events page o${offset} failed:`, String(err));
      break;
    }

    if (events.length === 0) break;

    for (const ev of events) {
      const markets: PolymarketMarket[] = (
        (ev.markets ?? []) as Record<string, unknown>[]
      ).map((m) => ({
        id: String(m.id ?? ''),
        question: String(m.question ?? ''),
        outcomePrices: parseOutcomePrices(m.outcomePrices),
        bestBid: String(m.bestBid ?? ''),
        bestAsk: String(m.bestAsk ?? ''),
        volume: String(m.volume ?? '0'),
        volume24hr: typeof m.volume24hr === 'number' ? m.volume24hr : 0,
        liquidity: String(m.liquidity ?? '0'),
        slug: String(m.slug ?? ''),
        image: String(m.image ?? ''),
        groupItemTitle: String(m.groupItemTitle ?? ''),
      }));

      allEvents.push({
        id: ev.id,
        title: ev.title,
        slug: ev.slug,
        markets,
      });
    }

    if (events.length < 100) break;
  }

  return allEvents;
}

/** Gamma sends `outcomePrices` as a JSON-encoded string (or sometimes array). */
function parseOutcomePrices(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/* ════════════════════════════════════════════════════════════════════
   EXECUTABLE ARBITRAGE ENGINE (Golden Professor Engine)
   
   Walks order book depth to find true executable profit after fees.
   Outputs profit waterfall, confidence score, and risk flags.
═════════════════════════════════════════════════════════════════════ */

export interface OrderBookLevel {
  price: number;
  size: number;
}

export interface ExecutableArbInput {
  id: string;
  title: string;
  yes: {
    venue: string;
    marketId: string;
    book: { asks: OrderBookLevel[] };
    snapshotAgeMs: number;
  };
  no: {
    venue: string;
    marketId: string;
    book: { asks: OrderBookLevel[] };
    snapshotAgeMs: number;
  };
  matchScore: number;
  daysToResolution: number;
  resolutionClarityScore: number;
  config?: Partial<ExecutableArbConfig>;
}

export interface ExecutableArbConfig {
  targetSize: number;
  minMatchScore: number;
  freshnessGoodMs: number;
  freshnessBadMs: number;
  minExecutableSize: number;
  stressSlippage: number;
  feeRateByVenue: Record<string, number>;
}

export interface ExecutableArbResult {
  id: string;
  title: string;
  legs: { venue: string; action: string; avgPrice: number; size: number }[];
  bestYes: number;
  bestNo: number;
  topGrossEdge: number;
  executableSize: number;
  targetSize: number;
  grossProfitUsd: number;
  feesUsd: number;
  stressCostUsd: number;
  netProfitUsd: number;
  stressNetProfitUsd: number;
  capitalRequiredUsd: number;
  roi: number;
  annualizedRoi: number;
  stressRoi: number;
  grossPerShare: number;
  feesPerShare: number;
  netPerShare: number;
  confidence: number;
  score100: number;
  riskFlags: { severity: number; message: string }[];
  confidenceParts: {
    match: number;
    liquidity: number;
    freshness: number;
    profitQuality: number;
    resolution: number;
  };
  daysToResolution: number;
  professorNotes: string[];
}

function cleanLevels(levels: OrderBookLevel[]): OrderBookLevel[] {
  return levels
    .filter(
      (l) =>
        isFinite(l.price) &&
        isFinite(l.size) &&
        l.size > 0 &&
        l.price > 0 &&
        l.price <= 1
    )
    .sort((a, b) => a.price - b.price)
    .map((l) => ({ price: l.price, size: l.size }));
}

/**
 * Compute executable arbitrage by walking the order book depth.
 *
 * Unlike top-of-book analysis, this finds the true fillable size and
 * profit after consuming multiple price levels on both venues.
 */
export function computeExecutableArbitrage(
  input: ExecutableArbInput
): ExecutableArbResult | null {
  const cfg: ExecutableArbConfig = {
    targetSize: 1000,
    minMatchScore: 0.68,
    freshnessGoodMs: 60000,
    freshnessBadMs: 300000,
    minExecutableSize: 50,
    stressSlippage: 0.005,
    feeRateByVenue: { polymarket: 0.02, kalshi: 0.01 },
    ...input.config,
  };

  const yesLevels = cleanLevels(input.yes.book.asks || []);
  const noLevels = cleanLevels(input.no.book.asks || []);
  if (!yesLevels.length || !noLevels.length) return null;

  const bestYes = yesLevels[0].price;
  const bestNo = noLevels[0].price;
  const targetSize = Math.max(1, cfg.targetSize);
  const rY = cfg.feeRateByVenue[input.yes.venue] ?? 0;
  const rN = cfg.feeRateByVenue[input.no.venue] ?? 0;

  // Walk the book — consume levels until target filled or unprofitable
  let yi = 0,
    ni = 0;
  let yesRemain = yesLevels[0].size;
  let noRemain = noLevels[0].size;
  let targetRemaining = targetSize;
  let filled = 0,
    yesCost = 0,
    noCost = 0,
    proceeds = 0,
    fees = 0;

  while (
    yi < yesLevels.length &&
    ni < noLevels.length &&
    targetRemaining > 0
  ) {
    const y = yesLevels[yi];
    const n = noLevels[ni];
    const chunk = Math.min(yesRemain, noRemain, targetRemaining);
    if (chunk <= 0) break;

    const grossPerShare = 1 - (y.price + n.price);
    const chunkFees = (y.price * rY + n.price * rN) * chunk;

    // Stop if marginal slice is unprofitable
    if (grossPerShare * chunk - chunkFees <= 0) break;

    yesCost += y.price * chunk;
    noCost += n.price * chunk;
    fees += chunkFees;
    proceeds += chunk;
    filled += chunk;
    targetRemaining -= chunk;
    yesRemain -= chunk;
    noRemain -= chunk;

    if (yesRemain <= 1e-9) {
      yi++;
      yesRemain = yesLevels[yi]?.size ?? 0;
    }
    if (noRemain <= 1e-9) {
      ni++;
      noRemain = noLevels[ni]?.size ?? 0;
    }
  }

  if (filled <= 0) return null;

  const totalCost = yesCost + noCost;
  const grossProfit = proceeds - totalCost;
  const netProfit = grossProfit - fees;
  if (netProfit <= 0) return null;

  const capitalRequired = totalCost + fees;
  const roi = netProfit / capitalRequired;
  const days = input.daysToResolution || 0;
  const annualizedRoi =
    days > 0 && roi > -1 ? Math.pow(1 + roi, 365 / days) - 1 : roi * 12;

  // Stress test — extra slippage
  const stressCost = filled * cfg.stressSlippage;
  const stressNet = netProfit - stressCost;
  const stressRoi = stressNet / capitalRequired;

  // Freshness score
  const ageMs = Math.max(
    input.yes.snapshotAgeMs || 0,
    input.no.snapshotAgeMs || 0
  );
  const freshnessScore =
    ageMs <= cfg.freshnessGoodMs
      ? 1
      : ageMs >= cfg.freshnessBadMs
        ? 0.1
        : 1 -
          ((ageMs - cfg.freshnessGoodMs) /
            (cfg.freshnessBadMs - cfg.freshnessGoodMs)) *
            0.9;

  // Liquidity score — how much of target we could fill
  const liquidityScore =
    0.65 * clamp(filled / targetSize, 0, 1) +
    0.35 * clamp(totalCost / 8000, 0, 1);

  // Profit quality — net margin relative to 3% benchmark
  const profitQualityScore = clamp((netProfit / proceeds) / 0.03, 0, 1);

  const matchScore = clamp(input.matchScore ?? 0.5, 0, 1);
  const resolutionClarityScore = clamp(
    input.resolutionClarityScore ?? 0.65,
    0,
    1
  );

  // Confidence — weighted blend
  const confidence = clamp(
    0.30 * matchScore +
      0.25 * liquidityScore +
      0.20 * freshnessScore +
      0.15 * profitQualityScore +
      0.10 * resolutionClarityScore,
    0,
    1
  );

  // Risk flags
  const riskFlags: { severity: number; message: string }[] = [];

  if (matchScore < cfg.minMatchScore) {
    riskFlags.push({
      severity: 2,
      message:
        'Event matching is not strong enough to fully trust this pair.',
    });
  }
  if (ageMs > cfg.freshnessBadMs) {
    riskFlags.push({
      severity: 3,
      message: 'Quotes are stale — the edge may already be gone.',
    });
  } else if (ageMs > cfg.freshnessGoodMs) {
    riskFlags.push({
      severity: 1,
      message: 'Quotes are aging. Verify before executing.',
    });
  }
  if (filled < cfg.minExecutableSize) {
    riskFlags.push({
      severity: 2,
      message: 'Executable size too small for meaningful profit.',
    });
  }
  if (filled < targetSize) {
    riskFlags.push({
      severity: 1,
      message: 'Only part of target size is currently executable.',
    });
  }
  if (stressNet <= 0) {
    riskFlags.push({
      severity: 3,
      message: 'A small amount of extra slippage removes the profit.',
    });
  }
  if (days > 30) {
    riskFlags.push({
      severity: 1,
      message: `Capital locked until resolution (${days} days).`,
    });
  }
  if (resolutionClarityScore < 0.65) {
    riskFlags.push({
      severity: 2,
      message: 'Resolution wording or source may be ambiguous.',
    });
  }

  // Score 0-100
  const score100 = Math.round(
    100 * (0.55 * confidence + 0.45 * clamp(annualizedRoi / 0.25, 0, 1))
  );

  const professorNotes = [
    `Top-of-book gross edge ${((1 - bestYes - bestNo) * 100).toFixed(2)}¢ per pair.`,
    `After executable depth and fees, estimated net profit is $${netProfit.toFixed(2)}.`,
    `Main risk: ${
      riskFlags.length
        ? riskFlags[0].message.toLowerCase()
        : 'no major flags at current settings.'
    }`,
  ];

  return {
    id: input.id,
    title: input.title,
    legs: [
      {
        venue: input.yes.venue,
        action: 'BUY YES',
        avgPrice: yesCost / filled,
        size: filled,
      },
      {
        venue: input.no.venue,
        action: 'BUY NO',
        avgPrice: noCost / filled,
        size: filled,
      },
    ],
    bestYes,
    bestNo,
    topGrossEdge: 1 - bestYes - bestNo,
    executableSize: filled,
    targetSize,
    grossProfitUsd: grossProfit,
    feesUsd: fees,
    stressCostUsd: stressCost,
    netProfitUsd: netProfit,
    stressNetProfitUsd: stressNet,
    capitalRequiredUsd: capitalRequired,
    roi,
    annualizedRoi,
    stressRoi,
    grossPerShare: grossProfit / filled,
    feesPerShare: fees / filled,
    netPerShare: netProfit / filled,
    confidence,
    score100,
    riskFlags,
    confidenceParts: {
      match: matchScore,
      liquidity: liquidityScore,
      freshness: freshnessScore,
      profitQuality: profitQualityScore,
      resolution: resolutionClarityScore,
    },
    daysToResolution: days,
    professorNotes,
  };
}
