'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Search } from 'lucide-react';
import { Category } from '@/types';

interface NavbarProps {
  siteName: string;
  categories: Category[];
}

export function Navbar({ siteName, categories }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
            <span className="font-display font-bold text-xl text-black group-hover:text-white transition-colors">
              {siteName}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/articles" className="text-sm text-black/70 hover:text-black transition-colors font-medium">Articles</Link>
            <Link href="/platforms" className="text-sm text-black/70 hover:text-black transition-colors font-medium">Platforms</Link>
            <Link href="/tools/lp-scanner" className="text-sm text-black/70 hover:text-black transition-colors font-medium">LP Scanner</Link>
            <Link href="/about" className="text-sm text-black/70 hover:text-black transition-colors font-medium">About</Link>
            <Link href="/contact" className="text-sm text-black/70 hover:text-black transition-colors font-medium">Contact</Link>
            <Link href="/newsletter" className="text-sm text-black/70 hover:text-black transition-colors font-medium">Newsletter</Link>
            <Link href="/search" className="text-black/70 hover:text-black transition-colors">
              <Search className="w-4 h-4" />
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-black/70 hover:text-black"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-surface-border bg-white shadow-lg">
          <nav className="px-4 py-4 space-y-1">
            <Link href="/articles" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-black/70 hover:text-black hover:bg-surface/30 rounded-lg transition-colors">Articles</Link>
            <Link href="/platforms" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-black/70 hover:text-black hover:bg-surface/30 rounded-lg transition-colors">Platforms</Link>
            <Link href="/tools/lp-scanner" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-black/70 hover:text-black hover:bg-surface/30 rounded-lg transition-colors">LP Scanner</Link>
            <Link href="/about" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-black/70 hover:text-black hover:bg-surface/30 rounded-lg transition-colors">About</Link>
            <Link href="/contact" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-black/70 hover:text-black hover:bg-surface/30 rounded-lg transition-colors">Contact</Link>
            <Link href="/newsletter" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-black/70 hover:text-black hover:bg-surface/30 rounded-lg transition-colors">Newsletter</Link>
            <Link href="/search" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-black/70 hover:text-black hover:bg-surface/30 rounded-lg transition-colors">Search</Link>
            <div className="pt-3 border-t border-surface-border mt-3">
              <p className="px-3 text-xs font-semibold text-black/50 uppercase tracking-wider mb-2">Topics</p>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-1.5 text-sm text-black/70 hover:text-black transition-colors"
                >
                  <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
