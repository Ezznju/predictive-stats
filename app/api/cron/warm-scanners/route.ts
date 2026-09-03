import { NextRequest, NextResponse } from 'next/server';
import { setCacheEntry } from '@/lib/scanner-cache';
import { scanArbitrage } from '@/lib/arbitrage-scan';
import { fetchRewardMarkets } from '@/lib/polymarket';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Warm timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * GET /api/cron/warm-scanners
 * Vercel Cron (daily 05:30 UTC, see vercel.json — Hobby plan max) pre-warms
 * the shared D1 cache so visitors always find data waiting — they only hit
 * Refresh for latest. Daytime visitors keep it minutes-fresh via background
 * refreshes; the 48h hard TTL means a cold wait effectively never happens.
 * Gated by CRON_SECRET (Vercel sends it as Bearer automatically for cron).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parallel: worst case ≈ slowest scan (~50s cap each), fits maxDuration 60.
  // Sequential would risk 25s + 50s+ > 60s and a killed function.
  const [arbitrage, lp] = await Promise.all([
    (async () => {
      const pairs = await withTimeout(scanArbitrage(), 50000);
      await setCacheEntry('arbitrage-scanner', pairs);
      return { ok: true as const, pairs: pairs.length };
    })().catch((e: unknown) => ({ ok: false as const, error: e instanceof Error ? e.message : String(e) })),
    (async () => {
      const markets = await withTimeout(fetchRewardMarkets(), 50000);
      await setCacheEntry('lp-scanner', markets);
      return { ok: true as const, markets: Array.isArray(markets) ? markets.length : 0 };
    })().catch((e: unknown) => ({ ok: false as const, error: e instanceof Error ? e.message : String(e) })),
  ]);

  return NextResponse.json({ ok: true, warmed: { arbitrage, lp } });
}
