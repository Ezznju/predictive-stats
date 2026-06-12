import { ReactNode, AnchorHTMLAttributes } from 'react';

interface TrackedLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Platform slug from lib/platforms.ts (e.g. 'polymarket') */
  platform: string;
  /** Where on the site the click came from (e.g. 'hub-table', 'review-cta'). Logged for attribution. */
  ctx?: string;
  children: ReactNode;
}

/**
 * Tracked outbound link for monetizable platform links.
 *
 * Routes through /go/[slug], which logs the click server-side and 307-redirects
 * to the affiliate URL (if AFFILIATE_URL_{SLUG} is set) or the plain website.
 * Uses rel="sponsored nofollow noopener" so search engines treat these links
 * correctly once affiliate programs are live.
 */
export function TrackedLink({ platform, ctx, children, ...rest }: TrackedLinkProps) {
  const href = ctx ? `/go/${platform}?ctx=${encodeURIComponent(ctx)}` : `/go/${platform}`;
  return (
    <a href={href} target="_blank" rel="sponsored nofollow noopener" {...rest}>
      {children}
    </a>
  );
}
