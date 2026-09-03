'use client';

import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

/**
 * Slim black bar fixed to the bottom while reading an article: title,
 * live % read, and a back-to-top button. Appears only while the prose is
 * on screen (same visibility window as the TOC sidebar). Toggles the
 * body class "has-minibar" so the global BackToTop button hides itself.
 */
export function ReadingMiniBar({ title }: { title: string }) {
  const [shown, setShown] = useState(false);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const prose = document.querySelector('.prose');
      if (!prose) { setShown(false); return; }
      const r = prose.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const inView = r.top < vh * 0.35 && r.bottom > vh * 0.7;
      setShown(inView);
      document.body.classList.toggle('has-minibar', inView);
      if (inView) {
        const total = r.height - vh * 0.7;
        const passed = Math.min(Math.max(vh * 0.35 - r.top, 0), Math.max(total, 1));
        setPct(Math.max(1, Math.min(100, Math.round((passed / Math.max(total, 1)) * 100))));
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
      document.body.classList.remove('has-minibar');
    };
  }, []);

  return (
    <div
      aria-hidden={!shown}
      className={`fixed bottom-0 inset-x-0 z-40 bg-black text-white border-t-2 border-black transition-transform duration-300 ease-out ${
        shown ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-12 flex items-center gap-3">
        <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse shrink-0" />
        <span className="font-display font-bold text-xs uppercase tracking-wide truncate flex-1 min-w-0">
          {title}
        </span>
        <span className="text-xs font-mono font-bold text-brand-yellow shrink-0 tabular-nums">{pct}% read</span>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className="shrink-0 p-1.5 bg-white text-black rounded-md hover:bg-brand-yellow transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
