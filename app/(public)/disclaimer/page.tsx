import { Metadata } from 'next';
import { AlertTriangle } from 'lucide-react';
import { getSiteSettings } from '@/lib/db';
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/seo-utils';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Disclaimer',
  description: 'Editorial and financial disclaimer for Predictions Market Fans content.',
  alternates: { canonical: `${SITE_URL}/disclaimer` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/disclaimer`,
    title: 'Disclaimer | Predictions Market Fans',
    description: 'Editorial and financial disclaimer for Predictions Market Fans content.',
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function DisclaimerPage() {
  const settings = await getSiteSettings();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-white border-2 border-black rounded-2xl shadow-pop-lg p-6 sm:p-10">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-8 h-8 text-black shrink-0" aria-hidden="true" />
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink">Disclaimer</h1>
        </div>

        <div className="bg-[#FFF7E6] border-2 border-black rounded-2xl p-5 mb-8 shadow-pop-sm">
          <p className="text-black font-display font-bold text-lg">This website does not provide financial advice.</p>
          <p className="text-ink-secondary text-sm mt-1.5">All content is for informational and educational purposes only.</p>
        </div>

        <div className="prose max-w-[66ch] prose-headings:font-display prose-headings:font-bold prose-p:text-ink-secondary prose-p:leading-relaxed prose-li:text-ink-secondary prose-h2:text-xl prose-h2:text-ink prose-a:text-black prose-a:underline">
          <h2>General Disclaimer</h2>
          <p>{settings.siteName} provides analysis, commentary, and educational content about prediction markets, forecasting, and related topics. This content should not be construed as financial advice, investment recommendations, or trading guidance.</p>

          <h2>Risk Warning</h2>
          <p>Prediction market participation involves substantial risk of loss. Past performance of any strategy, market, or indicator discussed on this site does not guarantee future results. You should never invest money you cannot afford to lose.</p>

          <h2>Data Accuracy</h2>
          <p>Market data, prices, and statistics referenced in our articles are sourced from public APIs and third-party platforms. While we make every effort to verify accuracy, we cannot guarantee that all data is current, complete, or error-free. Market conditions change rapidly.</p>

          <h2>No Endorsement</h2>
          <p>Mention of specific platforms (Polymarket, Kalshi, Metaculus, etc.) does not constitute an endorsement. We review and analyze these platforms as part of our editorial coverage. Users should conduct their own due diligence before using any platform.</p>

          <h2>Regulatory Notice</h2>
          <p>Prediction market regulations vary by jurisdiction. Some platforms may not be available in your region. It is your responsibility to understand and comply with all applicable laws and regulations in your jurisdiction before participating in prediction markets.</p>
        </div>
      </div>
    </div>
  );
}
