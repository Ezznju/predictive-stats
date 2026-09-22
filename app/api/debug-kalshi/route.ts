import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * TEMPORARY diagnostic route (CF migration): reports the exact failure the
 * Kalshi fetchers hit from the Workers runtime. Removed after debugging.
 */
export async function GET() {
  const out: Record<string, unknown> = {};
  const t0 = Date.now();

  try {
    const r = await fetch(
      'https://api.elections.kalshi.com/trade-api/v2/events?limit=100&status=open&with_nested_markets=true',
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) }
    );
    out.eventsStatus = r.status;
    out.retryAfter = r.headers.get('retry-after');
    const t = await r.text();
    out.sample = t.slice(0, 120);
  } catch (e) {
    out.eventsError = String(e);
  }
  out.eventsMs = Date.now() - t0;

  const t1 = Date.now();
  try {
    const r2 = await fetch(
      'https://api.elections.kalshi.com/trade-api/v2/markets/KXPRESNOMR-28-RNOMCRUZ-29/orderbook',
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) }
    );
    out.orderbookStatus = r2.status;
    out.orderbookSample = (await r2.text()).slice(0, 120);
  } catch (e) {
    out.orderbookError = String(e);
  }
  out.orderbookMs = Date.now() - t1;

  return NextResponse.json(out);
}
