import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#0a0f1e',
          900: '#0f172a',
          850: '#131d30',
          800: '#1e293b',
          750: '#243045',
          700: '#334155',
        },
        vitality: {
          DEFAULT: '#00d4aa',
          50:  '#e6fff9',
          100: '#b3ffed',
          200: '#66ffdc',
          300: '#00ffcc',
          400: '#00e6b8',
          500: '#00d4aa',
          600: '#00aa88',
          700: '#008066',
          800: '#005544',
          900: '#002b22',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-vitality': 'linear-gradient(135deg, #00d4aa, #0ea5e9)',
      },
      boxShadow: {
        vitality: '0 0 20px rgba(0,212,170,0.15)',
        'vitality-lg': '0 0 40px rgba(0,212,170,0.25)',
        'vitality-xl': '0 0 60px rgba(0,212,170,0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
export default config;
