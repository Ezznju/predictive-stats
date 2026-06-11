import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { siteSettings, categories } from '@/lib/data';

export function Footer() {
  return (
    <footer className="bg-surface-overlay border-t border-surface-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-amber via-brand-yellow to-brand-orange flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-ink">{siteSettings.siteName}</span>
            </Link>
            <p className="text-sm text-ink-muted leading-relaxed">{siteSettings.siteTagline}</p>
          </div>

          {/* Topics */}
          <div>
            <h4 className="font-display font-semibold text-ink text-sm mb-4">Topics</h4>
            <ul className="space-y-2">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/category/${cat.slug}`} className="text-sm text-ink-muted hover:text-ink transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold text-ink text-sm mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-ink-muted hover:text-ink transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-sm text-ink-muted hover:text-ink transition-colors">Contact</Link></li>
              <li><Link href="/newsletter" className="text-sm text-ink-muted hover:text-ink transition-colors">Newsletter</Link></li>
              <li><Link href="/articles" className="text-sm text-ink-muted hover:text-ink transition-colors">All Articles</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-semibold text-ink text-sm mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-ink-muted hover:text-ink transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-ink-muted hover:text-ink transition-colors">Terms of Use</Link></li>
              <li><Link href="/disclaimer" className="text-sm text-ink-muted hover:text-ink transition-colors">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-faint">
            © {new Date().getFullYear()} {siteSettings.siteName}. All rights reserved. Content is for informational purposes only and does not constitute financial advice.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-amber" />
              <div className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
              <div className="w-1.5 h-1.5 rounded-full bg-brand-yellow" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
