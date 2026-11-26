import { NextResponse } from 'next/server';
import { safeFetchJson } from '@/lib/safe-fetch';
import { withSharedCache } from '@/lib/scanner-cache';
import { scoreLP } from '@/lib/lp-scoring';
import { polymarketSpreadWeight } from '@/lib/polymarket';
export const runtime = 'edge';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface ClobRewardMarket {
  condition_id: string;
  event_id: string;
  event_slug: string;
  market_id: string;
  market_slug: string;
  question: string;
  image: string;
  spread: number;
  rewards_min_size: number;
  rewards_max_spread: number;
  volume_24hr: number;
  market_competitiveness: number;
  end_date: string;
  one_day_price_change: number;
  tokens: Array<{ token_id: string; outcome: string; price: number }>;
  rewards_config: Array<{
    id: number;
    asset_address: string;
    start_date: string;
    end_date: string;
    rate_per_day: number;
    total_rewards: number;
    remaining_reward_amount?: number;
  }>;
}

interface GammaMarket {
  conditionId: string;
  volumeNum: number;
  liquidityNum: number;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  bestBid: number;
  bestAsk: number;
  clobTokenIds: string;
}

export interface LPRewardMarket {
  conditionId: string;
  question: string;
  slug: string;
  image: string;
  dailyReward: number;
  spread: number;
  minSize: number;
  maxSpread: number;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  liquidity: number;
  competitiveness: number;
  endDate: string;
  priceChange24h: number;
  yesPrice: number;
  noPrice: number;
  tokenId: string;
  /** Institutional quant scoring fields (Golden Professor LP model) */
  entryCostUsd: number;
  spreadViolation: boolean;
  twoSidedRequired: boolean;
  spreadEfficiency: number;
  grossAprPct: number;
  netAprPct: number;
  headlineTrap: boolean;
  score100: number;
  riskFlags: string[];
}

