'use client';

import { useState } from 'react';
import { Twitter, Linkedin, Link2, Check } from 'lucide-react';

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 mt-6 pb-8 border-b border-white/20">
      <span className="text-sm text-ink-muted font-medium">Share:</span>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 bg-white/15 rounded-lg text-ink-secondary hover:text-black hover:bg-surface-border transition-all"
      >
        <Twitter className="w-4 h-4" />
      </a>
      <a
        href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 bg-white/15 rounded-lg text-ink-secondary hover:text-black hover:bg-surface-border transition-all"
      >
        <Linkedin className="w-4 h-4" />
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
