'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  num: number;
}

interface TableOfContentsProps {
  /** 'sidebar' renders the sticky desktop rail; 'inline' renders the collapsible mobile/tablet card */
  variant?: 'sidebar' | 'inline';
  /** Total estimated reading time in minutes (for live remaining time inside the sidebar TOC) */
  readTime?: number;
}

const DOT_COLORS = ['#FF00B8', '#29C5F6', '#FFE642', '#2BD96E', '#FF7900'];

export function TableOfContents({ variant = 'inline', readTime }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState('');
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const prose = document.querySelector('.prose');
    if (!prose) return;

    const headings = prose.querySelectorAll('h2');
    const tocItems: TocItem[] = [];
    const usedIds = new Set<string>();

    headings.forEach((h, i) => {
      // Exclude injected "#" anchor button text if already present
      const clone = h.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.heading-anchor').forEach((el) => el.remove());
      const text = (clone.textContent || '').trim();

      let id = h.id;
      if (!id) {
        const slug = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 60);
        const base = slug || `section-${i + 1}`;
        id = base;
        let n = 2;
        while (usedIds.has(id) || document.getElementById(id)) {
          id = `${base}-${n++}`;
        }
        h.id = id;
      }
      usedIds.add(id);

      tocItems.push({
        id,
        text,
        num: i + 1,
      });
    });

    setItems(tocItems);
  }, []);

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-18% 0px -65% 0px', threshold: 0 }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  // Quiet progress & remaining reading time for the desktop sidebar card
  useEffect(() => {
    if (variant !== 'sidebar' || items.length === 0) return;
    const prose = document.querySelector('.prose');
    if (!prose) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const r = prose.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const total = Math.max(r.height - vh * 0.55, 1);
      const passed = Math.min(Math.max(vh * 0.25 - r.top, 0), total);
      setProgress(Math.round((passed / total) * 100));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [variant, items]);

  if (items.length < 3) return null;

  const minsLeft =
    readTime && readTime > 0
      ? Math.max(0, Math.ceil(readTime * (1 - progress / 100)))
      : null;

  if (variant === 'sidebar') {
    return (
      <nav aria-label="Table of contents" className="sticky top-20 print:hidden">
        <div className="bg-[#FFF7E6] border-2 border-black rounded-2xl shadow-pop p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="font-mono font-bold text-[10px] tracking-[0.16em] uppercase text-[#0b1120] bg-[#FFE642] border-2 border-black px-2 py-0.5 rounded">
              In This Piece
            </span>
            {minsLeft !== null && (
              <span className="font-mono text-[10.5px] font-semibold text-ink-muted tabular-nums">
                {progress >= 96 ? 'Done ✓' : `~${minsLeft} min left`}
              </span>
            )}
          </div>

          {/* Quiet progress hairline inside the TOC card */}
          <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden mb-3.5 border border-black/15">
            <div
              className="h-full bg-gradient-to-r from-[#FF00B8] via-[#FF7900] to-[#FFE642] transition-[width] duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <ol className="space-y-1 list-none pl-0 m-0 max-h-[64vh] overflow-y-auto pr-1">
            {items.map((item, i) => {
              const active = activeId === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`group flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] leading-snug transition-all border-l-[3px] ${
                      active
                        ? 'border-l-[#FF00B8] bg-white font-bold text-[#0b1120] shadow-sm'
                        : 'border-l-transparent text-[#2B2418] hover:bg-white/70 hover:text-black font-medium'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full border border-black shrink-0 mt-1.5"
                      style={{ backgroundColor: DOT_COLORS[i % DOT_COLORS.length] }}
                    />
                    <span className="min-w-0 line-clamp-2">
                      <span className="font-mono text-[10.5px] font-bold text-black/60 mr-1.5">
                        {String(item.num).padStart(2, '0')}
                      </span>
                      {item.text}
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Table of contents"
      className="my-6 p-4 sm:p-5 rounded-2xl bg-[#FFF7E6] border-2 border-black shadow-[4px_4px_0_#000] max-w-[66ch] mx-auto print:hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center gap-3 w-full text-left"
      >
        <span className="inline-block w-3.5 h-6 bg-[#FFE642] border-2 border-black shadow-[2px_2px_0_#000] rounded-md shrink-0" />
        <span className="font-display font-bold text-base sm:text-lg text-black">
          In This Piece
        </span>
        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-black/25 text-ink-muted">
          {items.length} sections
        </span>
        <span className="ml-auto text-xs font-bold text-black/75">
          {open ? '▲ Hide' : '▼ Show'}
        </span>
      </button>
      {open && (
        <ol className="mt-4 space-y-1.5 list-none pl-0">
          {items.map((item, i) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`group flex items-start gap-2.5 text-sm rounded-lg px-2.5 py-2 transition-all duration-150 ${
                  activeId === item.id
                    ? 'bg-black text-[#FFE642] font-bold border-2 border-black shadow-[2px_2px_0_#000]'
                    : 'text-black font-medium hover:bg-white hover:border-2 hover:border-black hover:shadow-[2px_2px_0_#000]'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border-2 border-black shrink-0 mt-1"
                  style={{ backgroundColor: DOT_COLORS[i % DOT_COLORS.length] }}
                />
                <span className="leading-snug">
                  <span className="font-mono text-xs font-bold mr-1.5 opacity-75">
                    {String(item.num).padStart(2, '0')}
                  </span>
                  {item.text}
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
