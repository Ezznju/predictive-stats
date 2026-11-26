/**
 * Shared, cross-instance cache for the scanner tools, backed by the D1
 * `scanner_cache` table.
 *
 * Uses native Cloudflare D1 binding when available (via lib/d1.ts) and
 * Cloudflare Workers' real `ctx.waitUntil()` (via lib/cf-runtime.ts) so
 * stale-while-revalidate background refreshes complete reliably on the
 * Workers Paid Plan without blocking visitor responses.
 */

import { d1Query as sharedD1Query, d1Execute as sharedD1Execute } from '@/lib/d1';
import { cfWaitUntil } from '@/lib/cf-runtime';

async function safeD1Query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  try {
    return await sharedD1Query<T>(sql, params);
  } catch {
    return [];
  }
}

async function safeD1Execute(sql: string, params?: any[]): Promise<void> {
  try {
    await sharedD1Execute(sql, params);
  } catch (err) {
    console.warn('[scanner-cache] D1 write error:', String(err));
  }
}

export interface CacheEntry<T> {
  payload: T;
  updatedAt: string;
  ageMs: number;
}

export async function getCacheEntry<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const rows = await safeD1Query<{ payload: string; updated_at: string }>(
      `SELECT payload, updated_at FROM scanner_cache WHERE cache_key = ? LIMIT 1`,
      [key]
    );
    if (rows.length === 0) return null;
    const data = rows[0];
    const updatedAt = data.updated_at as string;
    return {
      payload: JSON.parse(data.payload),
      updatedAt,
      ageMs: Date.now() - new Date(updatedAt).getTime(),
    };
  } catch (err) {
    console.warn(`[scanner-cache] read failed for ${key}:`, String(err));
    return null;
  }
}

/**
 * Batch-read multiple scanner cache snapshots in a single D1 round-trip.
 */
export async function getCacheEntries(
  keys: string[]
): Promise<Map<string, CacheEntry<unknown>>> {
  const out = new Map<string, CacheEntry<unknown>>();
  if (keys.length === 0) return out;
  try {
    const placeholders = keys.map(() => '?').join(', ');
    const rows = await safeD1Query<{ cache_key: string; payload: string; updated_at: string }>(
      `SELECT cache_key, payload, updated_at FROM scanner_cache WHERE cache_key IN (${placeholders})`,
      keys
    );
    const now = Date.now();
    for (const row of rows) {
      try {
        out.set(row.cache_key, {
          payload: JSON.parse(row.payload),
          updatedAt: row.updated_at,
          ageMs: now - new Date(row.updated_at).getTime(),
        });
      } catch {
        // skip malformed entry
      }
    }
  } catch (err) {
    console.warn('[scanner-cache] batch read failed:', String(err));
  }
  return out;
}

export async function setCacheEntry(key: string, payload: unknown): Promise<void> {
  await safeD1Execute(
    `INSERT OR REPLACE INTO scanner_cache (cache_key, payload, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
    [key, JSON.stringify(payload)]
  );
}

const DEFAULT_SOFT_TTL_MS = 5 * 60 * 1000;
const DEFAULT_HARD_TTL_MS = 30 * 60 * 1000;

const l1 = new Map<string, { payload: unknown; ts: number }>();

export interface CachedResult<T> {
  payload: T;
  updatedAt: string;
  stale: boolean;
  source: 'memory' | 'shared' | 'fresh' | 'stale-fallback';
}

export async function withSharedCache<T>(
  key: string,
  compute: () => Promise<T>,
  opts: { softTtlMs?: number; hardTtlMs?: number; serveStaleOnly?: boolean } = {}
): Promise<CachedResult<T>> {
  const softTtl = opts.softTtlMs ?? DEFAULT_SOFT_TTL_MS;
  const hardTtl = opts.hardTtlMs ?? DEFAULT_HARD_TTL_MS;

  // serveStaleOnly: for scans refreshed by an external worker (GitHub Actions
  // posting to /api/board-ingest because Kalshi 429s Cloudflare egress IPs).
  if (opts.serveStaleOnly) {
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
    if (entry) {
      l1.set(key, { payload: entry.payload, ts: Date.now() - entry.ageMs });
      return { payload: entry.payload, updatedAt: entry.updatedAt, stale: entry.ageMs > hardTtl, source: 'shared' };
    }
    throw new Error(`[scanner-cache] ${key} is empty and compute is disabled`);
  }

  const mem = l1.get(key);
  if (mem && Date.now() - mem.ts < softTtl) {
    return {
      payload: mem.payload as T,
      updatedAt: new Date(mem.ts).toISOString(),
      stale: false,
      source: 'memory',
    };
  }

  let entry = await getCacheEntry<T>(key);

  if (!entry) {
    await new Promise((r) => setTimeout(r, 300));
    entry = await getCacheEntry<T>(key);
  }

  if (entry && entry.ageMs < softTtl) {
    l1.set(key, { payload: entry.payload, ts: Date.now() - entry.ageMs });
    return { payload: entry.payload, updatedAt: entry.updatedAt, stale: false, source: 'shared' };
  }

  if (entry && entry.ageMs < hardTtl) {
    cfWaitUntil(refreshAndStore(key, compute));
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