async function fetchMergedLpRewards(): Promise<LPRewardMarket[]> {
  const [clobRaw, gammaRaw] = await Promise.all([
    safeFetchJson<any>(
      'https://clob.polymarket.com/rewards/markets/multi?order_by=rate_per_day&position=DESC&page_size=200',
      undefined,
      {},
      { timeoutMs: 15000, retries: 1 }
    ).catch(() => null),
    safeFetchJson<GammaMarket[]>(
      'https://gamma-api.polymarket.com/markets?closed=false&active=true&limit=500',
      undefined,
      {},
      { timeoutMs: 15000, retries: 1 }
    ).catch(() => null),
  ]);

  const clobMarkets: ClobRewardMarket[] = clobRaw?.data ?? [];
  const gammaMarkets: GammaMarket[] = Array.isArray(gammaRaw) ? gammaRaw : [];

  const gammaMap = new Map<string, GammaMarket>();
  for (const g of gammaMarkets) {
    gammaMap.set(g.conditionId, g);
  }

  const merged: LPRewardMarket[] = clobMarkets
    .filter((m) => m.rewards_config?.length > 0 && m.rewards_config.some((r) => r.rate_per_day > 0))
    .map((m) => {
      const rate = Math.max(...m.rewards_config.map((r) => r.rate_per_day));
      const gamma = gammaMap.get(m.condition_id);
      const yesTok = m.tokens?.find((t) => t.outcome === 'Yes' || t.outcome === 'YES');
      const noTok = m.tokens?.find((t) => t.outcome === 'No' || t.outcome === 'NO');

      const yesPrice = yesTok?.price ?? 0.5;
      const noPrice = noTok?.price != null ? noTok.price : 1 - yesPrice;
      const spread = m.spread ?? 0;
      const maxSpread = m.rewards_max_spread ?? 0;
      const minSize = m.rewards_min_size ?? 0;
      const vol24 = m.volume_24hr ?? gamma?.volume24hr ?? 0;
      const liq = Math.max(gamma?.liquidityNum ?? 0, minSize * 20, 5000);
      const comp = m.market_competitiveness ?? 0;

      const spreadViolation = maxSpread > 0 && spread > maxSpread * 2;
      const twoSidedRequired = yesPrice < 0.10 || yesPrice > 0.90;
      const entryCostUsd = Math.round(minSize * (twoSidedRequired ? 1.0 : Math.min(yesPrice, noPrice)) * 100) / 100;
      const spreadEfficiency = Math.round(polymarketSpreadWeight(spread, maxSpread) * 100) / 100;

      const adverseSelectionBps = Math.round(Math.min(45, Math.max(4, spread * 120)));
      const volatilityDaily = Math.round((0.012 + Math.abs(m.one_day_price_change ?? 0) * 0.6 + spread * 4) * 1000) / 1000;
      const lpScored = scoreLP({
        marketId: m.condition_id,
        name: m.question,
        liquidityUsd: liq,
        dailyRewardUsd: spreadViolation ? 0 : rate * Math.max(0.25, spreadEfficiency),
        volume24hUsd: vol24,
        spreadDecimal: Math.max(0.005, spread),
        adverseSelectionBps,
        volatilityDaily,
        rewardDilutionPctAnnual: Math.min(0.4, comp * 0.25),
        feeCaptureShare: 0.06,
        platformRiskScore: 0.15,
      });

      const grossAprPct = Math.round((lpScored?.grossRewardApr ?? 0) * 1000) / 10;
      const netAprPct = spreadViolation ? 0 : Math.round((lpScored?.netApr ?? 0) * 1000) / 10;
      const headlineTrap = grossAprPct > 35 && netAprPct < 10;
      const riskFlags: string[] = [];
      if (spreadViolation) riskFlags.push('Spread exceeds max — $0 rewards');
      if (twoSidedRequired) riskFlags.push('Extreme odds (<10¢ / >90¢) — 2-sided quoting required');
      if (headlineTrap) riskFlags.push('Headline trap — adverse selection/inventory drags net APR');
      for (const rf of lpScored?.riskFlags ?? []) {
        if (riskFlags.length < 4) riskFlags.push(rf.message);
      }

      return {
        conditionId: m.condition_id,
        question: m.question,
        slug: m.market_slug,
        image: m.image,
        dailyReward: rate,
        spread,
        minSize,
        maxSpread,
        volume24hr: vol24,
        volume1wk: gamma?.volume1wk ?? 0,
        volume1mo: gamma?.volume1mo ?? 0,
        liquidity: gamma?.liquidityNum ?? 0,
        competitiveness: comp,
        endDate: m.end_date ?? '',
        priceChange24h: m.one_day_price_change ?? 0,
        yesPrice,
        noPrice,
        tokenId: yesTok?.token_id ?? '',
        entryCostUsd,
        spreadViolation,
        twoSidedRequired,
        spreadEfficiency,
        grossAprPct,
        netAprPct,
        headlineTrap,
        score100: spreadViolation ? 0 : (lpScored?.score100 ?? 0),
        riskFlags,
      };
    });

  merged.sort((a, b) => b.dailyReward - a.dailyReward);
  if (merged.length === 0) {
    throw new Error('Upstream Polymarket LP rewards returned empty list');
  }
  return merged;
}

export async function GET() {
  try {
    const result = await withSharedCache<LPRewardMarket[]>(
      'lp-rewards-board',
      fetchMergedLpRewards,
      { softTtlMs: 10 * 60 * 1000, hardTtlMs: 24 * 60 * 60 * 1000 }
    );
    const markets = result.payload ?? [];

    return NextResponse.json(
      {
        markets,
        count: markets.length,
        updatedAt: result.updatedAt,
        cached: result.source !== 'fresh',
        stale: result.stale,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' } }
    );
  } catch (err: any) {
    console.error('[lp-rewards]', err?.message);
    return NextResponse.json({ markets: [], count: 0, error: err?.message }, { status: 500 });
  }
}
