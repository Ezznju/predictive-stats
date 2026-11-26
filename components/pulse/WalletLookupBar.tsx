'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Wallet } from 'lucide-react';

const ETH_ADDR_RE = /0x[a-fA-F0-9]{40}/;

export function WalletLookupBar() {
  const router = useRouter();
  const [raw, setRaw] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const match = raw.trim().match(ETH_ADDR_RE);
    if (!match) {
      setError('Enter a valid 42-character Polymarket wallet address (0x...) or profile URL.');
      return;
    }
    setError('');
    router.push(`/pulse/wallets/${match[0]}`);
  };

  return (
    <div className="bg-[#FFFDF9] border-2 border-black rounded-2xl shadow-pop p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg border-2 border-black bg-[#C6F23A] flex items-center justify-center shrink-0">
          <Wallet className="w-4 h-4 text-black" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display font-bold text-sm sm:text-base text-ink leading-tight">
            Check Any Polymarket Wallet
          </h2>
          <p className="text-xs text-ink-muted">
            Paste a <code className="font-mono text-black bg-black/5 px-1 rounded">0x...</code> address or Polymarket profile link to grade win rate, P&amp;L, and recent whale trades.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 mt-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-black/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              if (error) setError('');
            }}
            placeholder="0x1234...abcd or https://polymarket.com/profile/0x..."
            aria-label="Polymarket wallet address"
            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border-2 border-black font-mono text-xs sm:text-sm text-ink placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#FFE642]"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-black text-[#FFE642] font-display font-bold text-xs sm:text-sm border-2 border-black shadow-pop-sm hover:-translate-y-0.5 transition-all shrink-0"
        >
          Inspect Wallet <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>

      {error && (
        <p role="alert" className="text-xs font-semibold text-red-700 mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
