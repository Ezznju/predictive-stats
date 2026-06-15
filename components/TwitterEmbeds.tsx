'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

declare global {
  interface Window {
    twttr?: {
      widgets: {
        createTweet: (
          id: string,
          el: HTMLElement,
          options?: Record<string, unknown>,
        ) => Promise<HTMLElement | undefined>;
      };
    };
  }
}

interface Mount {
  el: HTMLElement;
  tweetId: string;
}

/**
 * Finds all [data-tweet-id] placeholders left by the server-side
 * `embedTweet()` transform and renders them as live Twitter/X embeds.
 *
 * Authors write `[tweet:URL]` in the editor.
 */
export function TwitterEmbeds() {
  const [mounts, setMounts] = useState<Mount[]>([]);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    const found: Mount[] = [];
    document
      .querySelectorAll<HTMLElement>('[data-tweet-id]')
      .forEach((el) => {
        const id = el.getAttribute('data-tweet-id');
        if (id) found.push({ el, tweetId: id });
      });
    if (found.length === 0) return;
    setMounts(found);

    // Load Twitter widget.js once
    const load = () => {
      if (scriptLoaded.current) return;
      scriptLoaded.current = true;
      const s = document.createElement('script');
      s.src = 'https://platform.twitter.com/widgets.js';
      s.async = true;
      s.charset = 'utf-8';
      document.head.appendChild(s);
    };
    if (!window.twttr) load();
  }, []);

  return (
    <>
      {mounts.map((m, i) =>
        createPortal(<TweetCard tweetId={m.tweetId} key={i} />, m.el, `tw-${i}`),
      )}
    </>
  );
}

function TweetCard({ tweetId }: { tweetId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const render = () => {
      if (!ref.current || !window.twttr) return false;
      window.twttr.widgets
        .createTweet(tweetId, ref.current, {
          align: 'center',
          dnt: true,
          theme: 'light',
        })
        .then((el) => {
          if (cancelled) return;
          if (!el) setError(true);
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) {
            setError(true);
            setLoading(false);
          }
        });
      return true;
    };

    // twttr may not be ready yet — poll briefly
    if (!render()) {
      const t = setInterval(() => {
        if (render() || cancelled) clearInterval(t);
      }, 300);
      const timeout = setTimeout(() => {
        clearInterval(t);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }, 10_000);
      return () => {
        cancelled = true;
        clearInterval(t);
        clearTimeout(timeout);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [tweetId]);

  return (
    <div className="my-6 flex justify-center">
      {loading && !error && (
        <div className="w-full max-w-[550px] rounded-xl border-2 border-black bg-white p-6 text-center text-sm text-ink-muted animate-pulse">
          Loading tweet…
        </div>
      )}
      {error && (
        <a
          href={`https://x.com/i/status/${tweetId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full max-w-[550px] rounded-xl border-2 border-black bg-white p-6 text-center text-sm text-ink-secondary hover:underline"
        >
          View this post on X ↗
        </a>
      )}
      <div ref={ref} />
    </div>
  );
}
