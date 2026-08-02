import { NextRequest, NextResponse } from 'next/server';
import { fetchRewardMarkets, fetchOrderBook } from '@/lib/polymarket';
import type { ScannerMarket } from '@/lib/polymarket';
import { withSharedCache } from '@/lib/scanner-cache';
import { scoreLP } from '@/lib/lp-scoring';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CACHE_KEY = 'lp-scanner';

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
      fetchRewardMarkets
    );

    // Enrich each market with risk-adjusted LP scoring
    const enriched = (result.payload || []).map((market) => {
      const liquidityUsd = market.volume24h || 50000;
      const spreadPct = market.currentSpread || 0.02;
      // Derive hidden-cost inputs from real market fields instead of flat constants:
      //  - wider spread ⇒ more informed flow ⇒ higher adverse selection (bps)
      //  - competition count ⇒ more reward dilution for this LP
      //  - higher volume-to-liquidity ⇒ more fee capture opportunity
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

    return NextResponse.json(
      {
        markets: enriched,
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
    console.error('LP Scanner fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 502 });
  }
}
