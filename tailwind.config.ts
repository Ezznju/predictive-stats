import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#FF2D2D',
          yellow: '#FFD60A',
          green: '#00E676',
          cyan: '#00D4FF',
          orange: '#FF6B35',
          purple: '#A855F7',
        },
        surface: {
          DEFAULT: '#0A0A0F',
          raised: '#12121A',
          overlay: '#1A1A25',
          border: '#2A2A3A',
        },
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#e2e8f0',
            a: { color: '#FF2D2D', textDecoration: 'underline' },
            h1: { color: '#ffffff' },
            h2: { color: '#ffffff' },
            h3: { color: '#ffffff' },
            h4: { color: '#ffffff' },
            strong: { color: '#ffffff' },
            blockquote: { color: '#94a3b8', borderLeftColor: '#FF2D2D' },
            code: { color: '#FFD60A' },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
