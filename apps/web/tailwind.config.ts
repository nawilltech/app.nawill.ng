import type { Config } from 'tailwindcss';

// Sourced from the enhanced brand identity guide supplied for this build (see
// docs/ARCHITECTURE.md §8.8), superseding the earlier nawill.ng-scraped palette. Not
// invented values, except `brand.dark` (a computed hover-darken of brand.DEFAULT —
// the guide shows no explicit hover shade for the primary navy).
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#20264a', // "Ink" — primary navy: CTAs, nav, headings
          dark: '#161a34', // computed hover/active shade of the above
          mid: '#4757b8', // periwinkle accent — interactive links, secondary buttons
          link: '#29335c', // default (non-hover) inline link color from the guide
          light: '#8e9bd8', // lavender — accents/text on dark (navy) backgrounds
          border: '#3a4270', // border color used on navy backgrounds
          50: '#fbf9f2', // lightest tint of Cream — page-section backgrounds
          100: '#f4eedd', // "Cream" — logo-mark tiles, pill/badge backgrounds
        },
        gold: {
          DEFAULT: '#7a7256', // olive/gold accent — labels, secondary emphasis
          light: '#d8cfb4', // beige — borders/dividers on Paper backgrounds
          100: '#e4dcc8', // "Paper" — section background tint
        },
        whatsapp: '#25d366', // WhatsApp's own brand color — intentionally not Nawill's
      },
      fontFamily: {
        sans: ['var(--font-plex-sans)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-plex-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'monospace'],
        display: ['var(--font-special-elite)', 'ui-monospace', 'monospace'], // logotype/wordmark treatment only
      },
    },
  },
  plugins: [],
} satisfies Config;
