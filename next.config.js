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


