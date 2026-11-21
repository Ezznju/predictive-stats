import { NextRequest, NextResponse } from 'next/server';
import { fetchRewardMarkets, fetchOrderBook } from '@/lib/polymarket';
import type { ScannerMarket } from '@/lib/polymarket';
import { withSharedCache } from '@/lib/scanner-cache';
import { scoreLP } from '@/lib/lp-scoring';
export const runtime = 'edge';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CACHE_KEY = 'lp-scanner';

// Memoize scored LP array per isolate keyed by snapshot timestamp so
// scoreLP() doesn't re-run across all markets on every single request.
let scoredCache: { updatedAt: string | null; markets: any[] } | null = null;

/* ── GET /api/lp-scanner ──────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Order book for a specific token (not cached in the shared layer)
  const tokenId = searchParams.get('book');
  if (tokenId) {
    const book = await fetchOrderBook(tokenId);
    if (!book) {
      return NextResponse.json({ error: 'Failed to fetch order book' }, { status: 502 });
    }
    return NextResponse.json(book, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  }

  // All reward markets — served from the shared, pre-warmed cache
  try {
    const result = await withSharedCache<ScannerMarket[]>(
      CACHE_KEY,
      fetchRewardMarkets,
      // Long soft TTL on purpose: the free Cloudflare tier allows 10ms of
      // CPU per request, and re-running the paginated crawl in the isolate
      // can blow that. Data refreshes hourly-ish from the shared cache; the
      // 48h hard TTL is the disaster backstop (compute is allowed then, since
      // Polymarket — unlike Kalshi — is reachable from Cloudflare).
      { softTtlMs: 55 * 60 * 1000, hardTtlMs: 48 * 60 * 60 * 1000 }
    );

    // Reuse memoized scored array when snapshot hasn't changed
    let enriched: any[];
    if (scoredCache && result.updatedAt && scoredCache.updatedAt === result.updatedAt) {
      enriched = scoredCache.markets;
    } else {
      enriched = (result.payload || []).map((market) => {
        const liquidityUsd = market.volume24h || 50000;
        const spreadPct = market.currentSpread || 0.02;
        const adverseSelectionBps = Math.round(Math.min(40, Math.max(3, spreadPct * 100)));
        const volatilityDaily = Math.round((0.01 + spreadPct * 10) * 1000) / 1000;
        const rewardDilutionPctAnnual = Math.min(0.25, Math.max(0.02, market.competition * 0.01));
        const feeCaptureShare = Math.min(0.12, Math.max(0.02, market.volume24h / Math.max(1, liquidityUsd)));

        const lpResult = scoreLP({
          marketId: market.conditionId || market.yesTokenId || '',
          name: market.question || '',
          liquidityUsd,
          dailyRewardUsd: market.rewardPerDay || 0,
          volume24hUsd: market.volume24h || 0,
          spreadDecimal: market.currentSpread || 0.02,
          adverseSelectionBps,
          volatilityDaily,
          rewardDilutionPctAnnual,
          feeCaptureShare,
          platformRiskScore: 0.2,
        });

        return {
          ...market,
          lpScoring: lpResult || null,
        };
      });
      scoredCache = { updatedAt: result.updatedAt ?? null, markets: enriched };
    }

    return NextResponse.json(
      {
        markets: enriched,
        cached: result.source !== 'fresh',
        stale: result.stale,
        updatedAt: result.updatedAt,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
        },
      }
    );
  } catch (err) {
    console.error('LP Scanner fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 502 });
  }
}
