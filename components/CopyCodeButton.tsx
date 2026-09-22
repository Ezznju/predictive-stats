'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/** Copy-to-clipboard button for embed code snippets. */
export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(code).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border-2 border-black shadow-pop-sm transition-all ${
        copied ? 'bg-neon-green' : 'bg-white hover:bg-brand-yellow hover:-translate-y-0.5'
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy code'}
    </button>
  );
}
