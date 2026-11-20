'use client';

import { useState } from 'react';
import { Twitter, Linkedin, Send, MessageCircle, Link2, Check } from 'lucide-react';
import { stripHtml } from '@/lib/seo-utils';

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const cleanTitle = stripHtml(title);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-ink-muted mr-1">Share</span>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(cleanTitle)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X (Twitter)"
        className="p-2 bg-black/5 rounded-lg text-ink-secondary hover:text-black hover:bg-black/10 transition-all"
      >
        <Twitter className="w-4 h-4" aria-hidden="true" />
      </a>
      <a
        href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(cleanTitle)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="p-2 bg-black/5 rounded-lg text-ink-secondary hover:text-black hover:bg-black/10 transition-all"
      >
        <Linkedin className="w-4 h-4" aria-hidden="true" />
      </a>
      <a
        href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(cleanTitle)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 bg-black/5 rounded-lg text-ink-secondary hover:text-black hover:bg-black/10 transition-all"
        aria-label="Share on Telegram"
      >
        <Send className="w-4 h-4" aria-hidden="true" />
      </a>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${cleanTitle} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 bg-black/5 rounded-lg text-ink-secondary hover:text-black hover:bg-black/10 transition-all"
        aria-label="Share on WhatsApp"
      >
        <MessageCircle className="w-4 h-4" aria-hidden="true" />
      </a>
      <button
        onClick={handleCopy}
        className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#29C5F6] text-black font-mono font-bold text-xs tracking-widest uppercase border-2 border-black shadow-[3px_3px_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#000] transition-all"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            COPIED ✓
          </>
        ) : (
          <>
            <Link2 className="w-3.5 h-3.5" />
            COPY LINK
          </>
        )}
      </button>
    </div>
  );
}
