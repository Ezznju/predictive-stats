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
          amber: '#FFBF00',
          wheat: '#F2CF7E',
          yellow: '#FFE642',
          orange: '#FF7900',
          green: '#2ECC71',
          blue: '#4A6CF7',
          purple: '#7C3AED',
          pink: '#EC4899',
        },
        surface: {
          DEFAULT: '#FF8C00',
          raised: '#FFFFFF',
          overlay: '#FF9F2E',
          border: '#E67300',
          'border-strong': '#CC6600',
        },
        ink: {
          DEFAULT: '#000000',
          secondary: '#1A1A1A',
          muted: '#333333',
          faint: '#666666',
        },
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#000000',
            a: { color: '#1A1A1A', textDecoration: 'underline', fontWeight: '600' },
            h1: { color: '#000000' },
            h2: { color: '#000000' },
            h3: { color: '#000000' },
            h4: { color: '#000000' },
            strong: { color: '#000000' },
            blockquote: { color: '#1A1A1A', borderLeftColor: '#FFBF00' },
            code: { color: '#000000' },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
