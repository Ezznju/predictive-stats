/**
 * Polymarket public API helpers for the LP Reward Scanner.
 *
 * All endpoints used are public (no API key needed):
 *  - clob.polymarket.com/rewards/markets/multi  → reward-eligible markets
 *  - clob.polymarket.com/book?token_id=...      → order-book depth
 */

import { z } from 'zod';
import { safeFetchJson } from './safe-fetch';
import { scoreOpportunity } from './scoring';
import { analyzeMarket, type AnomalyReport } from './anomaly';
import { round } from './intel';

/* ── Types ─────────────────────────────────────────────────────────── */

export interface RewardConfig {
  asset_address: string;
  start_date: string;
  end_date: string;
  rate_per_day: number;
  total_rewards: number;
  id: number;
}

export interface RawPolymarketMarket {
  condition_id: string;
  market_id: string;
  market_slug: string;
  question: string;
  image: string;
  market_competitiveness: number;
  rewards_config: RewardConfig[];
  rewards_max_spread: number;
  rewards_min_size: number;
  spread: number;
  tokens: { token_id: string; outcome: string; price: number }[];
  group_item_title: string;
  volume_24hr: number;
  event_id: string;
  event_slug: string;
  created_at: string;
  one_day_price_change: number;
  end_date: string;
}

/** Cleaned & enriched row for the scanner UI */
export interface ScannerMarket {
  conditionId: string;
  slug: string;
  eventSlug: string;
  question: string;
  image: string;
  /** Daily USDC reward from reward pool */
  rewardPerDay: number;
  /** Minimum qualifying shares */
  minShares: number;
  /** Maximum spread from midpoint (in cents) */
  maxSpread: number;
  /** Raw competitiveness score (lower = better) */
  competition: number;
  /** Current spread (decimal, e.g. 0.02 = 2c) */
  currentSpread: number;
  /** YES token price */
  yesPrice: number;
  /** NO token price */
  noPrice: number;
  /** YES token ID (for order book lookup) */
  yesTokenId: string;
  /** NO token ID (for order book lookup) */
  noTokenId: string;
  /** Estimated entry cost: min_shares × cheaper side price */
  entryCost: number;
  /** Reward efficiency: rewardPerDay / max(competition, 1) / max(entryCost, 1) × 1000 */
  rewardScore: number;
  /** 0..100 blended opportunity score (profit + liquidity + risk + time). */
  opportunityScore: number;
  /** Realistic annualised reward APR (%) accounting for competition dilution. */
  aprPct: number;
  /** Headline APR assuming solo farming (reference only, not displayed as primary). */
  headlineAprPct: number;
  /** Realistic APR after competition modeling. */
  realisticAprPct: number;
  /** Your estimated share of the reward pool (0..1). */
  yourShare: number;
  /** Whether realistic earnings break even before resolution. */
  breaksEven: boolean;
  /** Days to break even at realistic pace, or null if never. */
  breakEvenDays: number | null;
  /** True if current spread exceeds qualifying max (earns $0). */
  spreadViolation: boolean;
  /** Reward window remaining in hours (Infinity if open-ended). */
  hoursRemaining: number;
  /** Integrity flags (wash trading, wide spread, thin book…). */
  anomalies: import('./anomaly').AnomalyFlag[];
  /** True if flagged critical (should be hidden by default). */
  blocked: boolean;
  /** 24h volume */
  volume24h: number;
  /** End date */
  endDate: string;
}

export interface OrderBookLevel {
  price: string;
  size: string;
}

export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  market: string;
  asset_id: string;
  hash: string;
  timestamp: string;
}

/* ── Constants ─────────────────────────────────────────────────────── */

const CLOB_BASE = 'https://clob.polymarket.com';
const MAX_REWARD_PAGES = 30; // safety cap; loop normally exits on empty cursor

/* ── Schemas ───────────────────────────────────────────────────────── */

