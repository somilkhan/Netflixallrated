/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── New design system ── */
        primary:   '#000000',
        secondary: '#000000',
        tertiary:  '#161616',
        /* ── Legacy aliases (keep for existing components) ── */
        void:         '#000000',
        surface:      '#000000',
        'surface-2':  '#161616',
        line:         'rgba(255,255,255,0.08)',
        'line-bright':'rgba(255,255,255,0.15)',
        maroon:       '#7A2530',
        'maroon-bright': '#C2434F',
        amber:        '#C99A4A',
        ink:          '#FFFFFF',
        'ink-dim':    '#A3A3A3',
        'ink-faint':  '#737373',
        // 'ink-ghost':  '#525252', // Removed — Netflix doesn't use this shade
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif:   ['"Cormorant Garamond"', 'Georgia', 'serif'],
        mono:    ['"IBM Plex Mono"', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        display: '-0.02em',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
        out:    'cubic-bezier(0, 0, 0.2, 1)',
      },
      transitionDuration: {
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
      },
      animation: {
        'fade-in':     'fadeIn 0.2s cubic-bezier(0.4,0,0.2,1) both',
        'fade-up':     'fadeUpIn 0.3s cubic-bezier(0.4,0,0.2,1) both',
        'slide-right': 'slideInRight 0.25s cubic-bezier(0.4,0,0.2,1) both',
        shimmer:       'shimmer 1.8s ease-in-out infinite',
        'pulse-soft':  'pulse 2s ease-in-out infinite',
        spin:          'spin 1s linear infinite',
        fadeUp:    'fadeUpIn 0.3s cubic-bezier(0.4,0,0.2,1) forwards',
        /* Legacy */
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        fadeUpIn: {
          from: { opacity: '0', transform: 'translate3d(0,20px,0)' },
          to:   { opacity: '1', transform: 'translate3d(0,0,0)' },
        },
        shimmer: {
          '0%':   { transform: 'translateX(-150%)' },
          '100%': { transform: 'translateX(150%)' },
        },
        pulse: {
          '0%,100%': { opacity: '0.4' },
          '50%':     { opacity: '0.8' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translate3d(24px,0,0)' },
          to:   { opacity: '1', transform: 'translate3d(0,0,0)' },
        },
        fadeUpIn: {
          from: { opacity: '0', transform: 'translate3d(0,20px,0)' },
          to:   { opacity: '1', transform: 'translate3d(0,0,0)' },
        },
        // Netflix spec: minimal keyframes only
      },
      boxShadow: {
        'soft':       '0 8px 32px rgba(0,0,0,0.4)',
        'card':       '0 12px 40px rgba(0,0,0,0.5)',
        'nav':        '0 4px 24px rgba(0,0,0,0.6)',
        'overlay':    '0 8px 32px rgba(0,0,0,0.6)',
        'tooltip':    '0 4px 16px rgba(0,0,0,0.5)',
        /* Legacy */
        'card-hover': '0 12px 40px rgba(0,0,0,0.5)',
        'card-idle':  '0 4px 16px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
};
