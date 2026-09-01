/**
 * Shared, cross-instance cache for the scanner tools, backed by the D1
 * `scanner_cache` table.
 *
 * Replaces the old per-serverless-instance in-memory cache (which forced every
 * cold instance to re-run the 10-15s upstream scan). Now all instances share
 * one cached payload, so the heavy scan runs at most once per TTL window.
 *
 * Every operation is wrapped so a cache failure degrades gracefully to a
 * direct compute rather than breaking the route.
 */

import { waitUntil } from '@vercel/functions';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const DATABASE_ID = process.env.D1_DATABASE_ID!;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}`;

async function d1Query(sql: string, params?: any[]): Promise<any[]> {
  try {
    const res = await fetch(`${BASE}/raw`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, params }),
    });
    const data = await res.json();
    if (!data.success) return [];
    const result = data.result;
    if (Array.isArray(result) && result[0]?.results?.rows) {
      const cols: string[] = result[0].results.columns || [];
      return result[0].results.rows.map((row: any[]) => {
        const obj: any = {};
        cols.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      });
    }
    return [];
  } catch {
    return [];
  }
}

async function d1Execute(sql: string, params?: any[]): Promise<void> {
  try {
    await fetch(`${BASE}/raw`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, params }),
    });
  } catch {}
}

export interface CacheEntry<T> {
  payload: T;
  updatedAt: string;
  ageMs: number;
}

export async function getCacheEntry<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const rows = await d1Query(
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

export async function setCacheEntry(key: string, payload: unknown): Promise<void> {
  await d1Execute(
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

function scheduleBackground(p: Promise<unknown>): void {
  try {
    waitUntil(p);
  } catch {
    void p.catch(() => {});
  }
}

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
