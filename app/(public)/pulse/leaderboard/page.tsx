import { Metadata } from 'next';
import Link from 'next/link';
import { PulseHeader } from '@/components/pulse/PulseHeader';
import { fetchLeaderboard } from '@/lib/pulse/polymarket-data';
import { classifyWhalesFromLeaderboard } from '@/lib/pulse/whale-detection';

export const dynamic = 'force-dynamic';

function formatUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function skillGrade(score: number): { label: string; color: string } {
  if (score >= 0.85) return { label: 'S', color: 'bg-neon-green text-black' };
  if (score >= 0.7) return { label: 'A', color: 'bg-neon-cyan text-black' };
  if (score >= 0.55) return { label: 'B', color: 'bg-neon-lime text-black' };
  if (score >= 0.4) return { label: 'C', color: 'bg-brand-yellow text-black' };
  if (score >= 0.25) return { label: 'D', color: 'bg-orange-300 text-black' };
  return { label: 'F', color: 'bg-red-200 text-red-700' };
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Whale Skill Leaderboard — Prediction Pulse',
    description:
      'Top wallets ranked by skill score. Composite of win rate, P&L, and volume across prediction markets.',
    alternates: { canonical: 'https://predictionsmarketfans.com/pulse/leaderboard' },
    openGraph: {
      type: 'website',
      title: 'Whale Skill Leaderboard — Prediction Pulse',
      description: 'Top wallets ranked by skill score across prediction markets.',
    },
  };
}

export default async function LeaderboardPage() {
  const entries = await fetchLeaderboard({ category: 'OVERALL', timePeriod: 'ALL', limit: 50 });
  const wallets = classifyWhalesFromLeaderboard(entries);

  const sorted = [...wallets].sort((a, b) => b.skillScore - a.skillScore);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Whale Skill Leaderboard',
    description: 'Top wallets ranked by skill score across prediction markets.',
    url: 'https://predictionsmarketfans.com/pulse/leaderboard',
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://predictionsmarketfans.com' },
      { '@type': 'ListItem', position: 2, name: 'Prediction Pulse', item: 'https://predictionsmarketfans.com/pulse' },
      { '@type': 'ListItem', position: 3, name: 'Skill Leaderboard', item: 'https://predictionsmarketfans.com/pulse/leaderboard' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <main className="min-h-screen bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <PulseHeader
            title="Skill Leaderboard"
            subtitle="Top wallets ranked by win rate, P&L, and volume — composite skill score"
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Prediction Pulse', href: '/pulse' },
              { label: 'Skill Leaderboard' },
            ]}
          />

          {/* How skill is computed */}
          <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-pop mb-8">
            <h2 className="font-display font-bold text-sm text-ink mb-2">How skill is scored</h2>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Skill = 30% win rate + 30% P&L (capped at $500K) + 40% volume (capped at $1M).
              Higher skill means more consistent, profitable trading across more markets.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              {[
                { grade: 'S', range: '85+', desc: 'Elite' },
                { grade: 'A', range: '70–84', desc: 'Expert' },
                { grade: 'B', range: '55–69', desc: 'Skilled' },
                { grade: 'C', range: '40–54', desc: 'Average' },
                { grade: 'D', range: '25–39', desc: 'Below avg' },
                { grade: 'F', range: '<25', desc: 'Novice' },
              ].map((g) => (
                <div key={g.grade} className="flex items-center gap-1.5 text-[10px] text-ink-faint">
                  <span className={`font-bold px-1.5 py-0.5 rounded border border-black ${skillGrade(g.grade === 'S' ? 0.9 : g.grade === 'A' ? 0.77 : g.grade === 'B' ? 0.62 : g.grade === 'C' ? 0.47 : g.grade === 'D' ? 0.32 : 0.1).color}`}>
                    {g.grade}
                  </span>
                  <span>{g.range} · {g.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard table */}
          <div className="bg-white border-2 border-black rounded-2xl shadow-pop overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[3rem_1fr_5rem_5rem_5rem_4rem] sm:grid-cols-[3rem_1fr_6rem_6rem_6rem_5rem] gap-2 px-4 py-3 border-b-2 border-black bg-black/[0.02]">
              <span className="text-[10px] font-bold text-ink-faint uppercase">#</span>
              <span className="text-[10px] font-bold text-ink-faint uppercase">Wallet</span>
              <span className="text-[10px] font-bold text-ink-faint uppercase text-right">P&L</span>
              <span className="text-[10px] font-bold text-ink-faint uppercase text-right">Volume</span>
              <span className="text-[10px] font-bold text-ink-faint uppercase text-right hidden sm:block">Win Rate</span>
              <span className="text-[10px] font-bold text-ink-faint uppercase text-right">Skill</span>
            </div>

            {/* Rows */}
            {sorted.map((wallet, i) => {
              const grade = skillGrade(wallet.skillScore);
              return (
                <Link
                  key={wallet.address}
                  href={`/pulse/wallets/${wallet.address}`}
                  className="grid grid-cols-[3rem_1fr_5rem_5rem_5rem_4rem] sm:grid-cols-[3rem_1fr_6rem_6rem_6rem_5rem] gap-2 px-4 py-3 border-b border-black/5 hover:bg-black/[0.02] transition-colors items-center"
                >
                  <span className="text-xs font-mono text-ink-faint font-bold">
                    {i + 1}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    {wallet.profileImage ? (
                      <img
                        src={wallet.profileImage}
                        alt=""
                        className="w-6 h-6 rounded-full border border-black flex-shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-neon-lime border border-black flex items-center justify-center text-[8px] font-bold flex-shrink-0">
                        {(wallet.username || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-bold font-display text-ink truncate">
                      {wallet.username || wallet.address.slice(0, 10)}
                    </span>
                  </div>
                  <span className={`text-xs font-mono font-bold text-right ${wallet.pnl >= 0 ? 'text-neon-green' : 'text-red-500'}`}>
                    {wallet.pnl >= 0 ? '+' : ''}{formatUSD(wallet.pnl)}
                  </span>
                  <span className="text-xs font-mono text-ink text-right">
                    {formatUSD(wallet.volume)}
                  </span>
                  <span className="text-xs font-mono text-ink text-right hidden sm:block">
                    {formatPct(wallet.winRate)}
                  </span>
                  <div className="flex justify-end">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border border-black ${grade.color}`}>
                      {grade.label}
                    </span>
                  </div>
                </Link>
              );
            })}

            {sorted.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-ink-faint">
                No leaderboard data available.
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
