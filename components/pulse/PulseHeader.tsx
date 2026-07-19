import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface PulseHeaderProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function PulseHeader({
  title = 'Prediction Pulse',
  subtitle = 'Real-time whale intelligence across prediction markets',
  breadcrumbs,
}: PulseHeaderProps) {
  return (
    <div className="mb-8">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-ink-faint mb-3">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="w-3 h-3" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-black transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-ink font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="heading-chip bg-neon-lime w-4 h-7 border-2 border-black shadow-pop-sm rounded-md" />
        <h1 className="font-display font-bold text-3xl text-ink">{title}</h1>
      </div>
      {subtitle && (
        <p className="text-sm text-ink-secondary mt-2 ml-7">{subtitle}</p>
      )}
    </div>
  );
}
