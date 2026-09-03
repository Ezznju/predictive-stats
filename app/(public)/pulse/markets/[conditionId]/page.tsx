import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PulseHeader } from '@/components/pulse/PulseHeader';
import { fetchMarketStatsData } from '@/lib/pulse/market-data';
import { withPulseCache, PULSE_KEYS } from '@/lib/pulse/cache';

export const dynamic = 'force-dynamic';

interface MarketPageProps {
  params: { conditionId: string };
}

async function getMarketData(conditionId: string) {
  // Direct lib call (same cached computation the API route serves) —
  // no HTTP loopback through the public domain.
  try {
    const result = await withPulseCache(PULSE_KEYS.marketStats(conditionId), () =>
      fetchMarketStatsData(conditionId)
    );
    return result.payload;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: MarketPageProps): Promise<Metadata> {
  const data = await getMarketData(params.conditionId);
  if (!data) return { title: 'Market Not Found', robots: { index: false, follow: true } };

  return {
    title: `${data.marketTitle} — Whale Activity`,
    description: `Whale trading activity for ${data.marketTitle}. Track large trades, top holders, and smart money flow.`,
    alternates: { canonical: `https://predictionsmarketfans.com/pulse/markets/${params.conditionId}` },
    // Per-market pages are auto-generated thin content — keep them out of the
    // index (but follow links). The /pulse hub page stays indexable.
    robots: { index: false, follow: true },
    openGraph: {
      type: 'website',
      title: `${data.marketTitle} — Whale Activity`,
      description: `Whale trading activity for ${data.marketTitle}.`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${data.marketTitle} — Whale Activity`,
      description: `Whale trading activity for ${data.marketTitle}.`,
    },
  };
}

export default async function MarketPage({ params }: MarketPageProps) {
  const data = await getMarketData(params.conditionId);
  if (!data) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${data.marketTitle} — Whale Activity`,
    description: `Whale trading activity for ${data.marketTitle}.`,
    url: `https://predictionsmarketfans.com/pulse/markets/${params.conditionId}`,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://predictionsmarketfans.com' },
      { '@type': 'ListItem', position: 2, name: 'Prediction Pulse', item: 'https://predictionsmarketfans.com/pulse' },
      { '@type': 'ListItem', position: 3, name: data.marketTitle, item: `https://predictionsmarketfans.com/pulse/markets/${params.conditionId}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <main className="min-h-screen bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <PulseHeader
            title={data.marketTitle}
            subtitle={`Whale activity · ${data.category || 'General'} · Volume: $${(data.volume24hr / 1000).toFixed(1)}K 24h`}
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Prediction Pulse', href: '/pulse' },
              { label: data.marketTitle },
            ]}
          />

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Volume 24h', value: `$${(data.volume24hr / 1000).toFixed(1)}K` },
              { label: 'Liquidity', value: `$${(data.liquidity / 1000).toFixed(1)}K` },
              { label: 'Whale Volume', value: `$${(data.whaleVolume / 1000).toFixed(1)}K` },
              { label: 'Whale Trades', value: `${data.whaleBuyCount + data.whaleSellCount}` },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border-2 border-black rounded-xl p-3 shadow-pop-sm">
                <div className="text-[10px] font-bold text-ink-faint uppercase tracking-wider mb-1">
                  {stat.label}
                </div>
                <div className="text-sm font-display font-bold text-ink">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Whale trades list */}
          <div className="space-y-3">
            <h2 className="font-display font-bold text-lg text-ink flex items-center gap-2">
              <div className="heading-chip bg-neon-magenta w-3 h-5 border border-black rounded-sm" />
              Whale Trades
            </h2>
            {data.whaleTradeDetails?.length > 0 ? (
              <div className="space-y-2">
                {(data.whaleTradeDetails as Array<Record<string, unknown>>).map((trade, i) => (
                  <div
                    key={i}
                    className="bg-white border-2 border-black rounded-xl p-4 shadow-pop-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${String(trade.side) === 'BUY' ? 'bg-neon-green' : 'bg-red-400'}`} />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-ink truncate">
                          {String(trade.walletUsername || trade.walletAddress)}
                        </div>
                        <div className="text-[10px] text-ink-faint">
                          {String(trade.side)} {String(trade.outcome)} · {(Number(trade.price) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-display font-bold text-ink">
                        ${Number(trade.usdcSize).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-ink-faint">
                        {new Date(Number(trade.timestamp) * 1000).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-faint">No whale trades detected for this market yet.</p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
