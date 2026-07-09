import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#f8fafc',
        ink: '#111827',
        risk: {
          low: '#15803d',
          medium: '#b45309',
          high: '#b91c1c',
          critical: '#7f1d1d',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
