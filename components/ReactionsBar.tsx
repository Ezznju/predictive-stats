'use client';

import { useEffect, useState } from 'react';

const REACTIONS = [
  { k: 'fire', e: '🔥', label: 'Sharp' },
  { k: 'smart', e: '🧠', label: 'Smart' },
  { k: 'accurate', e: '💯', label: 'Accurate' },
  { k: 'watching', e: '👀', label: 'Watching' },
  { k: 'bullish', e: '🚀', label: 'Bullish' },
];

function fmtCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

/**
 * Lightweight article reactions: one tap per emoji per visitor, no signup.
 * Counts live in D1 (article_reactions); the visitor's own picks are kept
 * in localStorage so taps can't be double-counted client-side. Server also
 * rate-limits per IP.
 */
export function ReactionsBar({ slug }: { slug: string }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    try {
      setMine(JSON.parse(localStorage.getItem(`pmf-react-${slug}`) ?? '[]'));
    } catch {
      /* ignore */
    }
    fetch(`/api/reactions?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => setCounts(d.counts ?? {}))
      .catch(() => {});
  }, [slug]);

  const react = async (k: string) => {
    if (mine.includes(k) || busy) return;
    setBusy(k);
    setCounts((c) => ({ ...c, [k]: (c[k] ?? 0) + 1 })); // optimistic
    try {
      const r = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, reaction: k }),
      });
      const d = await r.json();
      if (d.counts) setCounts(d.counts);
      const next = [...mine, k];
      localStorage.setItem(`pmf-react-${slug}`, JSON.stringify(next));
      setMine(next);
    } catch {
      /* keep optimistic value; refetch on next visit */
    }
    setBusy(null);
  };

  return (
    <div className="mt-8 pt-6 border-t border-black/10">
      <p className="text-[11px] font-bold uppercase tracking-widest text-ink-faint mb-3">
        Rate this piece — one tap, no signup
      </p>
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map((r) => {
          const mineHas = mine.includes(r.k);
          return (
            <button
              key={r.k}
              onClick={() => react(r.k)}
              disabled={mineHas}
              aria-label={`${r.label} reaction`}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border-2 border-black text-sm font-semibold transition-all ${
                mineHas
                  ? 'bg-brand-yellow shadow-pop-sm cursor-default'
                  : 'bg-white hover:-translate-y-0.5 hover:shadow-pop-sm'
              }`}
            >
              <span className="text-base leading-none">{r.e}</span>
              <span className="hidden sm:inline">{r.label}</span>
              {counts[r.k] > 0 && (
                <span className="font-mono text-xs font-bold text-ink-muted">{fmtCount(counts[r.k])}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
