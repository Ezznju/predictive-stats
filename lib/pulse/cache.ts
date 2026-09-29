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

/* ── TTLs ──
 *
 * These were 30s soft / 2min hard, which meant a full whale-data recompute
 * ran inside the isolate constantly — and on Cloudflare's free tier a Worker
 * gets 10ms CPU per request, so those recomputes were dying mid-run and
 * spamming the CPU-limit notifications. 5min/30min keeps the tracker fresh
 * enough (the feed also ticks client-side) at a fraction of the CPU. */

const PULSE_SOFT_TTL_MS = 5 * 60 * 1000;   // 5 min soft TTL
const PULSE_HARD_TTL_MS = 30 * 60 * 1000;  // 30 min hard TTL

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
