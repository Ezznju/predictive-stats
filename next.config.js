/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
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
      // Article renamed (slug + category) — Google still has the old URL indexed.
      {
        source: '/political-markets/polymarket-lp-rewards-explained-:path*',
        destination: '/prediction-markets/polymarket-lp-rewards-guide',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
