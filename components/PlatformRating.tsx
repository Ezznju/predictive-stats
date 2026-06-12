import { Star } from 'lucide-react';
import { PlatformRatings } from '@/lib/platforms';

/** Bold numeric rating badge, e.g. "4.7" with a star. */
export function RatingBadge({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'text-sm px-2 py-0.5 gap-1',
    md: 'text-base px-2.5 py-1 gap-1.5',
    lg: 'text-2xl px-4 py-2 gap-2',
  } as const;
  const starSizes = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-6 h-6' } as const;
  return (
    <span
      className={`inline-flex items-center font-display font-bold bg-neon-lime border-2 border-black rounded-xl shadow-pop-sm text-black ${sizes[size]}`}
      aria-label={`Rated ${rating} out of 5`}
    >
      <Star className={`${starSizes[size]} fill-black`} aria-hidden="true" />
      {rating.toFixed(1)}
    </span>
  );
}

const RATING_LABELS: { key: keyof PlatformRatings; label: string }[] = [
  { key: 'liquidity', label: 'Liquidity' },
  { key: 'fees', label: 'Fees & costs' },
  { key: 'marketVariety', label: 'Market variety' },
  { key: 'ux', label: 'Ease of use' },
  { key: 'trust', label: 'Trust & regulation' },
];

/** Horizontal score bars for the rating breakdown. */
export function RatingBars({ ratings, color = '#4845F0' }: { ratings: PlatformRatings; color?: string }) {
  return (
    <div className="space-y-3">
      {RATING_LABELS.map(({ key, label }) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-ink-secondary">{label}</span>
            <span className="text-sm font-display font-bold text-ink">{ratings[key].toFixed(1)}</span>
          </div>
          <div className="h-2.5 bg-black/10 rounded-full overflow-hidden border border-black/20">
            <div
              className="h-full rounded-full"
              style={{ width: `${(ratings[key] / 5) * 100}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
