'use client';

import { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';

interface GiscusCommentsProps {
  slug: string;
}

export function GiscusComments({ slug }: GiscusCommentsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !ref.current) return;
    loaded.current = true;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'Ezznju/predictive-stats');
    script.setAttribute('data-repo-id', '');
    script.setAttribute('data-category', 'Article Comments');
    script.setAttribute('data-category-id', '');
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', 'light');
    script.setAttribute('data-lang', 'en');
    script.setAttribute('data-loading', 'lazy');
    script.crossOrigin = 'anonymous';
    script.async = true;

    ref.current.appendChild(script);
  }, [slug]);

  return (
    <div className="mt-10 pt-8 border-t border-white/20">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-black" />
        <h2 className="font-display font-bold text-xl text-ink">Comments</h2>
      </div>
      <div ref={ref} />
      <noscript>
        <p className="text-sm text-ink-muted">
          Enable JavaScript to view comments powered by{' '}
          <a href="https://giscus.app" className="underline">giscus</a>.
        </p>
      </noscript>
    </div>
  );
}
