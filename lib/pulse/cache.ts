/**
 * Pulse-specific cache keys and helpers.
 *
 * Uses the existing `withSharedCache` from scanner-cache.ts for
 * stale-while-revalidate caching backed by Supabase.
 */

import { withSharedCache, type CachedResult } from '../scanner-cache';

/* ── Cache key builders ──────────────────────────────────── */

export const PULSE_KEYS = {
  leaderboard: (category: string, period: string) =>
    `pulse:leaderboard:${category}:${period}`,
  whaleFeed: () => 'pulse:whale-feed',
  marketStats: (conditionId: string) =>
    `pulse:market:${conditionId}`,
  walletProfile: (address: string) =>
    `pulse:wallet:${address}`,
  walletTrades: (address: string) =>
    `pulse:wallet-trades:${address}`,
} as const;

/* ── TTLs (shorter than scanner tools — data changes fast) ── */

const PULSE_SOFT_TTL_MS = 2 * 60 * 1000;  // 2 min soft TTL
const PULSE_HARD_TTL_MS = 10 * 60 * 1000;  // 10 min hard TTL

/** Wrapper around withSharedCache with Pulse-specific defaults. */
export async function withPulseCache<T>(
  key: string,
  compute: () => Promise<T>
): Promise<CachedResult<T>> {
  return withSharedCache(key, compute, {
    softTtlMs: PULSE_SOFT_TTL_MS,
    hardTtlMs: PULSE_HARD_TTL_MS,
  });
}
