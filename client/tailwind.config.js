/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void:          '#0f1014',
        surface:       '#1a1c20',
        'surface-2':   '#1a1c24',
        line:          '#ffffff1a',
        'line-bright': '#ffffff26',
        maroon:        '#7A2530',
        'maroon-bright': '#C2434F',
        amber:         '#C99A4A',
        ink:           '#ffffff',
        'ink-dim':     '#a0a0a0',
        'ink-faint':   '#555555',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Anton', 'Impact', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        serif:   ['"Cormorant Garamond"', 'Georgia', 'serif'],
        mono:    ['"IBM Plex Mono"', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        display: '0.04em',
      },
      transitionTimingFunction: {
        spring:  'cubic-bezier(.16,1,.3,1)',
        smooth:  'cubic-bezier(.4,0,.2,1)',
        out:     'cubic-bezier(0,0,.2,1)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '450': '450ms',
      },
      animation: {
        marquee:    'marquee 42s linear infinite',
        drift:      'drift 28s ease-in-out infinite',
        kenBurns:   'kenBurns 28s ease-in-out infinite',
        fadeUp:     'fadeUp 0.55s cubic-bezier(.16,1,.3,1) forwards',
        fadeIn:     'fadeIn 0.4s ease-out forwards',
        fadeUpIn:   'fadeUpIn 0.55s cubic-bezier(.16,1,.3,1) forwards',
        shimmer:    'glShimmer 1.8s ease-in-out infinite',
        activeGlow: 'activeGlow 2.4s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translate3d(0,0,0)' },
          to:   { transform: 'translate3d(-50%,0,0)' },
        },
        drift: {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%':     { transform: 'translate3d(-2%,1.5%,0)' },
        },
        kenBurns: {
          '0%,100%': { transform: 'scale(1.0) translate3d(0,0,0)' },
          '50%':     { transform: 'scale(1.06) translate3d(-1.5%,0.8%,0)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translate3d(0,18px,0)' },
          to:   { opacity: '1', transform: 'translate3d(0,0,0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        fadeUpIn: {
          from: { opacity: '0', transform: 'translate3d(0,16px,0)' },
          to:   { opacity: '1', transform: 'translate3d(0,0,0)' },
        },
        activeGlow: {
          '0%,100%': { opacity: '0.6' },
          '50%':     { opacity: '1' },
        },
      },
      boxShadow: {
        'card-hover': '0 28px 60px -10px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.10)',
        'card-idle':  '0 8px 24px -8px rgba(0,0,0,0.7)',
        'nav':        '0 8px 32px -8px rgba(0,0,0,0.85)',
        'overlay':    '0 24px 80px -16px rgba(0,0,0,0.95)',
        'tooltip':    '0 12px 32px -8px rgba(0,0,0,0.75)',
      },
    },
  },
  plugins: [],
};
