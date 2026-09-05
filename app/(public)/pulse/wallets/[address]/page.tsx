import { ldJson } from '@/lib/json-ld';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PulseHeader } from '@/components/pulse/PulseHeader';
import { fetchWalletProfileData } from '@/lib/pulse/wallet-data';
import { withPulseCache, PULSE_KEYS } from '@/lib/pulse/cache';

export const dynamic = 'force-dynamic';

interface WalletPageProps {
  params: { address: string };
}

async function getWalletData(address: string) {
  // Direct lib call (same cached computation the API route serves) —
  // no HTTP loopback through the public domain.
  try {
    const result = await withPulseCache(PULSE_KEYS.walletProfile(address), () =>
      fetchWalletProfileData(address)
    );
    return result.payload;
  } catch {
    return null;
  }
}

function formatUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export async function generateMetadata({ params }: WalletPageProps): Promise<Metadata> {
  const data = await getWalletData(params.address);
  const name = data?.username || truncateAddress(params.address);

  return {
    title: `${name} — Whale Profile`,
    description: `Whale wallet profile for ${name}. View trading history, P&L, win rate, positions, and intelligence scores.`,
    alternates: { canonical: `https://predictionsmarketfans.com/pulse/wallets/${params.address}` },
    // Per-wallet pages are auto-generated thin content — keep them out of the
    // index (but follow links). The /pulse hub page stays indexable.
    robots: { index: false, follow: true },
    openGraph: {
      type: 'profile',
      title: `${name} — Whale Profile`,
      description: `Whale wallet profile for ${name}.`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} — Whale Profile`,
      description: `Whale wallet profile for ${name}.`,
    },
  };
}

export default async function WalletPage({ params }: WalletPageProps) {
  const data = await getWalletData(params.address);
  if (!data) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${data.username} — Whale Profile`,
    description: `Whale wallet profile for ${data.username}.`,
    url: `https://predictionsmarketfans.com/pulse/wallets/${params.address}`,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://predictionsmarketfans.com' },
      { '@type': 'ListItem', position: 2, name: 'Polymarket Whale Tracker', item: 'https://predictionsmarketfans.com/pulse' },
      { '@type': 'ListItem', position: 3, name: data.username, item: `https://predictionsmarketfans.com/pulse/wallets/${params.address}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(jsonLd)}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbLd)}} />

      <main className="min-h-screen bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <PulseHeader
            title={data.username}
            subtitle={`Whale profile · ${data.uniqueMarkets} markets · ${data.tradeCount} trades`}
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Polymarket Whale Tracker', href: '/pulse' },
              { label: data.username },
            ]}
          />

          {/* Profile card */}
          <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-pop mb-8">
            <div className="flex items-center gap-4 mb-4">
              {data.profileImage ? (
                <img src={data.profileImage} alt="" className="w-12 h-12 rounded-full border-2 border-black" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-neon-lime border-2 border-black flex items-center justify-center text-lg font-bold">
                  {data.username[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div>
                <h2 className="font-display font-bold text-xl text-ink">{data.username}</h2>
                {data.bio && <p className="text-xs text-ink-faint mt-0.5 max-w-md">{data.bio}</p>}
              </div>
            </div>
            <div className="text-[10px] text-ink-faint font-mono">{params.address}</div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Total Volume', value: formatUSD(data.totalVolume) },
              { label: 'Trade Count', value: String(data.tradeCount) },
              { label: 'Unique Markets', value: String(data.uniqueMarkets) },
              { label: 'Avg Position', value: formatUSD(data.avgPositionSize) },
              { label: 'Win Rate', value: `${(data.scores.winRate * 100).toFixed(1)}%` },
              { label: 'ROI', value: `${(data.scores.roi * 100).toFixed(1)}%` },
              { label: 'Consistency', value: `${(data.scores.consistency * 100).toFixed(0)}%` },
              { label: 'Copy Score', value: `${(data.scores.copyTradeScore * 100).toFixed(0)}` },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border-2 border-black rounded-xl p-3 shadow-pop-sm">
                <div className="text-[10px] font-bold text-ink-faint uppercase tracking-wider mb-1">{stat.label}</div>
                <div className="text-sm font-display font-bold text-ink">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Recent trades */}
          <div className="space-y-3">
            <h2 className="font-display font-bold text-lg text-ink flex items-center gap-2">
              <div className="heading-chip bg-neon-cyan w-3 h-5 border border-black rounded-sm" />
              Recent Trades
            </h2>
            {data.recentTrades?.length > 0 ? (
              <div className="space-y-2">
                {(data.recentTrades as unknown as Array<Record<string, unknown>>).map((trade, i) => (
                  <div
                    key={i}
                    className="bg-white border-2 border-black rounded-xl p-4 shadow-pop-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${String(trade.side) === 'BUY' ? 'bg-neon-green' : 'bg-red-400'}`} />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-ink truncate">{String(trade.title || trade.outcome)}</div>
                        <div className="text-[10px] text-ink-faint">
                          {String(trade.side)} · {(Number(trade.price) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-display font-bold text-ink">
                        {formatUSD(Number(trade.size) * Number(trade.price))}
                      </div>
                      <div className="text-[10px] text-ink-faint">
                        {new Date(Number(trade.timestamp) * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-faint">No recent trades found.</p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
