import { Info } from 'lucide-react';

interface AffiliateDisclosureProps {
  /** 'banner' = full box for page tops; 'compact' = one-liner for cards/sections */
  variant?: 'banner' | 'compact';
  className?: string;
}

/**
 * FTC-style affiliate disclosure. Drop the banner variant at the top of any
 * page containing affiliate links, and the compact variant near CTA buttons.
 */
export function AffiliateDisclosure({ variant = 'banner', className = '' }: AffiliateDisclosureProps) {
  if (variant === 'compact') {
    return (
      <p className={`text-xs text-ink-faint ${className}`}>
        Some links on this page may be referral links — see our{' '}
        <a href="/disclosure" className="underline hover:text-ink">
          disclosure
        </a>
        .
      </p>
    );
  }

  return (
    <div
      className={`flex items-start gap-3 p-4 bg-white rounded-2xl border-2 border-black shadow-pop-sm ${className}`}
      role="note"
      aria-label="Affiliate disclosure"
    >
      <Info className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-sm text-ink-secondary leading-relaxed">
        <strong className="text-ink">Affiliate disclosure:</strong> some outbound links on this page may be
        referral links. If you sign up through them, we may earn a commission at no extra cost to you. This
        never influences our ratings or reviews, which are based on independent testing.{' '}
        <a href="/disclosure" className="underline font-semibold hover:text-ink">
          Read our full disclosure
        </a>
        .
      </p>
    </div>
  );
}
