import { Metadata } from 'next';
import { CopyCodeButton } from '@/components/CopyCodeButton';

export const metadata: Metadata = {
  title: 'Free Embeddable Widgets — Live Prediction Market Data',
  description:
    'Free live widgets for your site: Polymarket trending markets, Kalshi trending, and cross-platform arbitrage. One line of HTML, refreshes automatically, attribution required.',
  alternates: { canonical: 'https://predictionsmarketfans.com/embed' },
};

const SITE = 'https://predictionsmarketfans.com';

const WIDGETS = [
  {
    key: 'trending',
    name: 'Polymarket Trending Markets',
    desc: 'The most active Polymarket markets right now, ranked by 24-hour volume. Refreshes every few minutes.',
    rows: 8,
  },
  {
    key: 'kalshi',
    name: 'Kalshi Trending Markets',
    desc: 'The most active Kalshi markets right now, ranked by 24-hour volume.',
    rows: 8,
  },
  {
    key: 'arbitrage',
    name: 'Cross-Platform Arbitrage',
    desc: 'Live price gaps between Polymarket and Kalshi on the same events, filtered to plausible, tradeable spreads.',
    rows: 6,
  },
] as const;

function snippet(key: string, rows: number, name: string): string {
  const height = rows * 36 + 120;
  return `<iframe src="${SITE}/embed/${key}?rows=${rows}" style="width:100%;max-width:520px;height:${height}px;border:0;" title="${name} — live" loading="lazy"></iframe>
<p style="font-size:12px;font-family:system-ui,sans-serif;margin:6px 0 0;">Live data by <a href="${SITE}?utm_source=embed&utm_medium=widget" target="_blank" rel="noopener">Predictions Market Fans</a></p>`;
}

export default function EmbedGalleryPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="heading-chip bg-neon-cyan" />
          <h1 className="font-display font-bold text-3xl md:text-4xl uppercase tracking-tight">
            Free Embeddable Widgets
          </h1>
        </div>
        <p className="text-[16px] text-ink-secondary max-w-3xl leading-relaxed">
          Drop live prediction market data into any website with one line of HTML. All widgets are free, update
          automatically, and need no API keys. The only ask: <strong className="text-ink">keep the attribution
          link</strong> (it&apos;s included in the code below, and the widget carries the branding either way).
        </p>
      </header>

      <div className="space-y-14">
        {WIDGETS.map((w) => {
          const code = snippet(w.key, w.rows, w.name);
          const height = w.rows * 36 + 120;
          return (
            <section key={w.key}>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="font-display font-bold text-2xl text-black">{w.name}</h2>
              </div>
              <p className="text-sm text-ink-secondary mb-5 max-w-2xl">{w.desc}</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Live preview */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ink-faint mb-2">Live preview</p>
                  <iframe
                    src={`/embed/${w.key}?rows=${w.rows}`}
                    title={`${w.name} preview`}
                    className="w-full rounded-xl border-2 border-black shadow-pop bg-white"
                    style={{ height }}
                    loading="lazy"
                  />
                </div>

                {/* Snippet */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">Embed code</p>
                    <CopyCodeButton code={code} />
                  </div>
                  <pre className="bg-black text-[#9ae6b4] text-[11px] leading-relaxed rounded-xl border-2 border-black shadow-pop-sm p-4 overflow-x-auto whitespace-pre-wrap break-all">
                    {code}
                  </pre>
                  <ul className="mt-3 space-y-1 text-[12px] text-ink-faint font-semibold">
                    <li>· Rows: add <code className="bg-black/5 px-1 rounded">{'?rows='}</code> 5 to 15 (default 8)</li>
                    <li>· Refreshes automatically every few minutes</li>
                    <li>· Works on WordPress, Ghost, Webflow, raw HTML</li>
                  </ul>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <section className="mt-14 max-w-3xl">
        <h2 className="font-display font-bold text-2xl mb-4">Rules of the road</h2>
        <div className="space-y-3 text-[15px] text-ink-secondary leading-relaxed">
          <p>
            <strong className="text-ink">Free forever, no signup.</strong> Use the widgets on as many pages as you
            like, including commercial sites.
          </p>
          <p>
            <strong className="text-ink">Keep the attribution link.</strong> It keeps the data free. The widgets
            display the branding inside the frame regardless, but the link is what keeps this sustainable.
          </p>
          <p>
            <strong className="text-ink">No modification of the data.</strong> Embed as-is — the numbers refresh on
            their own.
          </p>
        </div>
      </section>
    </div>
  );
}
