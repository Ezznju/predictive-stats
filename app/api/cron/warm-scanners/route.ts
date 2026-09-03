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
 * Vercel Cron (every 10 min, see vercel.json) pre-warms the shared D1 cache
 * so visitors always find data waiting — they only hit Refresh for latest.
 * Gated by CRON_SECRET (Vercel sends it as Bearer automatically for cron).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const out: Record<string, unknown> = {};

  try {
    const pairs = await withTimeout(scanArbitrage(), 50000);
    await setCacheEntry('arbitrage-scanner', pairs);
    out.arbitrage = { ok: true, pairs: pairs.length };
  } catch (e: unknown) {
    out.arbitrage = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  try {
    const markets = await withTimeout(fetchRewardMarkets(), 50000);
    await setCacheEntry('lp-scanner', markets);
    out.lp = { ok: true, markets: Array.isArray(markets) ? markets.length : 0 };
  } catch (e: unknown) {
    out.lp = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json({ ok: true, warmed: out });
}
