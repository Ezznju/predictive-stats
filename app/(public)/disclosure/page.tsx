import { Metadata } from 'next';
import Link from 'next/link';
import { Info, ExternalLink, Heart, ShieldCheck } from 'lucide-react';
import { getSiteSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Affiliate Disclosure',
  description:
    'How Predictions Market Fans earns revenue, our affiliate relationships, and how we keep reviews independent.',
  alternates: { canonical: 'https://predictionsmarketfans.com/disclosure' },
};

export default async function DisclosurePage() {
  const settings = await getSiteSettings();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="w-8 h-8 text-black" />
        <h1 className="font-display font-bold text-4xl text-ink">
          Affiliate Disclosure
        </h1>
      </div>

      {/* TL;DR card */}
      <div className="bg-white rounded-2xl border-2 border-black shadow-pop p-6 mb-10">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-display font-semibold text-ink text-lg">
              The short version
            </p>
            <p className="text-ink-secondary text-sm mt-2 leading-relaxed">
              Some links on {settings.siteName} are affiliate or referral links.
              If you click one and sign up or make a purchase, we may earn a
              commission — at <strong>no extra cost to you</strong>. This is how
              we keep the site running. Our editorial opinions, ratings, and
              reviews are always our own and are never influenced by compensation.
            </p>
          </div>
        </div>
      </div>

      {/* Full disclosure */}
      <div className="prose max-w-none prose-headings:font-display prose-p:text-ink-secondary prose-li:text-ink-secondary prose-h2:text-xl prose-h2:text-ink prose-a:text-black">
        <h2>How We Make Money</h2>
        <p>
          {settings.siteName} is an independently operated publication.
          Running the site — hosting, research tools, APIs, and the time it
          takes to write in-depth reviews — costs real money. To keep everything
          free to read, we participate in affiliate programs offered by some of
          the platforms we review.
        </p>
        <p>
          When you click a link to a platform (for example, through our{' '}
          <Link href="/platforms">platform reviews</Link> or comparison tables)
          and then sign up, deposit, or place a trade, the platform may pay us a
          small referral fee. The price you pay is <em>exactly the same</em> — affiliate
          commissions come out of the platform&rsquo;s marketing budget, not your
          pocket.
        </p>

        <h2>What This Means for Our Content</h2>
        <p>
          <strong>Nothing changes.</strong> Here&rsquo;s how we keep editorial
          and business separate:
        </p>
        <ul>
          <li>
            <strong>Reviews are honest.</strong> Every platform review is based
            on hands-on testing — fee structures, liquidity depth, user
            experience, market variety, and regulatory standing. A platform that
            pays us a commission does not get a higher rating than one that
            doesn&rsquo;t.
          </li>
          <li>
            <strong>Ratings are earned.</strong> Our five-category rating system
            (liquidity, fees, market variety, UX, trust) is the same whether or
            not we have a business relationship with the platform.
          </li>
          <li>
            <strong>We cover platforms we don&rsquo;t earn from.</strong> If a
            platform is worth writing about, we write about it — affiliate deal
            or not.
          </li>
          <li>
            <strong>Compensation never influences recommendations.</strong> Our
            &ldquo;Best For&rdquo; picks and comparison rankings are based on
            who genuinely serves each user type best.
          </li>
        </ul>

        <h2>Where You&rsquo;ll See Affiliate Links</h2>
        <p>Affiliate links may appear in the following places on our site:</p>
        <ul>
          <li>
            <Link href="/platforms">Platform review pages</Link> — &ldquo;Visit
            Platform&rdquo; or &ldquo;Start Trading&rdquo; buttons
          </li>
          <li>Comparison tables and &ldquo;Best For&rdquo; recommendation cards</li>
          <li>
            In-article links that take you to a platform&rsquo;s sign-up or
            landing page
          </li>
        </ul>
        <p>
          All outbound platform links route through our{' '}
          <code>/go/[platform]</code> redirect so we can track clicks
          transparently. If no affiliate relationship exists for a given
          platform, the redirect simply sends you to the platform&rsquo;s public
          homepage.
        </p>

        <h2>Platforms We Review</h2>
        <p>
          We currently cover Polymarket, Kalshi, PredictIt, Manifold, and
          Metaculus. Not all of these platforms offer affiliate programs, and our
          coverage is not conditional on whether they do.
        </p>

        <h2>Your Trust Matters Most</h2>
        <div className="not-prose">
          <div className="flex items-start gap-3 bg-neon-lime/20 rounded-2xl border-2 border-black p-5 mt-2">
            <Heart className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
            <p className="text-sm text-ink-secondary leading-relaxed">
              We believe transparency builds trust. If you ever feel a review is
              biased or have questions about our affiliate relationships, reach
              out through our{' '}
              <Link
                href="/contact"
                className="underline font-semibold text-ink hover:text-black"
              >
                contact page
              </Link>
              . We take every piece of feedback seriously.
            </p>
          </div>
        </div>

        <h2>FTC Compliance</h2>
        <p>
          This disclosure is provided in accordance with the Federal Trade
          Commission&rsquo;s guidelines on endorsements and testimonials (
          <a
            href="https://www.ftc.gov/legal-library/browse/rules/endorsement-guides"
            target="_blank"
            rel="noopener noreferrer"
          >
            16 CFR Part 255 <ExternalLink className="inline w-3 h-3" />
          </a>
          ). We are committed to full transparency about any financial
          relationships that could influence our content.
        </p>

        <h2>Related Pages</h2>
        <ul>
          <li>
            <Link href="/disclaimer">Disclaimer</Link> — financial risk warning
            and editorial disclaimer
          </li>
          <li>
            <Link href="/privacy">Privacy Policy</Link> — how we handle your
            data
          </li>
          <li>
            <Link href="/terms">Terms of Use</Link> — site usage terms
          </li>
        </ul>

        <p className="text-xs text-ink-faint mt-8">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}
