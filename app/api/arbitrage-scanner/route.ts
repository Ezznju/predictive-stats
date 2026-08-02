import { NextResponse } from 'next/server';
import {
  fetchKalshiEvents,
  fetchKalshiMarketsForEvent,
  type KalshiMarket,
} from '@/lib/kalshi';
import {
  fetchPolymarketEvents,
  findArbitragePairs,
  preMatchEvents,
  computeExecutableArbitrage,
  type ArbitragePair,
} from '@/lib/arbitrage';
import { withSharedCache } from '@/lib/scanner-cache';
import { pMap } from '@/lib/async-utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const CACHE_KEY = 'arbitrage-scanner';

/* ── Heavy scan: Polymarket × Kalshi cross-platform arbitrage ──────── */

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Scan timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function scanArbitrage(): Promise<ArbitragePair[]> {
  // Step 1: fetch events from both platforms in parallel
  const [polyEvents, kalshiEvents] = await Promise.all([
    fetchPolymarketEvents(),
    fetchKalshiEvents(),
  ]);

  // Step 2: pre-match events by title similarity so we only fetch markets
  // for events that plausibly match (saves 150+ API calls)
  const relevantKalshiEvents = kalshiEvents.filter(
    (ev) => ev.category !== 'Sports'
  );
  const matchedTickers = preMatchEvents(polyEvents, relevantKalshiEvents);

  // Step 3: fetch markets only for matched Kalshi events, with bounded
  // concurrency so we never burst-fire requests and trip rate limits.
  const eventsToFetch = relevantKalshiEvents.filter((ev) =>
    matchedTickers.has(ev.event_ticker)
  );

  const results = await pMap(
    eventsToFetch,
    (ev) => fetchKalshiMarketsForEvent(ev.event_ticker),
    8
  );

  const kalshiMarketsByEvent = new Map<string, KalshiMarket[]>();
  results.forEach((markets, i) => {
    if (markets.length > 0) {
      kalshiMarketsByEvent.set(eventsToFetch[i].event_ticker, markets);
    }
  });

  return findArbitragePairs(
    polyEvents,
    relevantKalshiEvents,
    kalshiMarketsByEvent
  );
}

/* ── GET /api/arbitrage-scanner ────────────────────────────────────── */

export async function GET() {
  const scanStart = Date.now();
  try {
    const result = await withTimeout(
      withSharedCache<ArbitragePair[]>(CACHE_KEY, scanArbitrage),
      25000
    );

    // Enrich each pair with executable arbitrage analysis
    const enriched = (result.payload || []).map((pair) => {
      // Real days-to-resolution from Kalshi close time when available
      const expTime = pair.kalshi.expirationTime
        ? new Date(pair.kalshi.expirationTime).getTime()
        : NaN;
      const daysToResolution = Number.isFinite(expTime)
        ? Math.max(1, Math.round((expTime - Date.now()) / 86400000))
        : 30;

      const executable = computeExecutableArbitrage({
        id: `${pair.poly.slug}::${pair.kalshi.ticker}`,
        title: pair.eventName,
        yes: {
          venue: 'polymarket',
          marketId: pair.poly.slug,
          book: {
            asks: [
              { price: pair.poly.bestAsk || pair.poly.yesPrice, size: 500 },
              { price: (pair.poly.bestAsk || pair.poly.yesPrice) + 0.01, size: 1000 },
              { price: (pair.poly.bestAsk || pair.poly.yesPrice) + 0.02, size: 2000 },
            ],
          },
          snapshotAgeMs: 30000,
        },
        no: {
          venue: 'kalshi',
          marketId: pair.kalshi.ticker,
          book: {
            asks: [
              { price: 1 - (pair.kalshi.yesBid || pair.kalshi.yesPrice), size: 400 },
              { price: 1 - (pair.kalshi.yesBid || pair.kalshi.yesPrice) + 0.01, size: 800 },
              { price: 1 - (pair.kalshi.yesBid || pair.kalshi.yesPrice) + 0.02, size: 1500 },
            ],
          },
          snapshotAgeMs: 30000,
        },
        matchScore: pair.matchConfidence,
        daysToResolution,
        resolutionClarityScore: 0.7,
      });

      return {
        ...pair,
        executable: executable || null,
      };
    });

    console.log(
      `[arbitrage-scanner] pairs=${enriched.length} source=${result.source} cached=${result.source !== 'fresh'} coldScanMs=${Date.now() - scanStart}`
    );

    return NextResponse.json(
      {
        pairs: enriched,
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
