/**
 * Polymarket Data API client for Prediction Pulse.
 *
 * Fetches leaderboard, trades, holders, and wallet profiles from
 * the public Data API at data-api.polymarket.com.
 *
 * All endpoints are public (no auth required).
 * Rate limit: ~1,000 req/10s — we stay well under with cached reads.
 */

import { safeFetchJson, FetchError } from '../safe-fetch';
import type {
  LeaderboardEntry,
  Trade,
  MarketHolders,
  GammaEvent,
  WalletProfile,
} from './types';

const DATA_API = 'https://data-api.polymarket.com';
const GAMMA_API = 'https://gamma-api.polymarket.com';

/* ── Leaderboard ─────────────────────────────────────────── */

export async function fetchLeaderboard(opts: {
  category?: string;
  timePeriod?: string;
  orderBy?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<LeaderboardEntry[]> {
  const params = new URLSearchParams({
    category: opts.category ?? 'OVERALL',
    timePeriod: opts.timePeriod ?? 'ALL',
    orderBy: opts.orderBy ?? 'PNL',
    limit: String(opts.limit ?? 50),
    offset: String(opts.offset ?? 0),
  });

  return safeFetchJson<LeaderboardEntry[]>(
    `${DATA_API}/v1/leaderboard?${params}`,
    undefined,
    {},
    { label: 'pulse-leaderboard' }
  );
}

/* ── Trades ──────────────────────────────────────────────── */

export async function fetchTrades(opts: {
  user?: string;
  market?: string;
  side?: string;
  limit?: number;
  offset?: number;
  start?: number;
  end?: number;
  filterType?: string;
  filterAmount?: number;
} = {}): Promise<Trade[]> {
  const params = new URLSearchParams();

  if (opts.user) params.set('user', opts.user);
  if (opts.market) params.set('market', opts.market);
  if (opts.side) params.set('side', opts.side);
  if (opts.start) params.set('start', String(opts.start));
  if (opts.end) params.set('end', String(opts.end));
  if (opts.filterType) params.set('filterType', opts.filterType);
  if (opts.filterAmount) params.set('filterAmount', String(opts.filterAmount));
  params.set('limit', String(opts.limit ?? 100));
  params.set('offset', String(opts.offset ?? 0));

  return safeFetchJson<Trade[]>(
    `${DATA_API}/trades?${params}`,
    undefined,
    {},
    { label: 'pulse-trades' }
  );
}

/* ── Top holders ─────────────────────────────────────────── */

export async function fetchHolders(conditionId: string): Promise<MarketHolders[]> {
  const params = new URLSearchParams({
    market: conditionId,
    limit: '20',
  });

  return safeFetchJson<MarketHolders[]>(
    `${DATA_API}/holders?${params}`,
    undefined,
    {},
    { label: 'pulse-holders' }
  );
}

/* ── Wallet profile ──────────────────────────────────────── */

export async function fetchWalletProfile(address: string): Promise<WalletProfile | null> {
  try {
    const res = await safeFetchJson<Record<string, unknown>>(
      `${DATA_API}/v1/user/${address}`,
      undefined,
      {},
      { label: 'pulse-wallet-profile', retries: 1 }
    );

    return {
      proxyWallet: address,
      username: (res.userName as string) ?? (res.pseudonym as string) ?? '',
      bio: (res.bio as string) ?? '',
      profileImage: (res.profileImage as string) ?? '',
      xUsername: (res.xUsername as string) ?? '',
    };
  } catch (err) {
    if (err instanceof FetchError && err.status === 404) return null;
    throw err;
  }
}

/* ── Gamma events (market metadata) ──────────────────────── */

export async function fetchGammaEvents(opts: {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  order?: string;
  ascending?: boolean;
} = {}): Promise<GammaEvent[]> {
  const params = new URLSearchParams();

  params.set('limit', String(opts.limit ?? 100));
  params.set('offset', String(opts.offset ?? 0));
  if (opts.active !== undefined) params.set('active', String(opts.active));
  if (opts.closed !== undefined) params.set('closed', String(opts.closed));
  if (opts.order) params.set('order', opts.order);
  if (opts.ascending !== undefined) params.set('ascending', String(opts.ascending));

  return safeFetchJson<GammaEvent[]>(
    `${GAMMA_API}/events?${params}`,
    undefined,
    {},
    { label: 'pulse-gamma-events' }
  );
}

/* ── Batch: fetch recent whale trades across top markets ─── */

/**
 * Fetch the most recent trades across multiple condition IDs.
 * Returns trades sorted by timestamp descending.
 */
export async function fetchRecentTradesForMarkets(
  conditionIds: string[],
  limitPerMarket: number = 20
): Promise<Trade[]> {
  const batches = conditionIds.slice(0, 20);

  const results = await Promise.allSettled(
    batches.map((cid) =>
      fetchTrades({ market: cid, limit: limitPerMarket })
    )
  );

  const allTrades: Trade[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allTrades.push(...result.value);
    }
  }

  allTrades.sort((a, b) => b.timestamp - a.timestamp);
  return allTrades;
}
