import { NextResponse } from 'next/server';
import { safeFetchJson } from '@/lib/safe-fetch';

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
}

export async function GET() {
  try {
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

        return {
          conditionId: m.condition_id,
          question: m.question,
          slug: m.market_slug,
          image: m.image,
          dailyReward: rate,
          spread: m.spread ?? 0,
          minSize: m.rewards_min_size ?? 0,
          maxSpread: m.rewards_max_spread ?? 0,
          volume24hr: m.volume_24hr ?? gamma?.volume24hr ?? 0,
          volume1wk: gamma?.volume1wk ?? 0,
          volume1mo: gamma?.volume1mo ?? 0,
          liquidity: gamma?.liquidityNum ?? 0,
          competitiveness: m.market_competitiveness ?? 0,
          endDate: m.end_date ?? '',
          priceChange24h: m.one_day_price_change ?? 0,
          yesPrice: yesTok?.price ?? 0,
          noPrice: noTok?.price ?? 0,
          tokenId: yesTok?.token_id ?? '',
        };
      });

    merged.sort((a, b) => b.dailyReward - a.dailyReward);

    return NextResponse.json(
      { markets: merged, count: merged.length, updatedAt: Date.now() },
      { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' } }
    );
  } catch (err: any) {
    console.error('[lp-rewards]', err?.message);
    return NextResponse.json({ markets: [], count: 0, error: err?.message }, { status: 500 });
  }
}
