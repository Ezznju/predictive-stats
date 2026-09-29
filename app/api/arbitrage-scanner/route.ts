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
      // The scan is refreshed hourly by the GitHub action (Kalshi rate-limits
      // Cloudflare's egress anyway). serveStaleOnly keeps this route READ-ONLY
      // in the isolate: the multi-second scan never runs inside a Worker
      // (free tier = 10ms CPU/request, it would die mid-scan).
      withSharedCache<ArbitragePair[]>(CACHE_KEY, scanArbitrage, { serveStaleOnly: true }),
      15000
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
    // Empty cache + compute disabled — the hourly GitHub refresh hasn't
    // landed yet. Return a soft "warming" state instead of a 502.
    console.warn('[arbitrage-scanner] serving warming state:', String(err));
    return NextResponse.json(
      { pairs: [], cached: false, warming: true, updatedAt: null },
      { headers: { 'Cache-Control': 'public, s-maxage=60' } }
    );
  }
}
