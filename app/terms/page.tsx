import { Metadata } from 'next';
import { siteSettings } from '@/lib/data';

export const metadata: Metadata = { title: 'Terms of Use' };

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display font-bold text-4xl text-white mb-8">Terms of Use</h1>
      <div className="prose prose-invert max-w-none prose-headings:font-display prose-p:text-slate-400 prose-li:text-slate-400 prose-h2:text-xl prose-h2:text-white">
        <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        <h2>Acceptance of Terms</h2>
        <p>By accessing {siteSettings.siteName}, you agree to these terms. If you do not agree, please do not use the site.</p>
        <h2>Content and Intellectual Property</h2>
        <p>All articles, analysis, and content published on this site are the intellectual property of {siteSettings.siteName} and its authors. You may share links and brief excerpts with attribution. Republishing full articles requires written permission.</p>
        <h2>Not Financial Advice</h2>
        <p>All content is for informational and educational purposes only. Nothing on this site constitutes financial advice, investment recommendations, or trading guidance. Prediction market participation involves risk of loss. Always conduct your own research.</p>
        <h2>Accuracy</h2>
        <p>We strive for accuracy in all content. Market data and prices are sourced from public APIs and may have a delay. If you identify an error, please contact us for correction.</p>
        <h2>User Conduct</h2>
        <p>You agree not to scrape, reproduce, or redistribute site content without permission, or use the site in ways that violate applicable laws.</p>
      </div>
    </div>
  );
}
