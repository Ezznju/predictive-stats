/**
 * Polymarket public API helpers for the LP Reward Scanner.
 *
 * All endpoints used are public (no API key needed):
 *  - clob.polymarket.com/rewards/markets/multi  → reward-eligible markets
 *  - clob.polymarket.com/book?token_id=...      → order-book depth
 */

import { z } from 'zod';
import { safeFetchJson } from './safe-fetch';

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
  .object({ rate_per_day: z.number().optional().default(0) })
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

  // Paginate until the API signals the end (empty / sentinel cursor).
  for (let page = 0; page < MAX_REWARD_PAGES; page++) {
    const url = new URL(`${CLOB_BASE}/rewards/markets/multi`);
    url.searchParams.set('limit', '100');
    if (cursor && cursor !== 'LTE=') {
      url.searchParams.set('after_cursor', cursor);
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
    if (!cursor || cursor === 'LTE=' || json.data.length < 100) break;
  }

  // Filter to only reward-eligible markets and transform
  return allMarkets
    .filter((m) => m.rewards_min_size > 0 || m.rewards_config.length > 0)
    .map(toScannerMarket)
    .sort((a, b) => b.rewardScore - a.rewardScore);
}

function toScannerMarket(m: RewardMarketRaw): ScannerMarket {
  const yesToken = m.tokens.find((t) => t.outcome === 'Yes') ?? m.tokens[0];
  const noToken = m.tokens.find((t) => t.outcome === 'No') ?? m.tokens[1];

  const yesPrice = yesToken?.price ?? 0.5;
  const noPrice = noToken?.price ?? 0.5;
  const cheaperPrice = Math.min(yesPrice, noPrice);
  const entryCost = m.rewards_min_size * cheaperPrice;

  // Sum daily rewards from all active configs
  const totalRewardPerDay = m.rewards_config.reduce(
    (sum, rc) => sum + rc.rate_per_day,
    0
  );

  // Reward score: higher is better for the farmer
  // Rewards / competition / entry cost (normalized)
  const effectiveReward = totalRewardPerDay > 0 ? totalRewardPerDay : 0;
  const effectiveComp = Math.max(m.market_competitiveness, 0.01);
  const effectiveEntry = Math.max(entryCost, 1);
  const rewardScore = (effectiveReward / effectiveComp / effectiveEntry) * 1000;

  return {
    conditionId: m.condition_id,
    slug: m.market_slug,
    eventSlug: m.event_slug,
    question: m.question,
    image: m.image,
    rewardPerDay: totalRewardPerDay,
    minShares: m.rewards_min_size,
    maxSpread: m.rewards_max_spread,
    competition: m.market_competitiveness,
    currentSpread: m.spread,
    yesPrice,
    noPrice,
    yesTokenId: yesToken?.token_id ?? '',
    noTokenId: noToken?.token_id ?? '',
    entryCost,
    rewardScore: Number.isFinite(rewardScore) ? rewardScore : 0,
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
