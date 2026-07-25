/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    loader: 'custom',
    loaderFile: './lib/cloudinary-loader.js',
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
    // Dynamic redirects for /articles/{slug} -> /{category}/{slug}
    // These are handled by middleware or can be done at runtime
    return [];
  },
};

module.exports = nextConfig;
