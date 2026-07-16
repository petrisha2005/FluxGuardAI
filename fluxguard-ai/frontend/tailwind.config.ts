import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#07111f',
          elevated: '#0d1b2e',
          panel: '#101f35',
          muted: '#17263d',
        },
        ink: {
          DEFAULT: '#f8fafc',
          muted: '#a7b4c8',
          subdued: '#728198',
        },
        brand: {
          primary: '#38bdf8',
          secondary: '#2dd4bf',
          glow: '#7dd3fc',
        },
        risk: {
          safe: '#22c55e',
          warning: '#f59e0b',
          critical: '#ef4444',
          info: '#38bdf8',
        },
      },
      boxShadow: {
        command: '0 24px 80px rgb(0 0 0 / 0.35)',
        glow: '0 0 32px rgb(56 189 248 / 0.18)',
      },
      borderRadius: {
        command: '0.5rem',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
