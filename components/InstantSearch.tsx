'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search as SearchIcon, X } from 'lucide-react';

interface Hit {
  id?: string;
  title: string;
  slug: string;
  category_slug?: string;
  categorySlug?: string;
  read_time?: number;
  readTime?: number;
}

/**
 * Instant search overlay: opens on / or Ctrl+K or the navbar button
 * (custom event "pmf:open-search"), shows results as you type via
 * /api/search, navigates on Enter/click. Replaces the old
 * navigate-to-/search flow; /search still exists for ?q= deep links.
 */
export function InstantSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const reqId = useRef(0);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    document.body.style.overflow = '';
  }, []);

  const openNow = useCallback(() => {
    setOpen(true);
    document.body.style.overflow = 'hidden';
    setQ('');
    setHits([]);
    setSel(0);
    setTimeout(() => inputRef.current?.focus(), 30);
  }, []);

  // Global hotkeys + navbar trigger
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const tag = (el?.tagName ?? '').toUpperCase();
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable;
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        openNow();
      } else if (e.key === 'Escape') {
        close();
      }
    };
    const onEvt = () => openNow();
    window.addEventListener('keydown', onKey);
    window.addEventListener('pmf:open-search', onEvt);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pmf:open-search', onEvt);
    };
  }, [openNow, close]);

  // Debounced live search
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const rows = await res.json();
        if (id !== reqId.current) return;
        setHits(Array.isArray(rows) ? rows.slice(0, 8) : []);
        setSel(0);
      } catch {
        if (id === reqId.current) setHits([]);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const go = useCallback((h: Hit) => {
    const cat = h.category_slug ?? h.categorySlug ?? 'articles';
    close();
    router.push(`/${cat}/${h.slug}`);
  }, [close, router]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-sm flex items-start justify-center px-4 pt-[10vh]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div className="w-full max-w-xl bg-white border-2 border-black rounded-2xl shadow-[8px_8px_0_#000] overflow-hidden">
        {/* Input row */}
        <div className="flex items-center gap-3 bg-brand-yellow border-b-2 border-black px-4">
          <SearchIcon className="w-5 h-5 text-black shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, hits.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
              else if (e.key === 'Enter' && hits[sel]) go(hits[sel]);
            }}
            placeholder="Search articles…"
            className="flex-1 bg-transparent border-none outline-none py-4 font-display font-semibold text-base text-black placeholder:text-black/40"
            aria-label="Search articles"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-black/50 shrink-0" />}
          <button onClick={close} aria-label="Close search" className="p-1.5 text-black/50 hover:text-black transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[46vh] overflow-y-auto">
          {q.trim().length < 2 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-faint font-medium">
              Type at least 2 characters — searching all articles, live.
            </p>
          ) : hits.length === 0 && !loading ? (
            <p className="px-5 py-8 text-center text-sm text-ink-faint font-medium">
              No matches for &ldquo;{q.trim()}&rdquo;.
            </p>
          ) : (
            hits.map((h, i) => (
              <button
                key={h.id ?? h.slug}
                onClick={() => go(h)}
                onMouseEnter={() => setSel(i)}
                className={`w-full text-left px-5 py-3 border-b border-black/5 last:border-b-0 flex items-start gap-3 transition-colors ${
                  i === sel ? 'bg-neon-lime' : ''
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-black mt-2 shrink-0" />
                <span className="min-w-0">
                  <span className="block font-display font-bold text-sm leading-snug text-black line-clamp-2">
                    {h.title?.replace(/<[^>]*>/g, '')}
                  </span>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-black/50 mt-0.5">
                    {(h.category_slug ?? h.categorySlug ?? '').replace(/-/g, ' ')} · {h.read_time ?? h.readTime ?? 5} min
                  </span>
                </span>
              </button>
            ))
          )}
        </div>

        {/* Legend */}
        <div className="bg-black text-white px-4 py-2 flex items-center gap-4 text-[11px] font-semibold">
          <span><b className="bg-white text-black rounded px-1.5 py-0.5 mr-1">↑↓</b>navigate</span>
          <span><b className="bg-white text-black rounded px-1.5 py-0.5 mr-1">↵</b>open</span>
          <span><b className="bg-white text-black rounded px-1.5 py-0.5 mr-1">esc</b>close</span>
        </div>
      </div>
    </div>
  );
}
