import { fetchRewardMarkets } from './polymarket';

export interface TrendingMarket {
  question: string;
  slug: string;
  conditionId: string;
  yesPrice: number;
  noPrice: number;
  volume24hr: number;
  liquidity: number;
  endDate: string | null;
  oneDayChange: number | null;
  polyUrl: string;
}

const GAMMA = 'https://gamma-api.polymarket.com/markets';

/**
 * Live "trending on Polymarket" board: active markets ranked by 24h volume.
 * Primary source: Gamma API (60s cache). Fallback: CLOB reward markets ranked
 * by volume, so the page never renders empty if Gamma is down.
 */
export async function fetchTrendingMarkets(limit = 25): Promise<TrendingMarket[]> {
  try {
    const res = await fetch(
      `${GAMMA}?active=true&closed=false&order=volume24hr&ascending=false&limit=${limit}`,
      {
        next: { revalidate: 60 },
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) throw new Error(`Gamma ${res.status}`);
    const raw = await res.json();
    const markets = (Array.isArray(raw) ? raw : raw?.data ?? []) as any[];
    const mapped = markets
      .map((m): TrendingMarket | null => {
        let prices: number[] = [];
        try {
          prices = JSON.parse(m.outcomePrices ?? '[]');
        } catch {
          /* leave empty */
        }
        const vol = Number(m.volume24hr ?? 0);
        if (!m.question || !(vol > 0)) return null;
        const yes = Number(prices[0] ?? 0);
        return {
          question: String(m.question),
          slug: String(m.slug ?? ''),
          conditionId: String(m.conditionId ?? ''),
          yesPrice: yes,
          noPrice: Number(prices[1] ?? 1 - yes),
          volume24hr: vol,
          liquidity: Number(m.liquidity ?? 0),
          endDate: m.endDate ?? null,
          oneDayChange: m.oneDayPriceChange != null ? Number(m.oneDayPriceChange) : null,
          polyUrl: `https://polymarket.com/event/${m.slug ?? ''}`,
        };
      })
      .filter((m): m is TrendingMarket => m !== null);
    if (mapped.length >= 10) return mapped.slice(0, limit);
    throw new Error('gamma returned too few markets');
  } catch {
    try {
      const rewards = await fetchRewardMarkets();
      return rewards
        .slice()
        .sort((a, b) => (b.volume24hr ?? 0) - (a.volume24hr ?? 0))
        .slice(0, limit)
        .map((m) => ({
          question: m.question,
          slug: m.slug,
          conditionId: m.conditionId,
          yesPrice: m.yesPrice ?? 0,
          noPrice: m.noPrice ?? 0,
          volume24hr: m.volume24hr ?? 0,
          liquidity: m.liquidity ?? 0,
          endDate: m.endDate ?? null,
          oneDayChange: null,
          polyUrl: `https://polymarket.com/event/${m.slug}`,
        }));
    } catch {
      return [];
    }
  }
}
