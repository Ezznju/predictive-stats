import { NextRequest, NextResponse } from 'next/server';
import { setCacheEntry } from '@/lib/scanner-cache';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * POST /api/kalshi-ingest — writes Kalshi board snapshots into D1.
 *
 * Called by the GitHub Actions refresh job (scripts/refresh-kalshi-data.mjs)
 * because Kalshi rate-limits Cloudflare's egress but GitHub runners are fine.
 * The runner holds no Cloudflare credentials: it sends the built boards here
 * and this route (Bearer CRON_SECRET) persists them. Body:
 *   { trending: TrendingMarket[], smartMoney: KalshiSmartMoneyBoard }
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const trending = body?.trending;
    const smartMoney = body?.smartMoney;
    if (!Array.isArray(trending) || trending.length < 5 || !smartMoney || !Array.isArray(smartMoney.bigMoney)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    await setCacheEntry('kalshi-trending-board', trending);
    await setCacheEntry('kalshi-smart-money-board', smartMoney);
    return NextResponse.json({ ok: true, trending: trending.length, bigMoney: smartMoney.bigMoney.length });
  } catch {
    return NextResponse.json({ error: 'Failed to ingest' }, { status: 500 });
  }
}
