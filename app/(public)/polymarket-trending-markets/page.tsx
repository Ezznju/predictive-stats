import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { ScannerLiveStatus } from '@/components/ScannerLiveStatus';
import { TrendingRefresh } from '@/components/TrendingRefresh';
import { fetchTrendingMarkets, TrendingMarket } from '@/lib/trending';

export const revalidate = 60;

const BASE = 'https://predictionsmarketfans.com';

function monthLabel(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export async function generateMetadata(): Promise<Metadata> {
  const month = monthLabel();
  return {
    title: `Polymarket Trending Markets — Live Board (${month})`,
    description:
      "See Polymarket's most active markets right now — the top markets by 24-hour volume with live YES/NO prices, liquidity and time remaining. Updated every minute. Free, no signup.",
    alternates: { canonical: `${BASE}/polymarket-trending-markets` },
    openGraph: {
      type: 'website',
      title: `Polymarket Trending Markets — Live Board (${month})`,
      description:
        'The most active Polymarket markets right now, ranked by 24-hour volume with live prices. Updated every minute.',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Polymarket Trending Markets — Live Board',
      description: 'The most active Polymarket markets right now, ranked by 24-hour volume. Updated every minute.',
    },
  };
}

function fmtVol(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function daysUntil(endDate: string | null): number | null {
  if (!endDate) return null;
  const d = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000);
  return Number.isFinite(d) ? d : null;
}

function MoverCard({
  label,
  labelBg,
  question,
  big,
  sub,
}: {
  label: string;
  labelBg: string;
  question: string;
  big: string;
  sub: string;
}) {
  return (
    <div className="bg-white border-2 border-black rounded-2xl shadow-pop p-5">
      <span
        className="inline-block font-display font-extrabold text-[10.5px] tracking-[0.1em] uppercase px-2.5 py-1 rounded-full border-2 border-black mb-3"
        style={{ backgroundColor: labelBg }}
      >
        {label}
      </span>
      <div className="font-display font-bold text-[14.5px] leading-snug mb-1.5 line-clamp-2">{question}</div>
      <div className="font-mono font-bold text-[21px]">{big}</div>
      <div className="text-[12px] font-semibold text-ink-faint mt-1">{sub}</div>
    </div>
  );
}

export default async function TrendingMarketsPage() {
  const markets = await fetchTrendingMarkets(25);
  const renderedAt = new Date().toISOString();

  // Movers: biggest 24h price climb/drop when Gamma provides change data,
  // otherwise most contested / most lopsided by price distance from 50/50.
  const withChange = markets.filter((m) => m.oneDayChange != null);
  let climb: TrendingMarket | null = null;
  let drop: TrendingMarket | null = null;
  let contested: TrendingMarket | null = null;
  let lopsided: TrendingMarket | null = null;
  for (const m of markets) {
    if (m.oneDayChange != null) {
      if (!climb || m.oneDayChange! > climb.oneDayChange!) climb = m;
      if (!drop || m.oneDayChange! < drop.oneDayChange!) drop = m;
    }
    const dist = Math.abs(m.yesPrice - 0.5);
    if (!contested || dist < Math.abs(contested.yesPrice - 0.5)) contested = m;
    if (!lopsided || dist > Math.abs(lopsided.yesPrice - 0.5)) lopsided = m;
  }
  const useChange = withChange.length >= 5;

  const faq = [
    {
      q: 'What are Polymarket\u2019s most active markets today?',
      a: 'The live board above ranks every active Polymarket market by 24-hour trading volume — the top rows are, by definition, today\u2019s most active markets. It refreshes automatically every 60 seconds.',
    },
    {
      q: 'How often does Polymarket volume update?',
      a: 'Trades settle on Polymarket continuously, so 24-hour volume shifts minute by minute. This page re-reads Polymarket\u2019s public API every 60 seconds and re-ranks the board.',
    },
    {
      q: 'What does the YES price on Polymarket mean?',
      a: 'The YES price in cents is the market\u2019s implied probability. A market at 62\u00A2 YES means traders collectively assign a 62% chance to the event happening. If the event resolves YES, each share pays $1.00.',
    },
    {
      q: 'How is "trending" decided on this board?',
      a: 'Purely by 24-hour trading volume from Polymarket\u2019s public API \u2014 no editorial picks, no ranking games. High volume means real money is actively changing hands on that question today.',
    },
  ];

  const itemJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Most active Polymarket markets — ${monthLabel()}`,
    itemListElement: markets.slice(0, 25).map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: m.question,
      url: m.polyUrl,
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Trending Markets', item: `${BASE}/polymarket-trending-markets` },
    ],
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <TrendingRefresh intervalSec={60} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-muted mb-5">
          <Link href="/" className="hover:text-ink transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink-secondary font-semibold">Trending Markets</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="heading-chip bg-neon-cyan" />
            <h1 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl leading-[0.98] uppercase tracking-tight">
              Polymarket Trending Markets
            </h1>
          </div>
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <ScannerLiveStatus updatedAt={renderedAt} />
            <span className="inline-block px-3 py-1 text-xs font-bold text-black bg-brand-yellow border-2 border-black rounded-full shadow-pop-sm">
              {monthLabel()}
            </span>
            <span className="text-xs text-ink-faint font-semibold">Top {markets.length} of all active markets · ranked by 24h volume</span>
          </div>
          <p className="text-[16.5px] text-ink-secondary mt-4 leading-relaxed max-w-3xl">
            The <strong className="text-ink">most active Polymarket markets right now</strong>, ranked by 24-hour
            trading volume — with live YES/NO prices, liquidity, and time remaining. This board re-reads Polymarket&apos;s
            public API every minute, so what you see is always the current picture, not a stale article.
          </p>
        </header>

        {/* Movers */}
        {markets.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <MoverCard
              label="Most volume · 24h"
              labelBg="#29C5F6"
              question={markets[0].question}
              big={fmtVol(markets[0].volume24hr)}
              sub={`${(markets[0].yesPrice * 100).toFixed(0)}\u00A2 YES · ${(markets[0].noPrice * 100).toFixed(0)}\u00A2 NO`}
            />
            {useChange && climb && climb.oneDayChange! > 0 ? (
              <MoverCard
                label="Biggest climb · 24h"
                labelBg="#D9F24B"
                question={climb.question}
                big={`+${(climb.oneDayChange! * 100).toFixed(1)}\u00A2`}
                sub={`now ${(climb.yesPrice * 100).toFixed(0)}\u00A2 YES · ${fmtVol(climb.volume24hr)} traded`}
              />
            ) : (
              contested && (
                <MoverCard
                  label="Most contested"
                  labelBg="#D9F24B"
                  question={contested.question}
                  big={`${(contested.yesPrice * 100).toFixed(0)}\u00A2 YES`}
                  sub={`the closest to 50/50 · ${fmtVol(contested.volume24hr)} traded`}
                />
              )
            )}
            {useChange && drop && drop.oneDayChange! < 0 ? (
              <MoverCard
                label="Biggest drop · 24h"
                labelBg="#FFC7C7"
                question={drop.question}
                big={`${(drop.oneDayChange! * 100).toFixed(1)}\u00A2`}
                sub={`now ${(drop.yesPrice * 100).toFixed(0)}\u00A2 YES · ${fmtVol(drop.volume24hr)} traded`}
              />
            ) : (
              lopsided && (
                <MoverCard
                  label="Most lopsided"
                  labelBg="#FFC7C7"
                  question={lopsided.question}
                  big={`${(lopsided.yesPrice * 100).toFixed(0)}\u00A2 YES`}
                  sub={`furthest from 50/50 · ${fmtVol(lopsided.volume24hr)} traded`}
                />
              )
            )}
          </div>
        )}

        {/* Board */}
        {markets.length > 0 ? (
          <div className="bg-white border-2 border-black rounded-2xl shadow-pop overflow-hidden">
            <div className="bg-black text-white px-5 py-3 flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <span className="font-display font-extrabold text-xs tracking-[0.12em] uppercase">Live board — ranked by 24h volume</span>
              <span className="ml-auto text-[10.5px] text-white/55 font-semibold hidden sm:block"> Whale links open the whale tracker for that market</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F6F7F9]">
                    <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider" style={{ minWidth: 300 }}>Market</th>
                    <th className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider">YES</th>
                    <th className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider">NO</th>
                    <th className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider">24h Volume</th>
                    <th className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider">Liquidity</th>
                    <th className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider">Ends</th>
                    <th className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider">Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {markets.map((m, i) => {
                    const days = daysUntil(m.endDate);
                    return (
                      <tr key={m.conditionId || i} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-display font-semibold text-[13.5px] leading-tight line-clamp-2">{m.question}</div>
                          <div className="text-[10.5px] font-bold uppercase tracking-wide text-ink-faint mt-0.5">
                            #{i + 1} · by 24h volume
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-[14px] text-neon-green">{(m.yesPrice * 100).toFixed(0)}¢</td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-[14px] text-brand-pink">{(m.noPrice * 100).toFixed(0)}¢</td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-[13.5px]">{fmtVol(m.volume24hr)}</td>
                        <td className="px-3 py-3 text-center font-mono text-[12.5px] text-ink-muted">{fmtVol(m.liquidity)}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`font-mono text-xs ${days !== null && days < 14 ? 'text-brand-orange font-bold' : 'text-ink-faint'}`}>
                            {days !== null ? (days < 0 ? 'Ended' : `${days}d`) : '—'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <Link
                              href={`/pulse/markets/${m.conditionId}`}
                              aria-label={`Whale activity for ${m.question}`}
                              className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-1 border-2 border-black rounded-lg bg-white hover:bg-neon-lime hover:-translate-y-0.5 hover:shadow-pop-sm transition-all whitespace-nowrap"
                            >
                              🐋 Whales
                            </Link>
                            <a
                              href={m.polyUrl}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              aria-label={`Open ${m.question} on Polymarket`}
                              className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-1 border-2 border-black rounded-lg bg-neon-purple text-white hover:-translate-y-0.5 hover:shadow-pop-sm transition-all whitespace-nowrap"
                            >
                              Poly <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t-2 border-black bg-white/60 flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10.5px] font-bold bg-brand-yellow border-2 border-black rounded-md px-2 py-0.5">live data</span>
              <p className="text-xs text-ink-faint font-semibold">
                Source: Polymarket public API · auto-refreshes every 60 seconds · prices are implied probabilities, not advice
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-black rounded-2xl shadow-pop p-12 text-center">
            <p className="font-display text-ink-muted">The live board is catching its breath — refresh in a moment.</p>
          </div>
        )}

        {/* Explainer */}
        <section className="mt-14 max-w-3xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="heading-chip bg-neon-lime" />
            <h2 className="font-display font-bold text-[26px] text-black">How Polymarket market activity works</h2>
          </div>
          <div className="space-y-4 text-[15.5px] leading-relaxed text-ink-secondary">
            <p>
              <strong className="text-ink">What you&apos;re looking at:</strong> every market on Polymarket is a question
              with a YES and NO price between 1¢ and 99¢. The price is the crowd&apos;s live probability — 62¢ YES means
              the market believes there&apos;s a 62% chance. This board ranks markets by{' '}
              <strong className="text-ink">24-hour trading volume</strong>, the single best signal for where attention and
              money are flowing right now.
            </p>
            <p>
              <strong className="text-ink">Why volume matters more than liquidity:</strong> liquidity tells you how easily
              you can enter and exit a position. Volume tells you where traders actually fought today. Big volume behind a
              price move usually means real information moved the market — which is exactly what &quot;trending&quot; means.
            </p>
            <p>
              <strong className="text-ink">How often this page updates:</strong> the board re-reads Polymarket&apos;s public
              API every 60 seconds, automatically. Prices are implied probabilities, not predictions from us, and nothing
              here is financial advice.
            </p>
            <p>
              Want to go deeper? The <Link href="/tools/arbitrage-scanner" className="text-ink underline font-semibold">Arbitrage Scanner</Link> compares
              prices across platforms, the <Link href="/tools/lp-scanner" className="text-ink underline font-semibold">LP Reward Scanner</Link> shows
              which pools actually pay, and every 🐋 link above opens the{' '}
              <Link href="/pulse" className="text-ink underline font-semibold">whale tracker</Link> for that exact market — so
              you can see <em>who</em> is behind the volume, not just how much of it there is.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-12 max-w-3xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="heading-chip bg-neon-magenta" />
            <h2 className="font-display font-bold text-[26px] text-black">Frequently asked</h2>
          </div>
          <div className="grid gap-3">
            {faq.map((f) => (
              <div key={f.q} className="bg-white border-2 border-black rounded-xl shadow-pop-sm p-4">
                <h3 className="font-display font-bold text-[15px] mb-1.5">{f.q}</h3>
                <p className="text-sm leading-relaxed text-ink-secondary">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tools */}
        <section className="mt-12 mb-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="heading-chip bg-neon-cyan" />
            <h2 className="font-display font-bold text-[26px] text-black">Go deeper — free tools</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { n: 'Arbitrage Scanner', d: 'Cross-platform price gaps between Polymarket and Kalshi, net of fees.', href: '/tools/arbitrage-scanner', bg: 'var(--neon-cyan)' as string },
              { n: 'LP Reward Scanner', d: 'Which Polymarket liquidity pools actually pay after competition.', href: '/tools/lp-scanner', bg: 'var(--neon-lime)' as string },
              { n: 'Polymarket Whale Tracker', d: 'Live whale trades, graded by skill — see who is behind the volume.', href: '/pulse', bg: 'var(--neon-green)' as string },
            ].map((t) => (
              <Link key={t.href} href={t.href} className="group bg-white border-2 border-black rounded-2xl shadow-pop p-5 hover:-translate-y-1 transition-transform">
                <div className="w-9 h-9 rounded-lg border-2 border-black mb-3" style={{ backgroundColor: t.bg }} />
                <div className="font-display font-bold text-[15px] mb-1">{t.n}</div>
                <p className="text-[12.5px] text-ink-secondary leading-relaxed mb-3">{t.d}</p>
                <span className="font-display font-extrabold text-[11px] tracking-wider bg-black text-white rounded-lg px-3 py-1.5 inline-block group-hover:-translate-y-0.5 transition-transform">
                  OPEN →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
