import { notFound } from 'next/navigation';
import { TrendingRefresh } from '@/components/TrendingRefresh';
import { fetchTrendingMarkets } from '@/lib/trending';
import { fetchKalshiTrending } from '@/lib/kalshi-trending';
import { getCacheEntry } from '@/lib/scanner-cache';
import type { ArbitragePair } from '@/lib/arbitrage';

// Public iframe widgets for third-party sites. noindex (thin pages, embed
// only) but follow — the attribution links are the point.
export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: true } };

const BASE = 'https://predictionsmarketfans.com';

const WIDGETS: Record<string, { label: string; board: string }> = {
  trending: { label: 'Polymarket Trending · Live', board: '/polymarket-trending-markets' },
  kalshi: { label: 'Kalshi Trending · Live', board: '/kalshi-trending-markets' },
  arbitrage: { label: 'Arbitrage · Polymarket × Kalshi', board: '/tools/arbitrage-scanner' },
};

function fmtVol(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

interface Row {
  q: string;
  a: string;
  b: string;
}

async function loadRows(kind: string, rows: number): Promise<Row[]> {
  if (kind === 'trending') {
    const markets = await fetchTrendingMarkets(rows);
    return markets.map((m) => ({
      q: m.question,
      a: `${(m.yesPrice * 100).toFixed(0)}¢`,
      b: fmtVol(m.volume24hr),
    }));
  }
  if (kind === 'kalshi') {
    const markets = await fetchKalshiTrending(rows);
    return markets.map((m) => ({
      q: m.question,
      a: `${(m.yesPrice * 100).toFixed(0)}¢`,
      b: fmtVol(m.volume24hr),
    }));
  }
  // arbitrage: read the shared cache the refresh pipeline maintains
  const entry = await getCacheEntry<ArbitragePair[]>('arbitrage-scanner');
  const pairs = entry?.payload ?? [];
  return pairs.slice(0, rows).map((p) => ({
    q: p.eventName,
    a: `${p.arbPercent.toFixed(1)}% arb`,
    b: p.cheaperYes === 'polymarket' ? 'cheap: Polymarket' : 'cheap: Kalshi',
  }));
}

export default async function EmbedWidgetPage({
  params,
  searchParams,
}: {
  params: { widget: string };
  searchParams: { rows?: string };
}) {
  const meta = WIDGETS[params.widget];
  if (!meta) notFound();

  const rows = Math.min(15, Math.max(5, Number(searchParams.rows) || 8));
  const data = await loadRows(params.widget, rows);
  const utm = `utm_source=embed&utm_medium=widget&utm_campaign=${params.widget}`;

  return (
    <div className="bg-white min-h-screen">
      <TrendingRefresh intervalSec={300} />
      <div className="border-2 border-black m-2 rounded-xl overflow-hidden shadow-pop-sm">
        {/* Header strip */}
        <div className="bg-black text-white px-3.5 py-2.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse shrink-0" />
          <span className="font-display font-extrabold text-[11px] tracking-[0.1em] uppercase truncate">
            {meta.label}
          </span>
          <a
            href={`${BASE}${meta.board}?${utm}`}
            target="_blank"
            rel="noopener"
            className="ml-auto shrink-0 text-[10.5px] font-bold text-white/70 hover:text-brand-yellow transition-colors"
          >
            Full board →
          </a>
        </div>

        {/* Rows */}
        {data.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-ink-faint font-semibold">Live data refreshing — check back in a moment.</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <tbody>
              {data.map((r, i) => (
                <tr key={r.q + '-' + i} className="border-b border-black/10 last:border-b-0">
                  <td className="pl-3.5 pr-2 py-2">
                    <span className="block font-display font-semibold text-[12px] leading-tight text-black truncate max-w-[260px]">
                      {r.q}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">
                    <span className="font-mono font-bold text-[12px] text-black">{r.a}</span>
                  </td>
                  <td className="pl-2 pr-3.5 py-2 text-right whitespace-nowrap">
                    <span className="font-mono text-[11px] text-ink-faint">{r.b}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Attribution — always visible inside the frame */}
        <a
          href={`${BASE}/?${utm}`}
          target="_blank"
          rel="noopener"
          className="block bg-[#FFE642] border-t-2 border-black px-3.5 py-2 text-[10.5px] font-bold text-black hover:bg-brand-yellow transition-colors"
        >
          Powered by Predictions Market Fans — live prediction market data →
        </a>
      </div>
    </div>
  );
}
