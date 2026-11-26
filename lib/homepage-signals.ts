import 'server-only';
import { getCacheEntries } from '@/lib/scanner-cache';
import { fetchTrendingMarkets, type TrendingMarket } from '@/lib/trending';
import { cachedByKey } from '@/lib/isolate-cache';
import type { KalshiSmartMoneyBoard } from '@/lib/kalshi-smart-money';

export interface ArbCell {
  mkt: string;
  net: number; // cents net spread
  conf: number;
  risk?: string;
}

export interface LpCell {
  mkt: string;
  real: number; // decimal APR (e.g. 0.42 = 42%)
  head: string; // e.g. "$450/day"
  fail: boolean;
}

export interface PulseCell {
  wallet: string;
  note: string;
  chip: string;
  win: boolean | null;
  park?: boolean;
}

export interface TrendCell {
  mkt: string;
  vol: number;
  yes: number;
  unitLabel?: string;
}

export interface HomepageSignals {
  arb: ArbCell[];
  lp: LpCell[];
  pulse: PulseCell[];
  trend: TrendCell[];
  kalshi: TrendCell[];
  kalshiSmart: TrendCell[];
  hasLiveData: boolean;
}

function fmtCompactUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

const getCachedSignals = cachedByKey<HomepageSignals>(
  'homepage-signals',
  5 * 60 * 1000,
  async () => {
    const [entries, polyTrending] = await Promise.all([
      getCacheEntries([
        'arbitrage-scanner',
        'lp-rewards-board',
        'lp-scanner',
        'pulse:whale-feed',
        'kalshi-trending-board',
        'kalshi-smart-money-board',
      ]),
      fetchTrendingMarkets(5).catch(() => [] as TrendingMarket[]),
    ]);

    const arb: ArbCell[] = [];
    const rawArb = entries.get('arbitrage-scanner')?.payload;
    if (Array.isArray(rawArb)) {
      const sorted = [...rawArb]
        .filter((p: any) => p && (p.eventName || p.poly?.question || p.kalshi?.question))
        .sort(
          (a: any, b: any) =>
            Number(b.depth?.netPerContractCents ?? b.priceDiffCents ?? 0) -
            Number(a.depth?.netPerContractCents ?? a.priceDiffCents ?? 0)
        )
        .slice(0, 4);
      for (const p of sorted) {
        const netCents = Number(p.depth?.netPerContractCents ?? p.priceDiffCents ?? 0);
        const rawConf = Number(p.matchConfidence ?? p.matchScore ?? 78);
        const conf = Math.min(99, Math.max(50, Math.round(rawConf <= 1 ? rawConf * 100 : rawConf)));
        const risk =
          p.depth?.capitalUsd != null && Number(p.depth.capitalUsd) < 250
            ? 'thin book'
            : Array.isArray(p.anomalies) && p.anomalies.length > 0
            ? String(p.anomalies[0].kind ?? 'check book').slice(0, 18)
            : undefined;
        arb.push({
          mkt: String(p.eventName ?? p.poly?.question ?? p.kalshi?.question ?? 'Cross-platform market'),
          net: Number.isFinite(netCents) ? Math.max(0.1, netCents) : 1.2,
          conf,
          risk,
        });
      }
    }

    const lp: LpCell[] = [];
    const rawLp = entries.get('lp-rewards-board')?.payload ?? entries.get('lp-scanner')?.payload;
    if (Array.isArray(rawLp)) {
      const sorted = [...rawLp]
        .filter((m: any) => m && m.question && Number(m.dailyReward ?? m.rewardPerDay ?? 0) > 0)
        .sort((a: any, b: any) => Number(b.dailyReward ?? b.rewardPerDay ?? 0) - Number(a.dailyReward ?? a.rewardPerDay ?? 0))
        .slice(0, 4);
      for (const m of sorted) {
        const daily = Number(m.dailyReward ?? m.rewardPerDay ?? 0);
        const vol = Math.max(10_000, Number(m.volume24hr ?? m.volume24h ?? m.liquidity ?? 50_000));
        const estRealApr = Math.min(3.5, Math.max(0.05, (daily * 365) / (vol * 0.35)));
        const comp = Number(m.competitiveness ?? m.competition ?? 0);
        lp.push({
          mkt: String(m.question),
          real: estRealApr,
          head: `$${Math.round(daily).toLocaleString()}/day pool`,
          fail: comp > 80,
        });
      }
    }

    const pulse: PulseCell[] = [];
    const rawPulse = entries.get('pulse:whale-feed')?.payload as any;
    const pulseCards = Array.isArray(rawPulse?.cards)
      ? rawPulse.cards
      : Array.isArray(rawPulse?.feed)
      ? rawPulse.feed
      : [];
    for (const c of pulseCards.slice(0, 4)) {
      const wallet = String(c.walletUsername ?? c.walletAddress?.slice(0, 10) ?? 'Top Whale');
      const size = Number(c.totalUsdcSize ?? c.usdcSize ?? 0);
      const priceCents = Math.round(Number(c.avgPrice ?? c.price ?? 0.5) * 100);
      const side = String(c.side ?? 'BUY');
      const title = String(c.marketTitle ?? 'Active Polymarket contract');
      const conviction = Math.round(Number(c.avgConviction ?? c.convictionScore ?? 0.7) * 100);
      pulse.push({
        wallet,
        note: `${side} ${fmtCompactUsd(size)} @ ${priceCents}¢ · ${title}`,
        chip: conviction > 0 ? `${conviction} conviction` : 'live trade',
        win: c.isParking ? null : true,
        park: Boolean(c.isParking),
      });
    }

    const trend: TrendCell[] = polyTrending.slice(0, 4).map((m) => ({
      mkt: m.question,
      vol: m.volume24hr,
      yes: Math.round(m.yesPrice * 100),
      unitLabel: '/ 24h · Polymarket',
    }));

    const kalshi: TrendCell[] = [];
    const rawKalshiTrend = entries.get('kalshi-trending-board')?.payload;
    if (Array.isArray(rawKalshiTrend)) {
      for (const m of rawKalshiTrend.slice(0, 4)) {
        if (!m?.question) continue;
        kalshi.push({
          mkt: String(m.question),
          vol: Number(m.volume24hr ?? 0),
          yes: Math.round(Number(m.yesPrice ?? 0.5) * 100),
          unitLabel: '/ 24h · Kalshi',
        });
      }
    }

    const kalshiSmart: TrendCell[] = [];
    const rawKalshiSmart = entries.get('kalshi-smart-money-board')?.payload as KalshiSmartMoneyBoard | undefined;
    if (Array.isArray(rawKalshiSmart?.bigMoney)) {
      for (const s of rawKalshiSmart.bigMoney.slice(0, 4)) {
        if (!s?.question) continue;
        kalshiSmart.push({
          mkt: String(s.question),
          vol: Number(s.totalResting ?? s.volume24h ?? 0),
          yes: Math.round(Number(s.yesPrice ?? 0.5) * 100),
          unitLabel: 'resting in book',
        });
      }
    }

    const hasLiveData =
      arb.length > 0 || lp.length > 0 || pulse.length > 0 || trend.length > 0 || kalshi.length > 0 || kalshiSmart.length > 0;

    return { arb, lp, pulse, trend, kalshi, kalshiSmart, hasLiveData };
  }
);

export async function getHomepageSignals(): Promise<HomepageSignals> {
  try {
    return await getCachedSignals();
  } catch {
    return { arb: [], lp: [], pulse: [], trend: [], kalshi: [], kalshiSmart: [], hasLiveData: false };
  }
}
