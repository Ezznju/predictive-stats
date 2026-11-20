import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/db';
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/seo-utils';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Predictions Market Fans collects, uses, and protects your data.',
  alternates: { canonical: `${SITE_URL}/privacy` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/privacy`,
    title: 'Privacy Policy | Predictions Market Fans',
    description: 'How Predictions Market Fans collects, uses, and protects your data.',
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function PrivacyPage() {
  const settings = await getSiteSettings();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-white border-2 border-black rounded-2xl shadow-pop-lg p-6 sm:p-10">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink mb-2">Privacy Policy</h1>
        <p className="text-xs font-mono font-semibold text-ink-muted mb-8">Last updated: November 20, 2026</p>

        <div className="prose max-w-[66ch] prose-headings:font-display prose-headings:font-bold prose-p:text-ink-secondary prose-p:leading-relaxed prose-li:text-ink-secondary prose-h2:text-xl prose-h2:text-ink prose-a:text-black prose-a:underline">
          <h2>Information We Collect</h2>
          <p>
            {settings.siteName} collects minimal personal information. If you subscribe to our newsletter or submit the contact form, we collect the email address and message details you provide. We also collect anonymized usage metrics such as pages visited, interactions, and referral sources.
          </p>

          <h2>How We Use Information</h2>
          <p>
            Email addresses collected through newsletter signups are used solely to deliver our weekly briefing and occasional site updates. You can unsubscribe in one click at any time. We do not sell your email address to third parties.
          </p>

          <h2>Cookies, Analytics &amp; Advertising</h2>
          <p>
            We use essential cookies for core site functionality, <strong>Microsoft Clarity</strong> to understand aggregate reading behavior and improve usability, and <strong>Google AdSense</strong> to display advertisements that help keep our analysis and tools free. Third-party advertising partners such as Google may use cookies to serve ads based on your prior visits to this or other websites. You can manage or opt out of personalized advertising in{' '}
            <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">
              Google Ads Settings
            </a>{' '}
            or via your browser&apos;s cookie controls.
          </p>

          <h2>Third-Party Services</h2>
          <p>
            Our site contains links to prediction market platforms, research tools, and other external websites. We are not responsible for the privacy practices of those third-party sites.
          </p>

          <h2>Contact</h2>
          <p>
            Questions or deletion requests regarding this policy can be directed to{' '}
            <a href="mailto:ezzekielnjuguna.en@gmail.com">ezzekielnjuguna.en@gmail.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
