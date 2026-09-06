import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ExternalLink, ArrowRight, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { ScannerLiveStatus } from '@/components/ScannerLiveStatus';
import { ToolShareBar } from '@/components/ToolShareBar';
import { fetchKalshiSmartMoney } from '@/lib/kalshi-smart-money';

export const revalidate = 600;
export const maxDuration = 60;

const BASE = 'https://predictionsmarketfans.com';

function fmtVol(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Kalshi Smart Money Signals — Where Big Money Is Resting',
    description:
      'The Kalshi markets with serious capital resting in the order book, the biggest 24h price moves, and the contracts expiring this week. Free, no signup.',
    alternates: { canonical: `${BASE}/kalshi-smart-money` },
    openGraph: {
      type: 'website',
      title: 'Kalshi Smart Money Signals — Where Big Money Is Resting',
      description:
        'The Kalshi markets with serious capital in the order book, the biggest 24h price changes, and expiring-heavy markets.',
      images: [{ url: '/kalshi-smart-money/og', width: 1200, height: 630, type: 'image/png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Kalshi Smart Money Signals',
      description: 'Where big money is resting on Kalshi. Free, no signup.',
      images: ['/kalshi-smart-money/og'],
    },
  };
}

function SignalRow({
  s,
  showResting,
  showChange,
  showDays,
}: {
  s: {
    question: string;
    volume24h: number;
    yesPrice: number;
    priceChangeCents: number | null;
    totalResting: number;
    biggestWall: { side: 'YES' | 'NO'; price: number; size: number } | null;
    kalshiUrl: string;
    daysLeft: number | null;
  };
  showResting: boolean;
  showChange: boolean;
  showDays: boolean;
}) {
  const change = s.priceChangeCents;
  return (
    <div className="bg-white border-2 border-black rounded-xl shadow-pop-sm p-4 hover:-translate-y-0.5 hover:shadow-pop transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-display font-bold text-[14px] leading-tight line-clamp-2 text-black">{s.question}</div>
          <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-xs">
            <span className="font-mono font-bold text-neon-green">{(s.yesPrice * 100).toFixed(0)}¢ YES</span>
            <span className="font-mono text-ink-faint">{fmtVol(s.volume24h)} vol/24h</span>
            {showResting && (
              <span className="font-mono font-bold text-ink">{fmtVol(s.totalResting)} resting</span>
            )}
            {showChange && s.priceChangeCents != null && (
              <span className={`font-mono font-bold ${s.priceChangeCents >= 0 ? 'text-neon-green' : 'text-brand-pink'}`}>
                {s.priceChangeCents >= 0 ? '+' : ''}{s.priceChangeCents.toFixed(1)}¢
              </span>
            )}
            {showDays && s.daysLeft != null && (
              <span className="font-mono text-brand-orange font-bold">{s.daysLeft}d left</span>
            )}
          </div>
          {showResting && s.biggestWall && (
            <div className="text-[11px] font-semibold text-ink-faint mt-1">
              Biggest wall: {s.biggestWall.side} @ {(s.biggestWall.price * 100).toFixed(1)}¢ · {fmtVol(s.biggestWall.size)}
            </div>
          )}
        </div>
        <a
          href={s.kalshiUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          aria-label={`Open ${s.question} on Kalshi`}
          className="flex-shrink-0 inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-1 border-2 border-black rounded-lg bg-neon-green text-black hover:-translate-y-0.5 hover:shadow-pop-sm transition-all whitespace-nowrap"
        >
          Kalshi <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  sub,
  labelBg,
  signals,
  showResting,
  showChange,
  showDays,
}: {
  icon: typeof DollarSign;
  title: string;
  sub: string;
  labelBg: string;
  signals: import('@/lib/kalshi-smart-money').KalshiSignal[];
  showResting: boolean;
  showChange: boolean;
  showDays: boolean;
}) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg border-2 border-black flex items-center justify-center" style={{ backgroundColor: labelBg }}>
          <Icon className="w-4 h-4 text-black" />
        </div>
        <h2 className="font-display font-bold text-[24px] text-black">{title}</h2>
      </div>
      <p className="text-sm text-ink-secondary mb-5 max-w-2xl">{sub}</p>
      {signals.length === 0 ? (
        <p className="text-sm text-ink-faint bg-white border-2 border-black rounded-xl p-6 shadow-pop-sm">No qualifying markets right now — check back soon.</p>
      ) : (
        <div className="grid gap-3">
          {signals.map((s, i) => (
            <SignalRow key={s.ticker + '-' + i} s={s} showResting={showResting} showChange={showChange} showDays={showDays} />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function KalshiSmartMoneyPage() {
  const board = await fetchKalshiSmartMoney(15);
  const renderedAt = new Date().toISOString();

  const faq = [
    {
      q: 'What is Kalshi Smart Money Signals?',
      a: 'It\u2019s a live board of where serious capital is resting in Kalshi\u2019s order books — the markets with millions in standing orders, the biggest 24h price moves, and the heaviest-volume markets approaching their decision date.',
    },
    {
      q: 'Why can\u2019t I see individual whale wallets on Kalshi?',
      a: 'Kalshi is a centralized, federally regulated exchange. Unlike Polymarket (which runs on-chain, where every trade is publicly visible), Kalshi doesn\u2019t expose individual trader identities — for anyone, on any platform. This tool shows the same kind of intelligence using the data that does exist: order book walls, momentum, and volume.',
    },
    {
      q: 'What does \u201cresting capital\u201d mean?',
      a: 'It\u2019s the total dollar value of limit orders currently sitting in a market\u2019s order book — committed capital waiting to be filled. Markets with millions in resting orders are where market makers and large traders are actively managing positions.',
    },
    {
      q: 'Is this financial advice?',
      a: 'No. All data is pulled live from Kalshi\u2019s public API for informational purposes only. Prices are implied probabilities, not predictions, and prediction market participation involves risk of loss.',
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Kalshi Smart Money Signals',
        url: `${BASE}/kalshi-smart-money`,
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
          { '@type': 'ListItem', position: 2, name: 'Kalshi Smart Money', item: `${BASE}/kalshi-smart-money` },
        ],
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }) }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-muted mb-5">
          <Link href="/" className="hover:text-ink transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink-secondary font-semibold">Kalshi Smart Money</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="heading-chip bg-neon-green" />
            <h1 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl leading-[0.98] uppercase tracking-tight">
              Kalshi Smart Money Signals
            </h1>
          </div>
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <ScannerLiveStatus updatedAt={renderedAt} />
            <span className="text-xs text-ink-faint font-semibold">Live order book data from Kalshi&apos;s public API</span>
          </div>
          <p className="text-[16.5px] text-ink-secondary mt-4 leading-relaxed max-w-3xl">
            Where serious capital is resting on Kalshi right now — the markets with{' '}
            <strong className="text-ink">millions committed in the order book</strong>, the{' '}
            <strong className="text-ink">biggest price moves today</strong>, and the{' '}
            <strong className="text-ink">heavy-volume decision markets expiring this week</strong>. Honest note: Kalshi is
            centralized, so individual wallets aren&apos;t public — but the order book doesn&apos;t lie.
          </p>
          <ToolShareBar
            url="https://predictionsmarketfans.com/kalshi-smart-money"
            title="Kalshi Smart Money Signals — order book walls, momentum moves, decision week"
          />
        </header>

        {/* Section 1: Big Money */}
        <Section
          icon={DollarSign}
          title="Big Money in Play"
          sub="Markets with the most capital resting in their order books right now — where market makers and large traders have committed real dollars."
          labelBg="#D9F24B"
          signals={board.bigMoney}
          showResting
          showChange={false}
          showDays={false}
        />

        {/* Section 2: Momentum */}
        <Section
          icon={TrendingUp}
          title="Momentum Moves"
          sub="The biggest 24h price shifts on markets with real volume — where conviction shifted today."
          labelBg="#29C5F6"
          signals={board.momentum}
          showResting={false}
          showChange
          showDays={false}
        />

        {/* Section 3: Decision Week */}
        <Section
          icon={Clock}
          title="Decision Week"
          sub="Heavy-volume markets expiring in the next 14 days — the ones where the answer is about to be known."
          labelBg="#FFC7C7"
          signals={board.decisionWeek}
          showResting={false}
          showChange={false}
          showDays
        />

        {/* FAQ */}
        <section className="mt-12 mb-4 max-w-3xl">
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

        {/* Sibling tools */}
        <section className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { n: 'Kalshi Trending', d: 'Most active Kalshi markets by 24h volume.', href: '/kalshi-trending-markets', bg: 'var(--neon-green)' as string },
              { n: 'Polymarket Whale Tracker', d: 'Live whale trades, graded by skill.', href: '/pulse', bg: 'var(--neon-lime)' as string },
              { n: 'Arbitrage Scanner', d: 'Cross-platform gaps, net of fees.', href: '/tools/arbitrage-scanner', bg: 'var(--neon-cyan)' as string },
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
