import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Predictions Market Fans collects, uses, and protects your data.',
  alternates: { canonical: '/privacy' },
};

export default async function PrivacyPage() {
  const settings = await getSiteSettings();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display font-bold text-4xl text-ink mb-8">Privacy Policy</h1>
      <div className="prose max-w-none prose-headings:font-display prose-p:text-ink-secondary prose-li:text-ink-secondary prose-h2:text-xl prose-h2:text-ink prose-a:text-black">
        <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        <h2>Information We Collect</h2>
        <p>{settings.siteName} collects minimal personal information. If you subscribe to our newsletter, we collect your email address. We use analytics to understand site traffic, which may collect anonymized usage data such as pages visited, time on site, and referral sources.</p>
        <h2>How We Use Information</h2>
        <p>Email addresses collected through newsletter signups are used solely to deliver our weekly briefing. We do not sell, trade, or share your email with third parties. Analytics data is used in aggregate to improve content and user experience.</p>
        <h2>Cookies</h2>
        <p>We use essential cookies for site functionality and analytics cookies to measure traffic. No advertising or tracking cookies are used.</p>
        <h2>Third-Party Services</h2>
        <p>Our site may contain links to prediction market platforms, research tools, and other third-party websites. We are not responsible for the privacy practices of these external sites.</p>
        <h2>Contact</h2>
        <p>Questions about this policy can be directed to ezzekielnjuguna.en@gmail.com.</p>
      </div>
    </div>
  );
}
