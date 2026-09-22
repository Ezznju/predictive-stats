import { NextRequest, NextResponse } from 'next/server';
import { setCacheEntry } from '@/lib/scanner-cache';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * POST /api/board-ingest — writes scanner/board snapshots into D1.
 *
 * Called by the GitHub Actions refresh job (scripts/refresh-kalshi-data.mjs
 * and scripts/refresh-arbitrage.ts) because Kalshi rate-limits Cloudflare's
 * egress but GitHub runners are fine. The runner holds no Cloudflare
 * credentials: it sends built payloads here and this route (Bearer
 * CRON_SECRET) persists them.
 *
 * Body (any subset):
 *   { trending?: TrendingMarket[], smartMoney?: KalshiSmartMoneyBoard, arbitrage?: ArbitragePair[] }
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const written: Record<string, number> = {};

    const { trending, smartMoney, arbitrage } = body ?? {};

    if (Array.isArray(trending) && trending.length >= 5) {
      await setCacheEntry('kalshi-trending-board', trending);
      written.trending = trending.length;
    }
    if (smartMoney && Array.isArray(smartMoney.bigMoney) && smartMoney.bigMoney.length >= 3) {
      await setCacheEntry('kalshi-smart-money-board', smartMoney);
      written.smartMoney = smartMoney.bigMoney.length;
    }
    if (Array.isArray(arbitrage) && arbitrage.length >= 1) {
      await setCacheEntry('arbitrage-scanner', arbitrage);
      written.arbitrage = arbitrage.length;
    }

    if (Object.keys(written).length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, ...written });
  } catch {
    return NextResponse.json({ error: 'Failed to ingest' }, { status: 500 });
  }
}
