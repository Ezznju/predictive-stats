/**
 * Shared, cross-instance cache for the scanner tools, backed by the
 * `scanner_cache` Supabase table.
 *
 * Replaces the old per-serverless-instance in-memory cache (which forced every
 * cold instance to re-run the 10-15s upstream scan). Now all instances share
 * one cached payload, so the heavy scan runs at most once per TTL window.
 *
 * Reads use the public anon client (the payload is public scanner output).
 * Writes go through the `scanner_cache_set` RPC, gated by ADMIN_API_TOKEN.
 *
 * Every operation is wrapped so a cache failure degrades gracefully to a
 * direct compute rather than breaking the route.
 */

import { waitUntil } from '@vercel/functions';
import { supabase } from './supabase';

export interface CacheEntry<T> {
  payload: T;
  updatedAt: string;
  ageMs: number;
}

/** Read a cached payload. Returns null on miss or any error. */
export async function getCacheEntry<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const { data, error } = await supabase
      .from('scanner_cache')
      .select('payload, updated_at')
      .eq('cache_key', key)
      .maybeSingle();

    if (error || !data) return null;

    const updatedAt = data.updated_at as string;
    return {
      payload: data.payload as T,
      updatedAt,
      ageMs: Date.now() - new Date(updatedAt).getTime(),
    };
  } catch (err) {
    console.warn(`[scanner-cache] read failed for ${key}:`, String(err));
    return null;
  }
}

/** Write a payload via the token-gated RPC. Never throws. */
export async function setCacheEntry(key: string, payload: unknown): Promise<void> {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token) {
    console.warn('[scanner-cache] ADMIN_API_TOKEN missing — skipping cache write');
    return;
  }
  try {
    const { error } = await supabase.rpc('scanner_cache_set', {
      p_token: token,
      p_key: key,
      p_payload: payload,
    });
    if (error) console.warn(`[scanner-cache] write failed for ${key}:`, error.message);
  } catch (err) {
    console.warn(`[scanner-cache] write threw for ${key}:`, String(err));
  }
}

/* ── Stale-while-revalidate orchestration ──────────────────────────── */

const DEFAULT_SOFT_TTL_MS = 5 * 60 * 1000; // serve from cache without refresh
const DEFAULT_HARD_TTL_MS = 30 * 60 * 1000; // beyond this, recompute synchronously

/** Tiny per-instance L1 in front of the shared L2 cache (avoids a DB hit/req). */
const l1 = new Map<string, { payload: unknown; ts: number }>();

export interface CachedResult<T> {
  payload: T;
  updatedAt: string;
  stale: boolean;
  source: 'memory' | 'shared' | 'fresh' | 'stale-fallback';
}

/** Run background work on Vercel; degrade to fire-and-forget locally. */
function scheduleBackground(p: Promise<unknown>): void {
  try {
    waitUntil(p);
  } catch {
    void p.catch(() => {});
  }
}

/**
 * Serve `key` from the shared cache, computing only when necessary:
 *  - fresh (< softTtl)            → return immediately
 *  - stale (softTtl..hardTtl)     → return stale instantly + refresh in background
 *  - missing / older than hardTtl → compute synchronously (stale-fallback on error)
 */
export async function withSharedCache<T>(
  key: string,
  compute: () => Promise<T>,
  opts: { softTtlMs?: number; hardTtlMs?: number } = {}
): Promise<CachedResult<T>> {
  const softTtl = opts.softTtlMs ?? DEFAULT_SOFT_TTL_MS;
  const hardTtl = opts.hardTtlMs ?? DEFAULT_HARD_TTL_MS;

  const mem = l1.get(key);
  if (mem && Date.now() - mem.ts < softTtl) {
    return {
      payload: mem.payload as T,
      updatedAt: new Date(mem.ts).toISOString(),
      stale: false,
      source: 'memory',
    };
  }

  const entry = await getCacheEntry<T>(key);

  if (entry && entry.ageMs < softTtl) {
    l1.set(key, { payload: entry.payload, ts: Date.now() - entry.ageMs });
    return { payload: entry.payload, updatedAt: entry.updatedAt, stale: false, source: 'shared' };
  }

  if (entry && entry.ageMs < hardTtl) {
    scheduleBackground(refreshAndStore(key, compute));
    return { payload: entry.payload, updatedAt: entry.updatedAt, stale: true, source: 'shared' };
  }

  try {
    const fresh = await refreshAndStore(key, compute);
    return { payload: fresh, updatedAt: new Date().toISOString(), stale: false, source: 'fresh' };
  } catch (err) {
    if (entry) {
      console.warn(`[scanner-cache] compute failed for ${key}, serving stale:`, String(err));
      return { payload: entry.payload, updatedAt: entry.updatedAt, stale: true, source: 'stale-fallback' };
    }
    throw err;
  }
}

async function refreshAndStore<T>(key: string, compute: () => Promise<T>): Promise<T> {
  const fresh = await compute();
  l1.set(key, { payload: fresh, ts: Date.now() });
  await setCacheEntry(key, fresh);
  return fresh;
}
