'use client';

import { useState } from 'react';
import { Link2, Check } from 'lucide-react';

/**
 * Tiny copy-to-clipboard icon button for table rows (trending boards).
 */
export function CopyLinkButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={async (e) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border-2 border-black transition-all ${
        copied ? 'bg-neon-green' : 'bg-white hover:bg-brand-yellow hover:-translate-y-0.5 hover:shadow-pop-sm'
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
    </button>
  );
}
