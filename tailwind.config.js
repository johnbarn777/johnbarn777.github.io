import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./*.html', './public/**/*.html', './src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: 'var(--ink-900)',
        },
        brand: {
          1: 'var(--brand-1)',
          2: 'var(--brand-2)',
          3: 'var(--brand-3)',
          4: 'var(--brand-4)',
        },
        success: {
          500: 'var(--success-500)',
        },
        warn: {
          500: 'var(--warn-500)',
        },
        neutral: {
          50: 'var(--neutral-50)',
          100: 'var(--neutral-100)',
          200: 'var(--neutral-200)',
          300: 'var(--neutral-300)',
          400: 'var(--neutral-400)',
          500: 'var(--neutral-500)',
          600: 'var(--neutral-600)',
          700: 'var(--neutral-700)',
          800: 'var(--neutral-800)',
          900: 'var(--neutral-900)',
        },
      },
      fontSize: {
        11: 'var(--fs-11)',
        13: 'var(--fs-13)',
        16: 'var(--fs-16)',
        20: 'var(--fs-20)',
        24: 'var(--fs-24)',
        32: 'var(--fs-32)',
        48: 'var(--fs-48)',
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        7: 'var(--space-7)',
        8: 'var(--space-8)',
        9: 'var(--space-9)',
        10: 'var(--space-10)',
      },
    },
  },
  plugins: [daisyui],
};

export default config;

