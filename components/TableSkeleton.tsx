/**
 * Neo-brutalist table skeleton with shimmer. Shown while scanners run
 * their first (cold) fetch — reads as "content is coming" instead of an
 * indefinite spinner. Pure presentational, no hooks.
 */
interface TableSkeletonProps {
  /** CSS grid-template-columns for the desktop row layout */
  template: string;
  label: string;
  caption?: string;
  rows?: number;
}

export function TableSkeleton({ template, label, caption, rows = 7 }: TableSkeletonProps) {
  const cells = template.trim().split(/\s+/).length;
  const bar = (key: string, w: string, h = 'h-3.5') => (
    <div key={key} className={`skel ${h}`} style={{ width: w }} />
  );

  return (
    <div className="bg-white rounded-xl border-2 border-black shadow-pop overflow-hidden" role="status" aria-live="polite" aria-label={label}>
      <div className="bg-black px-4 py-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
        <span className="font-display text-xs uppercase tracking-wider text-white">{label}</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Mobile: simple stacked bars */}
        <div className="sm:hidden space-y-4">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="space-y-2">
              {bar(`m1-${r}`, `${88 - (r % 3) * 8}%`)}
              {bar(`m2-${r}`, `${45 + (r % 3) * 10}%`, 'h-3')}
            </div>
          ))}
        </div>

        {/* Desktop: grid rows mirroring the real table */}
        <div className="hidden sm:grid gap-3" style={{ gridTemplateColumns: template }}>
          {Array.from({ length: rows * cells }).map((_, i) => {
            const col = i % cells;
            const r = Math.floor(i / cells);
            return bar(
              `d-${i}`,
              col === 0 ? `${92 - (r % 3) * 6}%` : `${55 + ((r + col) % 4) * 10}%`,
              r === 0 ? 'h-3' : 'h-3.5'
            );
          })}
        </div>
      </div>

      {caption && <p className="px-4 pb-4 text-xs text-ink-faint">{caption}</p>}
    </div>
  );
}
