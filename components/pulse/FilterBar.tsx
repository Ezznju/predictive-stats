'use client';

import { useState } from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import type { PulseFilters, PulseCategory, PulseSort } from '@/lib/pulse/types';

const CATEGORIES: { value: PulseCategory; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'POLITICS', label: 'Politics' },
  { value: 'CRYPTO', label: 'Crypto' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'ECONOMICS', label: 'Economics' },
  { value: 'TECH', label: 'Tech' },
  { value: 'CULTURE', label: 'Culture' },
];

const SORTS: { value: PulseSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'largest', label: 'Largest' },
  { value: 'most-active', label: 'Most Active' },
  { value: 'highest-conviction', label: 'Highest Conviction' },
];

interface FilterBarProps {
  filters: PulseFilters;
  onChange: (filters: PulseFilters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="space-y-3">
      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onChange({ ...filters, category: cat.value })}
            className={`px-3 py-1.5 text-xs font-bold font-display border-2 border-black rounded-full transition-all ${
              filters.category === cat.value
                ? 'bg-black text-white shadow-pop-sm'
                : 'bg-white text-ink shadow-pop-sm hover:-translate-y-0.5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sort + Search row */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <ArrowUpDown className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <select
            value={filters.sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value as PulseSort })}
            className="pl-8 pr-3 py-1.5 text-xs font-body bg-white border-2 border-black rounded-lg appearance-none cursor-pointer shadow-pop-sm"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-1.5 bg-white border-2 border-black rounded-lg shadow-pop-sm hover:-translate-y-0.5 transition-transform"
        >
          <Search className="w-3.5 h-3.5 text-ink" />
        </button>

        {searchOpen && (
          <input
            type="text"
            placeholder="Search markets or wallets..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="flex-1 px-3 py-1.5 text-xs font-body bg-white border-2 border-black rounded-lg shadow-pop-sm outline-none focus:ring-2 focus:ring-black/20"
            autoFocus
          />
        )}
      </div>
    </div>
  );
}
