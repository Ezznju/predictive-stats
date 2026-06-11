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
          DEFAULT: '#FFFDF7',
          raised: '#FFFFFF',
          overlay: '#FFF8ED',
          border: '#F0E4D1',
          'border-strong': '#E0D0BA',
        },
        ink: {
          DEFAULT: '#1A1207',
          secondary: '#6B5B4D',
          muted: '#9C8E7E',
          faint: '#C4B8AA',
        },
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#3D3229',
            a: { color: '#FF7900', textDecoration: 'underline' },
            h1: { color: '#1A1207' },
            h2: { color: '#1A1207' },
            h3: { color: '#1A1207' },
            h4: { color: '#1A1207' },
            strong: { color: '#1A1207' },
            blockquote: { color: '#6B5B4D', borderLeftColor: '#FFBF00' },
            code: { color: '#FF7900' },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
