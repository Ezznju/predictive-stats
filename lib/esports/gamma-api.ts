/* ── Gamma API — Real Polymarket Reward Pool Data ──────────────────────── */

import { safeFetchJson } from '@/lib/safe-fetch';

export interface GammaMarket {
  condition_id: string;
  question: string;
  slug: string;
  image: string;
  end_date_iso: string;
  active: boolean;
  closed: boolean;
  tokens: Array<{
    token_id: string;
    outcome: string;
    price: number;
  }>;
  reward?: {
    total_reward: number;
    min_size: number;
    max_spread: number;
    epoch_end: number;
  };
}

export interface GammaRewardPool {
  conditionId: string;
  question: string;
  slug: string;
  image: string;
  dailyReward: number;
  minShares: number;
  maxSpread: number;
  endDate: string;
  tokens: Array<{
    tokenId: string;
    outcome: string;
    price: number;
  }>;
}

const GAMMA_BASE = 'https://gamma-api.polymarket.com';

export async function fetchGammaRewards(): Promise<GammaRewardPool[]> {
  const url = `${GAMMA_BASE}/markets?closed=false&active=true&limit=100`;

  const raw = await safeFetchJson<GammaMarket[]>(url, undefined, {}, {
    timeoutMs: 12000,
    retries: 2,
  });

  if (!raw || !Array.isArray(raw)) return [];

  return raw
    .filter((m) => m.reward && m.reward.total_reward > 0)
    .map((m) => ({
      conditionId: m.condition_id,
      question: m.question,
      slug: m.slug,
      image: m.image,
      dailyReward: m.reward!.total_reward,
      minShares: m.reward!.min_size,
      maxSpread: m.reward!.max_spread,
      endDate: m.end_date_iso,
      tokens: m.tokens.map((t) => ({
        tokenId: t.token_id,
        outcome: t.outcome,
        price: t.price,
      })),
    }));
}

export async function fetchEsportRewardPools(): Promise<GammaRewardPool[]> {
  const all = await fetchGammaRewards();
  const esportKeywords = ['cs2', 'csgo', 'valorant', 'lol', 'league of legends', 'dota', 'esports', 'iem', 'vct', 'lck', 'lec', 'lcs', 'blast', 'riyadh'];

  return all.filter((m) => {
    const q = m.question.toLowerCase();
    return esportKeywords.some((kw) => q.includes(kw));
  });
}
