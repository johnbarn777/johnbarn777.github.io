/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./*.html', './public/**/*.html', './src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          elevated: 'var(--bg-elevated)',
          subtle: 'var(--bg-subtle)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          dim: 'var(--accent-dim)',
        },
        border: {
          DEFAULT: 'var(--border)',
          hover: 'var(--border-hover)',
        },
        surface: {
          raised: 'var(--surface-raised)',
        },
        success: 'var(--success)',
        warn: 'var(--warn)',
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['Archivo', 'sans-serif'],
      },
      fontSize: {
        xs: 'var(--fs-xs)',
        sm: 'var(--fs-sm)',
        base: 'var(--fs-base)',
        lg: 'var(--fs-lg)',
        xl: 'var(--fs-xl)',
        '2xl': 'var(--fs-2xl)',
        '3xl': 'var(--fs-3xl)',
        '4xl': 'var(--fs-4xl)',
        '5xl': 'var(--fs-5xl)',
        '6xl': 'var(--fs-6xl)',
        hero: 'var(--fs-hero)',
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
      transitionTimingFunction: {
        smooth: 'var(--ease-out)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'drift': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(30px, -20px)' },
        },
        'scroll-hint': {
          '0%, 100%': { opacity: '0.4', transform: 'translateY(0)' },
          '50%': { opacity: '1', transform: 'translateY(8px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s var(--ease-out) forwards',
        'fade-in': 'fade-in 0.6s var(--ease-out) forwards',
        'drift': 'drift 8s ease-in-out infinite',
        'scroll-hint': 'scroll-hint 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
