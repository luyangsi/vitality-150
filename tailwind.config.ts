import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Light-mode semantic overrides — dark code classes now produce light values
        slate: {
          50:  '#F9FAFB',   // subtle input/nested bg
          100: '#111827',   // primary text (was near-white on dark, now dark on light)
          200: '#1F2937',   // heading text
          300: '#374151',   // body text
          400: '#6B7280',   // secondary text
          500: '#9CA3AF',   // muted / placeholder
          600: '#D1D5DB',   // very muted / decorative
          700: '#E5E7EB',   // borders (gray-200)
          750: '#F3F4F6',   // subtle surface
          800: '#FFFFFF',   // card / primary surface
          850: '#F9FAFB',   // gray-50 surface
          900: '#FFFFFF',   // panel / sidebar bg
          950: '#F3F4F6',   // page background
        },
        vitality: {
          DEFAULT: '#22C55E',
          50:  '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-vitality': 'linear-gradient(135deg, #22C55E, #16A34A)',
      },
      boxShadow: {
        vitality:    '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)',
        'vitality-lg': '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)',
        'vitality-xl': '0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04)',
        card:        '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-md':   '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                                        to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' },          to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
export default config;
