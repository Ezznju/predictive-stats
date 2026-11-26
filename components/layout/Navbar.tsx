'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Search,
  ChevronRight,
  ChevronDown,
  ArrowLeftRight,
  TrendingUp,
  Activity,
  Flame,
  BarChart3,
  DollarSign,
  Calculator,
  Percent,
} from 'lucide-react';
import { Category } from '@/types';
import { InstantSearch } from '@/components/InstantSearch';
import { getContrastInk } from '@/lib/seo-utils';

interface NavbarProps {
  siteName: string;
  categories: Category[];
}

const openSearch = () => window.dispatchEvent(new CustomEvent('pmf:open-search'));

const PRIMARY = [
  { href: '/articles', label: 'Articles' },
  { href: '/platforms', label: 'Platforms' },
  { href: '/tools', label: 'Tools', hasDropdown: true },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/newsletter', label: 'Newsletter' },
];

const LIVE_TOOLS = [
  {
    href: '/tools/arbitrage-scanner',
    name: 'Arbitrage Scanner',
    desc: 'Cross-platform Polymarket × Kalshi spreads',
    icon: ArrowLeftRight,
    color: '#FF00B8',
    badge: 'LIVE',
  },
  {
    href: '/tools/lp-scanner',
    name: 'LP Reward Scanner',
    desc: 'Polymarket reward pools ranked by net APR',
    icon: TrendingUp,
    color: '#7B3FE4',
    badge: 'LIVE',
  },
  {
    href: '/pulse',
    name: 'Polymarket Whale Tracker',
    desc: 'Skill-graded whale trades & leaderboard',
    icon: Activity,
    color: '#2BD96E',
    badge: 'LIVE',
  },
  {
    href: '/kalshi-smart-money',
    name: 'Kalshi Smart Money',
    desc: 'Large resting walls & 24h momentum shifts',
    icon: DollarSign,
    color: '#00A36C',
    badge: 'LIVE',
  },
  {
    href: '/polymarket-trending-markets',
    name: 'Polymarket Trending',
    desc: 'Top 25 active markets by 24h volume',
    icon: Flame,
    color: '#FF7900',
    badge: 'LIVE',
  },
  {
    href: '/kalshi-trending-markets',
    name: 'Kalshi Trending',
    desc: 'Most active regulated event contracts',
    icon: BarChart3,
    color: '#29C5F6',
    badge: 'LIVE',
  },
];

const CALCULATOR_TOOLS = [
  {
    href: '/tools/kalshi-combo-calculator',
    name: 'Kalshi Combo & Blue Arrow',
    desc: 'Simulate multi-leg payouts & DNP scalar haircuts',
    icon: Calculator,
    color: '#29C5F6',
    badge: 'NEW',
  },
  {
    href: '/tools/kalshi-fee-calculator',
    name: 'Kalshi vs. Polymarket Fees',
    desc: 'Exact quadratic fees & break-even win rate',
    icon: Percent,
    color: '#C6F23A',
    badge: 'NEW',
  },
];

const TOOL_ROUTE_PREFIXES = [
  '/tools',
  '/pulse',
  '/polymarket-trending-markets',
  '/kalshi-trending-markets',
  '/kalshi-smart-money',
];

