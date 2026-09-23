import { NextResponse } from 'next/server';
import { type ArbitragePair } from '@/lib/arbitrage';
import { scanArbitrage } from '@/lib/arbitrage-scan';
import { withSharedCache } from '@/lib/scanner-cache';
export const runtime = 'edge';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CACHE_KEY = 'arbitrage-scanner';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Scan timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/* ── GET /api/arbitrage-scanner ────────────────────────────────────── */

export async function GET() {
  const scanStart = Date.now();
  try {
    const result = await withTimeout(
      // 48h hard TTL backstop: the daily pre-warm cron guarantees an entry
      // <24h old, so visitors always get instant data + background refresh
      // and never sit through a cold 10-25s scan.
      withSharedCache<ArbitragePair[]>(CACHE_KEY, scanArbitrage, { hardTtlMs: 48 * 60 * 60 * 1000 }),
      50000
    );

    // Pairs now carry real order-book depth (pair.depth) computed by the
    // scan itself, net of Kalshi fees — no synthetic books here anymore.
    const pairs = result.payload || [];

    console.log(
      `[arbitrage-scanner] pairs=${pairs.length} source=${result.source} cached=${result.source !== 'fresh'} coldScanMs=${Date.now() - scanStart}`
    );

    return NextResponse.json(
      {
        pairs,
        cached: result.source !== 'fresh',
        stale: result.stale,
        updatedAt: result.updatedAt,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      }
    );
  } catch (err) {
    console.error('Arbitrage Scanner fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 502 }
    );
  }
}
