import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // ─── Color System ────────────────────────────────────────────────────────
      colors: {
        // Semantic aliases used across components
        background: '#04040D',
        primary: { DEFAULT: '#5B8DEF', light: '#8FB5FF' },

        // Background layers
        'bg-deep':     '#04040D',
        'bg-base':     '#07071A',
        'bg-elevated': '#0C0C24',

        // Frost accent (primary brand)
        frost: {
          100: '#E8F0FF',
          200: '#C5D8FF',
          300: '#8FB5FF',
          400: '#5B8DEF', // primary interactive
          500: '#3A6FD8',
          600: '#1F4FB5',
        },

        // Ice accent (secondary)
        ice: {
          300: '#A8F0E8',
          400: '#00E5C0', // secondary interactive
          500: '#00BFA0',
        },

        // Severity / alert colors
        critical: '#FF4D6A',
        high:     '#FF8C42',
        medium:   '#F0C040',
        low:      '#00E5C0',
        safe:     '#4DFFA8',
      },

      // ─── Typography ──────────────────────────────────────────────────────────
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        syne:  ['Syne', 'system-ui', 'sans-serif'],
        mono:  ['DM Mono', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        'xs':   ['11px', { letterSpacing: '0.08em' }],
        'sm':   ['13px', { lineHeight: '1.5' }],
        'base': ['15px', { lineHeight: '1.6' }],
        'lg':   ['17px', { lineHeight: '1.5' }],
        'xl':   ['20px', { lineHeight: '1.4' }],
        '2xl':  ['26px', { lineHeight: '1.3' }],
        '3xl':  ['34px', { lineHeight: '1.2' }],
        '4xl':  ['44px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        '5xl':  ['58px', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'hero': ['clamp(52px, 8vw, 96px)', { lineHeight: '1.0', letterSpacing: '-0.03em' }],
      },

      // ─── Border Radius ───────────────────────────────────────────────────────
      borderRadius: {
        'glass': '20px',
        'glass-sm': '12px',
        'glass-lg': '28px',
        'glass-xl': '36px',
      },

      // ─── Box Shadow ──────────────────────────────────────────────────────────
      boxShadow: {
        // Standard glass
        'glass': [
          '0 0 0 1px rgba(255,255,255,0.04) inset',
          '0 8px 32px rgba(0,0,0,0.4)',
          '0 1px 0 rgba(255,255,255,0.08) inset',
        ].join(', '),

        // Elevated glass (hover state)
        'glass-elevated': [
          '0 0 0 1px rgba(255,255,255,0.06) inset',
          '0 16px 48px rgba(0,0,0,0.5)',
          '0 1px 0 rgba(255,255,255,0.12) inset',
          '0 0 80px rgba(91,141,239,0.08)',
        ].join(', '),

        // Frost accent glass
        'frost-glow': [
          '0 0 40px rgba(91,141,239,0.12)',
          '0 1px 0 rgba(255,255,255,0.10) inset',
        ].join(', '),

        // Primary button
        'btn-primary': [
          '0 0 20px rgba(91,141,239,0.3)',
          '0 1px 0 rgba(255,255,255,0.15) inset',
        ].join(', '),

        // Input focus ring
        'input-focus': [
          '0 0 0 3px rgba(91,141,239,0.12)',
          '0 0 20px rgba(91,141,239,0.08)',
        ].join(', '),
      },

      // ─── Backdrop Blur ───────────────────────────────────────────────────────
      backdropBlur: {
        'glass':    '24px',
        'glass-lg': '32px',
        'glass-sm': '10px',
      },

      // ─── Background Image ────────────────────────────────────────────────────
      backgroundImage: {
        'btn-primary': 'linear-gradient(135deg, rgba(91,141,239,0.9), rgba(58,111,216,0.9))',
        'gradient-frost': 'linear-gradient(135deg, #5B8DEF, #00E5C0)',
        'gradient-deep': 'linear-gradient(180deg, #04040D 0%, #07071A 100%)',
        'inner-glow': 'radial-gradient(ellipse at top, rgba(91,141,239,0.06) 0%, transparent 60%)',
        'score-fill': 'linear-gradient(90deg, #5B8DEF, #00E5C0)',
      },

      // ─── Animation ───────────────────────────────────────────────────────────
      animation: {
        'orb-float-1':   'orbFloat1 60s ease-in-out infinite',
        'orb-float-2':   'orbFloat2 80s ease-in-out infinite',
        'pulse-dot':     'pulseDot 2s ease-in-out infinite',
        'spin-slow':     'spin 1.2s linear infinite',
        'fade-in':       'fadeIn 0.4s ease-out forwards',
        'slide-up':      'slideUp 0.4s ease-out forwards',
        'shimmer':       'shimmer 2s linear infinite',
      },

      keyframes: {
        orbFloat1: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%':       { transform: 'translate(30px, -50px) scale(1.05)' },
          '66%':       { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        orbFloat2: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%':       { transform: 'translate(-40px, 60px) scale(1.08)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':       { opacity: '0.4', transform: 'scale(0.75)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },

      // ─── Transition ──────────────────────────────────────────────────────────
      transitionTimingFunction: {
        'glass': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [],
};

export default config;
