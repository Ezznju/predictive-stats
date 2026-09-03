'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Search, ChevronRight } from 'lucide-react';
import { Category } from '@/types';
import { InstantSearch } from '@/components/InstantSearch';

interface NavbarProps {
  siteName: string;
  categories: Category[];
}

const openSearch = () => window.dispatchEvent(new CustomEvent('pmf:open-search'));

const PRIMARY = [
  { href: '/articles', label: 'Articles' },
  { href: '/platforms', label: 'Platforms' },
  { href: '/tools', label: 'Tools' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/newsletter', label: 'Newsletter' },
];

export function Navbar({ siteName, categories }: NavbarProps) {
  // Two-state drawer: mounted (in DOM) + shown (animates in). Lets the panel
  // slide out fully before unmounting instead of vanishing mid-animation.
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);

  const openDrawer = () => {
    setMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
  };
  const closeDrawer = () => {
    setShown(false);
    setTimeout(() => setMounted(false), 280);
  };

  // Escape closes + body scroll lock while the drawer is open
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mounted]);

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mark.svg"
              alt=""
              className="w-9 h-9 rounded-xl shadow-pop-sm group-hover:-translate-y-0.5 transition-transform"
            />
            <span className="font-display font-bold text-xl text-black group-hover:text-brand-orange transition-colors">
              {siteName}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {PRIMARY.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm text-black/70 hover:text-black transition-colors font-medium">
                {l.label}
              </Link>
            ))}
            <button onClick={openSearch} aria-label="Search (press /)" className="text-black/70 hover:text-black transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => (shown ? closeDrawer() : openDrawer())}
            aria-label={shown ? 'Close menu' : 'Open menu'}
            aria-expanded={shown}
            className="md:hidden p-2 text-black/70 hover:text-black"
          >
            {shown ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Category bar (desktop) */}
        <div className="hidden md:flex items-center gap-1 pb-2 overflow-x-auto scrollbar-hide">
          {categories.slice(0, 8).map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="px-3 py-1 text-xs font-semibold text-black/70 hover:text-black rounded-full border border-transparent hover:border-black hover:bg-neon-lime transition-all whitespace-nowrap"
            >
              {cat.name}
            </Link>
          ))}
          <Link
            href="/articles"
            className="px-3 py-1 text-xs font-bold text-black bg-neon-cyan border border-black rounded-full hover:bg-neon-magenta hover:text-white transition-all whitespace-nowrap"
          >
            All Topics →
          </Link>
        </div>
      </div>

      {/* ── Mobile slide-in drawer ── */}
      {mounted && (
        <div className={`md:hidden fixed inset-0 z-50 ${shown ? '' : 'pointer-events-none'}`} aria-hidden={!shown}>
          {/* Backdrop */}
          <div
            onClick={closeDrawer}
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${shown ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Panel */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className={`absolute right-0 top-0 h-full w-[86%] max-w-sm bg-white border-l-2 border-black shadow-[-8px_0_0_#000] flex flex-col transition-transform duration-300 ease-out ${
              shown ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-black shrink-0">
              <span className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-mark.svg" alt="" className="w-8 h-8 rounded-lg border-2 border-black" />
                <span className="font-display font-bold text-base text-black">{siteName}</span>
              </span>
              <button onClick={closeDrawer} aria-label="Close menu" className="p-2 -mr-2 text-black/60 hover:text-black transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search + primary links */}
            <nav className="px-5 pt-2 flex-1 overflow-y-auto">
              <button
                onClick={() => { closeDrawer(); openSearch(); }}
                className="flex items-center justify-between w-full py-3.5 border-b-2 border-black/5 font-display font-bold text-[15px] text-ink"
              >
                <span className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-black/60" />
                  Search
                </span>
                <span className="text-[10px] font-mono font-bold text-black/40 border-2 border-black/20 rounded px-1.5 py-0.5">/</span>
              </button>

              {PRIMARY.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={closeDrawer}
                  className="group flex items-center justify-between py-3.5 border-b-2 border-black/5 font-display font-bold text-[15px] text-ink"
                >
                  {l.label}
                  <ChevronRight className="w-4 h-4 text-black/30 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}

              {/* Topics */}
              {categories.length > 0 && (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 mt-6 mb-2.5">Topics</p>
                  <div className="flex flex-wrap gap-2 pb-4">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/category/${cat.slug}`}
                        onClick={closeDrawer}
                        className="px-3 py-1.5 text-xs font-bold rounded-full border-2 border-black transition-transform hover:-translate-y-0.5"
                        style={{ backgroundColor: cat.color, color: '#fff' }}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </nav>

            {/* Bottom CTA */}
            <div className="shrink-0 p-4 border-t-2 border-black bg-[#FFE642]">
              <p className="font-display font-bold text-sm text-black">The Weekly Signal</p>
              <p className="text-xs text-black/70 mt-0.5 mb-3">Sharpest prediction market analysis, every Friday.</p>
              <Link
                href="/newsletter"
                onClick={closeDrawer}
                className="block text-center bg-black text-white text-xs font-bold uppercase tracking-widest rounded-lg py-2.5 hover:bg-black/85 transition-colors"
              >
                Subscribe free
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Instant search overlay (opens via /, Ctrl+K, or the buttons above) */}
      <InstantSearch />
    </header>
  );
}
