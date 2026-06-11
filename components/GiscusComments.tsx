'use client';

import { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';

interface GiscusCommentsProps {
  slug: string;
}

// Giscus configuration. The repo id is the GraphQL node id of the GitHub repo.
// The category id must be set once GitHub Discussions is enabled and the
// giscus app (github.com/apps/giscus) is installed on the repo. Until then the
// comments section is hidden instead of rendering a broken widget.
const GISCUS_REPO = process.env.NEXT_PUBLIC_GISCUS_REPO || 'Ezznju/predictive-stats';
const GISCUS_REPO_ID = process.env.NEXT_PUBLIC_GISCUS_REPO_ID || 'R_kgDOS31QyQ';
const GISCUS_CATEGORY = process.env.NEXT_PUBLIC_GISCUS_CATEGORY || 'Announcements';
const GISCUS_CATEGORY_ID = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || '';

export function GiscusComments({ slug }: GiscusCommentsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!GISCUS_CATEGORY_ID) return;
    if (loaded.current || !ref.current) return;
    loaded.current = true;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', GISCUS_REPO);
    script.setAttribute('data-repo-id', GISCUS_REPO_ID);
    script.setAttribute('data-category', GISCUS_CATEGORY);
    script.setAttribute('data-category-id', GISCUS_CATEGORY_ID);
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

  // Hide the comments section entirely until giscus is fully configured —
  // an empty category id would render a broken error widget.
  if (!GISCUS_CATEGORY_ID) return null;

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
