import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { siteSettings, categories } from '@/lib/data';
import {
  FlowerShape,
  UShape,
  DottedSquare,
  BoldCircle,
  DaisyShape,
  HalfCircle,
} from '@/components/GeometricShapes';

export function Footer() {
  return (
    <footer className="bg-surface-overlay border-t border-surface-border mt-16 relative overflow-hidden">
      {/* Geometric shape decorations */}
      <FlowerShape size={90} color="#FF0066" className="absolute -top-8 right-[15%] opacity-30" />
      <UShape size={70} color="#0055FF" strokeWidth={12} className="absolute bottom-8 left-[8%] opacity-30" />
      <DottedSquare size={50} color="#00E676" dotColor="#E01FFF" className="absolute top-1/3 -right-4 opacity-40" />
      <BoldCircle size={80} color="#FFE642" className="absolute -bottom-10 right-[40%] opacity-25" />
      <HalfCircle size={60} color="#FF0066" direction="down" className="absolute -top-6 left-[30%] opacity-30" />
      <DaisyShape size={45} petalColor="#00E5FF" className="absolute bottom-16 right-[25%] opacity-35" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-black">{siteSettings.siteName}</span>
            </Link>
            <p className="text-sm text-black/60 leading-relaxed">{siteSettings.siteTagline}</p>
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
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-semibold text-black text-sm mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-black/60 hover:text-black transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-black/60 hover:text-black transition-colors">Terms of Use</Link></li>
              <li><Link href="/disclaimer" className="text-sm text-black/60 hover:text-black transition-colors">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-black/50">
            © {new Date().getFullYear()} {siteSettings.siteName}. All rights reserved. Content is for informational purposes only and does not constitute financial advice.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
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
