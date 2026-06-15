/**
 * Polymarket public API helpers for the LP Reward Scanner.
 *
 * All endpoints used are public (no API key needed):
 *  - clob.polymarket.com/rewards/markets/multi  → reward-eligible markets
 *  - clob.polymarket.com/book?token_id=...      → order-book depth
 */

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

/* ── Fetch all reward-eligible markets ─────────────────────────────── */

export async function fetchRewardMarkets(): Promise<ScannerMarket[]> {
  const allMarkets: RawPolymarketMarket[] = [];
  let cursor: string | undefined;

  // Paginate through all pages
  for (let page = 0; page < 20; page++) {
    const url = new URL(`${CLOB_BASE}/rewards/markets/multi`);
    url.searchParams.set('limit', '100');
    if (cursor && cursor !== 'LTE=') {
      url.searchParams.set('after_cursor', cursor);
    }

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error(`Polymarket API error: ${res.status} ${res.statusText}`);
      break;
    }

    const json = await res.json();
    const data: RawPolymarketMarket[] = json.data ?? [];
    allMarkets.push(...data);

    cursor = json.next_cursor;
    if (!cursor || cursor === 'LTE=' || data.length < 100) break;
  }

  // Filter to only reward-eligible markets and transform
  return allMarkets
    .filter((m) => m.rewards_min_size > 0 || m.rewards_config.length > 0)
    .map(toScannerMarket)
    .sort((a, b) => b.rewardScore - a.rewardScore);
}

function toScannerMarket(m: RawPolymarketMarket): ScannerMarket {
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
  try {
    const res = await fetch(`${CLOB_BASE}/book?token_id=${tokenId}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
