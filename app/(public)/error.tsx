'use client';

import { useEffect } from 'react';
import Link from 'next/link';

// Shared error boundary for all public pages. Catches render/data failures
// (e.g. a D1 or upstream API hiccup) and shows a friendly retry UI instead
// of Next's default crash page. Never render error.message — it can leak
// backend internals.
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[public segment error]', error?.digest ?? error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
      <div className="bg-white rounded-2xl border-2 border-black shadow-pop p-8">
        <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-neon-cyan border-2 border-black mb-4">
          Temporary hiccup
        </span>
        <h1 className="font-display font-bold text-3xl text-ink">Something went wrong</h1>
        <p className="text-ink-secondary mt-3 leading-relaxed">
          This page failed to load — usually a momentary data issue. Try again,
          and if it persists, come back in a few minutes.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => reset()}
            className="bg-black hover:bg-black/90 text-white px-5 py-2.5 rounded-xl font-display font-semibold text-sm transition-colors shadow-sm"
          >
            Try again
          </button>
          <Link
            href="/"
            className="bg-white border border-black/20 text-ink px-5 py-2.5 rounded-xl font-display font-semibold text-sm hover:border-black/40 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
