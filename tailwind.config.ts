import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0c',
          900: '#101013',
          850: '#15151a',
          800: '#1b1b21',
          700: '#26262e',
          600: '#35353f',
          500: '#4a4a56',
          400: '#6b6b78',
          300: '#9a9aa6',
          200: '#c9c9d1',
          100: '#e8e8ec',
        },
        gold: {
          300: '#ffd98a',
          400: '#f5c35c',
          500: '#e8a93c',
          600: '#c9871f',
          700: '#9c6714',
        },
        ember: {
          400: '#ff7a45',
          500: '#f25c2a',
          600: '#d14415',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-arabic)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 30px rgba(0,0,0,0.35)',
        glow: '0 0 40px rgba(232,169,60,0.18)',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.55' } },
        bump: { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.18)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        fadeUp: 'fadeUp .5s cubic-bezier(.21,.85,.36,1) both',
        fadeIn: 'fadeIn .4s ease both',
        slideUp: 'slideUp .35s cubic-bezier(.21,.85,.36,1) both',
        pulseSoft: 'pulseSoft 2.2s ease-in-out infinite',
        bump: 'bump .3s ease',
      },
    },
  },
  plugins: [],
};
export default config;
