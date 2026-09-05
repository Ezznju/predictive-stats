'use client';

import { useState } from 'react';
import { Twitter, Linkedin, Send, MessageCircle, Link2, Check } from 'lucide-react';

interface ToolShareBarProps {
  url: string;
  title: string;
}

/**
 * Share row for tool pages: X, LinkedIn, Telegram, WhatsApp + copy link,
 * with pre-written promo copy per tool. White chips on the orange surface,
 * matching the tool-page design language.
 */
export function ToolShareBar({ url, title }: ToolShareBarProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const btn =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-white shadow-pop-sm text-xs font-bold text-ink hover:-translate-y-0.5 hover:shadow-pop transition-all';

  return (
    <div className="flex flex-wrap items-center gap-2 mt-6">
      <span className="text-[11px] font-bold uppercase tracking-widest text-black/50 mr-1">
        Share this tool
      </span>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label="Share on X"
      >
        <Twitter className="w-3.5 h-3.5" /> X
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="w-3.5 h-3.5" /> LinkedIn
      </a>
      <a
        href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label="Share on Telegram"
      >
        <Send className="w-3.5 h-3.5" /> Telegram
      </a>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label="Share on WhatsApp"
      >
        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
      </a>
      <button onClick={copy} className={`${btn} ${copied ? 'bg-neon-green' : ''}`} aria-label="Copy tool link">
        {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  );
}
