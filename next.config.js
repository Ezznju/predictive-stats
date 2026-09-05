/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: '*.cloudflarestorage.com' },
      { protocol: 'https', hostname: 'media.predictionsmarketfans.com' },
    ],
  },
  experimental: {
    // Ensure the OG-image fonts in /assets are bundled with serverless functions
    outputFileTracingIncludes: {
      '/**': ['./assets/**'],
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Clickjacking protection (esp. the admin panel)
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Force HTTPS once a browser has seen the site
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          // Don't leak full URLs to third parties via Referer
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // No browser features needed (mic/camera/etc)
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          // Baseline CSP: keeps object/base-uri locked while allowing the
          // inline + third-party scripts the site genuinely needs (AdSense,
          // Clarity, Next hydration). Report-Only so nothing can break.
          {
            key: 'Content-Security-Policy-Report-Only',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' https: data: blob:; font-src 'self' https: data:; connect-src 'self' https:; frame-src https:; object-src 'none'; base-uri 'self'",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Article renamed (slug + category) â€” Google still has the old URL indexed.
      {
        source: '/political-markets/polymarket-lp-rewards-explained-:path*',
        destination: '/prediction-markets/polymarket-lp-rewards-guide',
        permanent: true,
      },
      // Slug renamed by user in admin: understanding-liquidity-in-prediction-markets-why-it-matters -> kalshi-polymarket
      {
        source: '/economic-analysis/understanding-liquidity-in-prediction-markets-why-it-matters',
        destination: '/economic-analysis/understanding-liquidity-in-kalshi-polymarket',
        permanent: true,
      },
      // Combos content consolidation: duplicate step-by-step articles 301 into
      // the main guide (it held 11k impressions vs 1.2k + 133 for the copies).
      {
        source: '/articles/how-kalshi-combos-actually-work-step-by-step',
        destination: '/platform-reviews/how-do-kalshi-combos-work-the-complete-guide-to-kalshi-combo-bets-parlays-rules-',
        permanent: true,
      },
      {
        source: '/research/how-kalshi-combos-actually-work-step-by-step',
        destination: '/platform-reviews/how-do-kalshi-combos-work-the-complete-guide-to-kalshi-combo-bets-parlays-rules-',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;


