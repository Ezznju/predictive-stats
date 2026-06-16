import Link from 'next/link';
import { Twitter, Linkedin } from 'lucide-react';
import { Category, SiteSettings } from '@/types';
import {
  FlowerShape,
  UShape,
  BoldCircle,
  HalfCircle,
  CornerDotSquare,
  QuatrefoilFlower,
} from '@/components/GeometricShapes';

interface FooterProps {
  settings: SiteSettings;
  categories: Category[];
}

export function Footer({ settings, categories }: FooterProps) {
  return (
    <footer className="bg-surface-overlay border-t-2 border-black mt-16 relative overflow-hidden">
      {/* Geometric shape decorations */}
      <FlowerShape size={90} color="#FF00B8" className="absolute -top-8 right-[15%] opacity-70" />
      <UShape size={70} color="#4845F0" strokeWidth={16} className="absolute bottom-8 left-[8%] opacity-60 hidden md:block" />
      <CornerDotSquare size={54} color="#2BD96E" dotColor="#9D5CFF" className="absolute top-1/3 -right-4 opacity-80" />
      <BoldCircle size={80} color="#D9F24B" className="absolute -bottom-10 right-[40%] opacity-60" />
      <HalfCircle size={60} color="#29C5F6" direction="down" className="absolute -top-6 left-[30%] opacity-70" />
      <QuatrefoilFlower size={48} petalColor="#C9B8F5" holeColor="#FF9F2E" className="absolute bottom-16 right-[25%] opacity-80 hidden md:block" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.svg" alt="" className="w-8 h-8 rounded-lg" />
              <span className="font-display font-bold text-lg text-black">{settings.siteName}</span>
            </Link>
            <p className="text-sm text-black/60 leading-relaxed">{settings.siteTagline}</p>
          </div>

          {/* Topics */}
          <div>
            <h4 className="font-display font-semibold text-black text-sm mb-4">Topics</h4>
            <ul className="space-y-2">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/category/${cat.slug}`} className="text-sm text-black/60 hover:text-black transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold text-black text-sm mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-black/60 hover:text-black transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-sm text-black/60 hover:text-black transition-colors">Contact</Link></li>
              <li><Link href="/newsletter" className="text-sm text-black/60 hover:text-black transition-colors">Newsletter</Link></li>
              <li><Link href="/articles" className="text-sm text-black/60 hover:text-black transition-colors">All Articles</Link></li>
              <li><Link href="/platforms" className="text-sm text-black/60 hover:text-black transition-colors">Platform Reviews</Link></li>
              <li><Link href="/tools" className="text-sm text-black/60 hover:text-black transition-colors">Free Tools</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-semibold text-black text-sm mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-black/60 hover:text-black transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-black/60 hover:text-black transition-colors">Terms of Use</Link></li>
              <li><Link href="/disclaimer" className="text-sm text-black/60 hover:text-black transition-colors">Disclaimer</Link></li>
              <li><Link href="/disclosure" className="text-sm text-black/60 hover:text-black transition-colors">Affiliate Disclosure</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-black/50">
            © {new Date().getFullYear()} {settings.siteName}. All rights reserved. Content is for informational purposes only and does not constitute financial advice.
          </p>
          <div className="flex items-center gap-4">
            {settings.socialTwitter && (
              <a
                href={settings.socialTwitter.startsWith('http') ? settings.socialTwitter : `https://twitter.com/${settings.socialTwitter.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-black/50 hover:text-black transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
            )}
            {settings.socialLinkedin && (
              <a
                href={settings.socialLinkedin.startsWith('http') ? settings.socialLinkedin : `https://linkedin.com/in/${settings.socialLinkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-black/50 hover:text-black transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            )}
            <div className="flex items-center gap-1 ml-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FFE642]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#00E676]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#0055FF]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF0066]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#E01FFF]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
