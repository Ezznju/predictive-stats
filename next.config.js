/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  experimental: {
    // Ensure the OG-image fonts in /assets are bundled with serverless functions
    outputFileTracingIncludes: {
      '/**': ['./assets/**'],
    },
  },
};

module.exports = nextConfig;