const RewardConfigSchema = z
  .object({
    rate_per_day: z.number().optional().default(0),
    end_date: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

const RewardMarketSchema = z
  .object({
    condition_id: z.string().optional().default(''),
    market_slug: z.string().optional().default(''),
    event_slug: z.string().optional().default(''),
    question: z.string().optional().default(''),
    image: z.string().optional().default(''),
    market_competitiveness: z.number().optional().default(0),
    rewards_config: z.array(RewardConfigSchema).optional().default([]),
    rewards_max_spread: z.number().optional().default(0),
    rewards_min_size: z.number().optional().default(0),
    spread: z.number().optional().default(0),
    tokens: z
      .array(
        z
          .object({
            token_id: z.string().optional().default(''),
            outcome: z.string().optional().default(''),
            price: z.number().optional().default(0.5),
          })
          .passthrough()
      )
      .optional()
      .default([]),
    volume_24hr: z.number().optional().default(0),
    one_day_price_change: z.number().optional().default(0),
    end_date: z.string().optional().default(''),
  })
  .passthrough();

const RewardMarketsResponseSchema = z.object({
  data: z.array(RewardMarketSchema).default([]),
  next_cursor: z.string().optional().default(''),
});

type RewardMarketRaw = z.infer<typeof RewardMarketSchema>;

const OrderBookSchema = z
  .object({
    bids: z
      .array(z.object({ price: z.string(), size: z.string() }).passthrough())
      .default([]),
    asks: z
      .array(z.object({ price: z.string(), size: z.string() }).passthrough())
      .default([]),
    market: z.string().optional().default(''),
    asset_id: z.string().optional().default(''),
    hash: z.string().optional().default(''),
    timestamp: z.string().optional().default(''),
  })
  .passthrough();

/* ── Fetch all reward-eligible markets ─────────────────────────────── */

export async function fetchRewardMarkets(): Promise<ScannerMarket[]> {
  const allMarkets: RewardMarketRaw[] = [];
  let cursor: string | undefined;
  const seenCursors = new Set<string>();

  // Paginate until the API signals the end (empty / sentinel cursor).
  for (let page = 0; page < MAX_REWARD_PAGES; page++) {
    const url = new URL(`${CLOB_BASE}/rewards/markets/multi`);
    url.searchParams.set('limit', '100');
    if (cursor && cursor !== 'LTE=') {
      // API expects `next_cursor` (verified: it advances and returns new data;
      // `after_cursor` is silently ignored and would loop on page 1 forever).
      url.searchParams.set('next_cursor', cursor);
    }

    // Throws after retries — caller (route) will serve stale cache.
    const json = await safeFetchJson(
      url.toString(),
      RewardMarketsResponseSchema,
      { next: { revalidate: 0 } } as RequestInit,
      { label: `polymarket rewards p${page}` }
    );

    allMarkets.push(...json.data);
    cursor = json.next_cursor || undefined;
    // Guard: if the API ever re-sends a cursor we've already followed,
    // stop instead of re-downloading the same page until MAX_REWARD_PAGES.
    if (cursor && seenCursors.has(cursor)) break;
    if (cursor) seenCursors.add(cursor);
    if (!cursor || cursor === 'LTE=' || json.data.length < 100) break;
  }

  // Filter, dedupe, and transform
  // Dedupe by condition_id (API may return same market with different reward configs)
  const dedupedMap = new Map<string, RewardMarketRaw>();
  for (const m of allMarkets) {
    const id = m.condition_id;
    if (!id) continue;
    const existing = dedupedMap.get(id);
    if (existing) {
      // Merge reward configs from duplicate entries
      const mergedConfigs = [...existing.rewards_config, ...m.rewards_config];
      existing.rewards_config = mergedConfigs;
      // Keep higher min size
      existing.rewards_min_size = Math.max(existing.rewards_min_size, m.rewards_min_size);
      // Keep wider max spread
      existing.rewards_max_spread = Math.max(existing.rewards_max_spread, m.rewards_max_spread);
    } else {
      dedupedMap.set(id, { ...m });
    }
  }

  return Array.from(dedupedMap.values())
    .filter((m) => {
      // Must have reward config
      if (!m.rewards_config.length || m.rewards_min_size <= 0) return false;
      // Must actually pay rewards (not $0/day)
      const totalReward = m.rewards_config.reduce((sum, rc) => sum + (rc.rate_per_day ?? 0), 0);
      if (totalReward <= 0) return false;
      return true;
    })
    .map(toScannerMarket)
    .sort((a, b) => b.rewardScore - a.rewardScore);
}

function toScannerMarket(m: RewardMarketRaw): ScannerMarket {
  const yesToken = m.tokens.find((t) => t.outcome === 'Yes') ?? m.tokens[0];
  const noToken = m.tokens.find((t) => t.outcome === 'No') ?? m.tokens[1];

  const yesPrice = yesToken?.price ?? 0.5;
  const noTokenPrice = noToken?.price ?? 0.5;
  const noPrice = 1 - noTokenPrice; // Kalshi/poly convention: NO = 1 - YES
  const cheaperPrice = Math.min(yesPrice, noPrice);
  const entryCost = m.rewards_min_size * cheaperPrice;

  // Sum daily rewards from all active configs
  const totalRewardPerDay = m.rewards_config.reduce(
    (sum, rc) => sum + rc.rate_per_day,
    0
  );

  // Reward window remaining (hours) from the latest reward config end date.
  const endDates = m.rewards_config
    .map((rc) => (rc.end_date ? new Date(rc.end_date).getTime() : NaN))
    .filter((t) => !Number.isNaN(t));
  const latestEnd = endDates.length ? Math.max(...endDates) : NaN;
  const hoursRemaining = Number.isFinite(latestEnd)
    ? Math.max(0, (latestEnd - Date.now()) / 3_600_000)
    : Infinity;

  // Spread violation: current spread exceeds qualifying max = $0 rewards
  const spreadViolation = m.rewards_max_spread > 0 && m.spread > m.rewards_max_spread;

  // Headline APR (solo, no competition — for reference only)
  const headlineAprPct = (() => {
    if (totalRewardPerDay <= 0 || entryCost <= 0 || !Number.isFinite(hoursRemaining))
      return 0;
    const windowDays = Math.max(hoursRemaining / 24, 1);
    const totalReward = totalRewardPerDay * windowDays;
    const roi = totalReward / entryCost;
    const years = windowDays / 365;
    return years > 0 ? round((roi / years) * 100, 1) : round(roi * 100, 1);
  })();

  // Realistic APR — models competition dilution
  // Your share of rewards = your_liquidity / (your_liquidity + competitor_liquidity)
  // competitor_liquidity ≈ competition × entryCost (competition = number of qualifying LPs)
  const compLiquidity = Math.max(m.market_competitiveness, 0) * entryCost;
  const yourShare = entryCost + compLiquidity > 0
    ? entryCost / (entryCost + compLiquidity)
    : 1;
  // Apply time decay — if market resolves soon, you earn less total
  const windowDays = Number.isFinite(hoursRemaining) ? Math.max(hoursRemaining / 24, 1) : 365;
  const totalRewardSolo = totalRewardPerDay * windowDays;
  const totalRewardRealistic = totalRewardSolo * yourShare;
  const realisticRoi = entryCost > 0 ? totalRewardRealistic / entryCost : 0;
  const realisticYears = windowDays / 365;
  const realisticAprPct = realisticYears > 0
    ? round((realisticRoi / realisticYears) * 100, 1)
    : round(realisticRoi * 100, 1);

  // Break-even analysis: does realistic return exceed entry cost before resolution?
  const realisticEarnings = totalRewardPerDay * windowDays * yourShare;
  const breaksEven = realisticEarnings >= entryCost;
  const breakEvenDays = totalRewardPerDay * yourShare > 0
    ? entryCost / (totalRewardPerDay * yourShare)
    : Infinity;

  // Reward efficiency: rewards / competition / entry cost (normalized).
  const effectiveComp = Math.max(m.market_competitiveness, 0.01);
  const effectiveEntry = Math.max(entryCost, 1);
  const rewardScore = spreadViolation
    ? 0
    : (totalRewardPerDay / effectiveComp / effectiveEntry) * 1000;

  // Integrity / anomaly scan on this market.
  const report: AnomalyReport = analyzeMarket({
    volume24h: m.volume_24hr,
    volumeTotal: 0,
    liquidity: effectiveEntry * 1000, // rough proxy from min order
    spread: m.spread,
    priceChange24h: m.one_day_price_change ?? 0,
  });

  // Spread violation is a hard blocker
  if (spreadViolation) {
    report.flags.push({
      kind: 'spread_violation',
      severity: 'critical',
      message: `Current spread (${(m.spread * 100).toFixed(1)}¢) exceeds qualifying max (${(m.rewards_max_spread * 100).toFixed(1)}¢) — earns $0 in rewards`,
      value: m.spread,
    });
    report.blocked = true;
  }

  // Blended opportunity score (0..100).
  const breakdown = scoreOpportunity({
    edgePct: realisticAprPct > 0 ? Math.min(realisticAprPct, 500) / 10 : totalRewardPerDay * 2,
    volumeUsd: m.volume_24hr,
    confidence: Math.max(0.4, 1 - Math.min(1, m.market_competitiveness / 500)),
    risk: report.riskScore,
    hoursToExpiry: hoursRemaining,
  });

  return {
    conditionId: m.condition_id,
    slug: m.market_slug,
    eventSlug: m.event_slug,
    question: m.question,
    image: m.image,
    rewardPerDay: round(totalRewardPerDay, 4),
    minShares: m.rewards_min_size,
    maxSpread: m.rewards_max_spread,
    competition: m.market_competitiveness,
    currentSpread: m.spread,
    yesPrice,
    noPrice,
    yesTokenId: yesToken?.token_id ?? '',
    noTokenId: noToken?.token_id ?? '',
    entryCost: round(entryCost, 2),
    rewardScore: Number.isFinite(rewardScore) ? round(rewardScore, 2) : 0,
    opportunityScore: breakdown.total,
    aprPct: realisticAprPct,
    headlineAprPct,
    realisticAprPct,
    yourShare,
    breaksEven,
    breakEvenDays: Number.isFinite(breakEvenDays) ? breakEvenDays : null,
    spreadViolation,
    hoursRemaining,
    anomalies: report.flags,
    blocked: report.blocked,
    volume24h: m.volume_24hr,
    endDate: m.end_date,
  };
}

/* ── Fetch order book for a single token ───────────────────────────── */

export async function fetchOrderBook(tokenId: string): Promise<OrderBook | null> {
  // Best-effort: a single failed book lookup shouldn't surface as an error.
  try {
    const book = await safeFetchJson(
      `${CLOB_BASE}/book?token_id=${encodeURIComponent(tokenId)}`,
      OrderBookSchema,
      { next: { revalidate: 0 } } as RequestInit,
      { label: `polymarket book ${tokenId}`, retries: 2 }
    );
    return book as OrderBook;
  } catch (err) {
    console.warn(`[polymarket] order book fetch failed for ${tokenId}:`, String(err));
    return null;
  }
}
