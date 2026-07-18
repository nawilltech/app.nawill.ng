import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#CC785C',
          dark: '#8A736B',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