export function Navbar({ siteName, categories }: NavbarProps) {
  const pathname = usePathname();
  // Two-state drawer: mounted (in DOM) + shown (animates in). Lets the panel
  // slide out fully before unmounting instead of vanishing mid-animation.
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isToolsActive = TOOL_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Close desktop dropdown on navigation
  useEffect(() => {
    setToolsOpen(false);
  }, [pathname]);

  // Close desktop dropdown on outside click or Escape
  useEffect(() => {
    if (!toolsOpen) return;
    const onDown = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setToolsOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [toolsOpen]);

  // Slim down the sticky navbar on scroll (collapses secondary topic bar)
  // to give readers ~50px more vertical reading canvas.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        setScrolled((prev) => (prev ? y > 24 : y > 64));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

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

  const handleToolsMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setToolsOpen(true);
  };

  const handleToolsMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setToolsOpen(false), 140);
  };

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b-2 border-black transition-all duration-200 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top bar */}
        <div className={`flex items-center justify-between transition-all duration-200 ${scrolled ? 'h-14' : 'h-16'}`}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mark.svg"
              alt=""
              className="w-9 h-9 rounded-xl shadow-pop-sm group-hover:-translate-y-0.5 transition-transform"
            />
            <span className="font-display font-bold text-xl text-black group-hover:underline decoration-2 underline-offset-4 transition-all">
              {siteName}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Primary" className="hidden md:flex items-center gap-4 lg:gap-5">
            {PRIMARY.map((l) => {
              if (l.hasDropdown) {
                return (
                  <div
                    key={l.href}
                    ref={toolsRef}
                    className="relative"
                    onMouseEnter={handleToolsMouseEnter}
                    onMouseLeave={handleToolsMouseLeave}
                  >
                    <button
                      type="button"
                      onClick={() => setToolsOpen((o) => !o)}
                      aria-expanded={toolsOpen}
                      aria-haspopup="true"
                      className={`inline-flex items-center gap-1 text-sm transition-all font-semibold px-2.5 py-1 rounded-lg ${
                        isToolsActive || toolsOpen
                          ? 'bg-black text-brand-yellow'
                          : 'text-black/85 hover:text-black hover:bg-black/10'
                      }`}
                    >
                      <span>{l.label}</span>
                      <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded-full bg-[#C6F23A] text-black border border-black leading-tight">
                        8
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${toolsOpen ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </button>

                    {/* Tools Mega-Dropdown */}
                    {toolsOpen && (
                      <div
                        role="region"
                        aria-label="Free prediction market tools"
                        className="absolute right-0 lg:left-1/2 lg:-translate-x-1/2 top-full mt-2 w-[560px] max-w-[calc(100vw-2rem)] bg-[#FFFDF9] border-2 border-black rounded-2xl shadow-pop-lg p-4 z-50"
                      >
                        {/* Calculators row (highlighted) */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2 px-1">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-black/60">
                              Instant Free Calculators
                            </span>
                            <span className="text-[10px] font-mono font-bold text-black/50">Zero signup</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {CALCULATOR_TOOLS.map((tool) => (
                              <Link
                                key={tool.href}
                                href={tool.href}
                                onClick={() => setToolsOpen(false)}
                                className="group flex items-start gap-2.5 p-2.5 rounded-xl bg-[#FFF7E6] border-2 border-black hover:bg-[#FFE642] hover:-translate-y-0.5 shadow-pop-sm transition-all"
                              >
                                <div
                                  className="w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center shrink-0 mt-0.5"
                                  style={{ backgroundColor: tool.color }}
                                >
                                  <tool.icon className="w-4 h-4 text-black" aria-hidden="true" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-display font-bold text-xs text-black leading-tight truncate">
                                      {tool.name}
                                    </span>
                                    <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded bg-black text-[#C6F23A] shrink-0">
                                      {tool.badge}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-black/70 leading-snug mt-0.5">{tool.desc}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* Live Scanners & Market Boards */}
                        <div>
                          <span className="block text-[10px] font-mono font-bold uppercase tracking-widest text-black/60 mb-2 px-1">
                            Live Scanners &amp; Market Boards
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {LIVE_TOOLS.map((tool) => (
                              <Link
                                key={tool.href}
                                href={tool.href}
                                onClick={() => setToolsOpen(false)}
                                className="group flex items-start gap-2.5 p-2 rounded-xl border border-transparent hover:border-black hover:bg-white transition-all"
                              >
                                <div
                                  className="w-8 h-8 rounded-lg border border-black flex items-center justify-center shrink-0 mt-0.5"
                                  style={{ backgroundColor: `${tool.color}2B` }}
                                >
                                  <tool.icon className="w-4 h-4 text-black" aria-hidden="true" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-display font-bold text-xs text-ink group-hover:text-brand-orange transition-colors truncate">
                                      {tool.name}
                                    </span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#2BD96E] shrink-0" aria-hidden="true" />
                                  </div>
                                  <p className="text-[11px] text-ink-muted leading-snug mt-0.5">{tool.desc}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-3 pt-2.5 border-t border-black/10 flex items-center justify-between">
                          <span className="text-[11px] text-ink-muted font-medium">
                            All tools are 100% free — no account required.
                          </span>
                          <Link
                            href="/tools"
                            onClick={() => setToolsOpen(false)}
                            className="inline-flex items-center gap-1 text-xs font-display font-bold text-black hover:underline"
                          >
                            View all tools <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(`${l.href}/`));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? 'page' : undefined}
                  className={`text-sm transition-all font-semibold px-2.5 py-1 rounded-lg ${
                    active
                      ? 'bg-black text-brand-yellow'
                      : 'text-black/85 hover:text-black hover:bg-black/10'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <button
              onClick={openSearch}
              aria-label="Search articles (press /)"
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/90 border-2 border-black shadow-pop-sm text-black hover:bg-brand-yellow transition-colors text-xs font-semibold"
            >
              <Search className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden lg:inline">Search</span>
              <kbd className="font-mono text-[10px] font-bold px-1 py-0.5 rounded bg-black/10 text-black/80">/</kbd>
            </button>
          </nav>

          {/* Mobile: persistent search + hamburger */}
          <div className="flex items-center gap-1 md:hidden">
            <button onClick={openSearch} aria-label="Search (press /)" className="p-2 text-black/70 hover:text-black transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => (shown ? closeDrawer() : openDrawer())}
              aria-label={shown ? 'Close menu' : 'Open menu'}
              aria-expanded={shown}
              className="p-2 text-black/70 hover:text-black"
            >
              {shown ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Category bar (desktop) — smoothly collapses on scroll to maximize reading space */}
        <div
          aria-hidden={scrolled}
          className={`hidden md:flex items-center gap-1 overflow-x-auto scrollbar-hide transition-all duration-200 ${
            scrolled ? 'max-h-0 opacity-0 pb-0 pointer-events-none' : 'max-h-12 opacity-100 pb-2'
          }`}
        >
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

            {/* Search + primary links + Quick Tools */}
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
                  <span className="flex items-center gap-2">
                    {l.label}
                    {l.hasDropdown && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#C6F23A] text-black border border-black">
                        8 FREE
                      </span>
                    )}
                  </span>
                  <ChevronRight className="w-4 h-4 text-black/30 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}

              {/* Quick Tools Grid for Mobile Readers */}
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 mt-5 mb-2.5">
                Free Tools &amp; Calculators
              </p>
              <div className="grid grid-cols-1 gap-2">
                {[...CALCULATOR_TOOLS, ...LIVE_TOOLS].map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={closeDrawer}
                    className="flex items-center gap-2.5 p-2 rounded-xl border border-black/20 bg-[#FFFDF9] hover:border-black hover:bg-[#FFE642] transition-colors"
                  >
                    <div
                      className="w-7 h-7 rounded-lg border border-black flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${tool.color}33` }}
                    >
                      <tool.icon className="w-3.5 h-3.5 text-black" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block font-display font-bold text-xs text-ink truncate">{tool.name}</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/10 text-black shrink-0">
                      {tool.badge}
                    </span>
                  </Link>
                ))}
              </div>

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
                        style={{ backgroundColor: cat.color, color: getContrastInk(cat.color) }}
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
