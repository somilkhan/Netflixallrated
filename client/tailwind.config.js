/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#0B0908',
        surface: '#161011',
        'surface-2': '#1D1516',
        line: '#2A1F1F',
        'line-bright': '#43302F',
        maroon: '#7A2530',
        'maroon-bright': '#C2434F',
        amber: '#C99A4A',
        ink: '#F5F0EC',
        'ink-dim': '#A69B97',
        'ink-faint': '#5F5551',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['"IBM Plex Mono"', 'Menlo', 'monospace'],
      },
      animation: {
        marquee: 'marquee 42s linear infinite',
        drift:   'drift 24s ease-in-out infinite',
        fadeUp:  'fadeUp 0.6s cubic-bezier(.16,1,.3,1) forwards',
        fadeIn:  'fadeIn 0.4s ease-out forwards',
        shimmer: 'shimmer 1.8s ease-in-out infinite',
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
        fadeUp: {
          from: { opacity: '0', transform: 'translate3d(0,18px,0)' },
          to:   { opacity: '1', transform: 'translate3d(0,0,0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(.16,1,.3,1)',
      },
    },
  },
  plugins: [],
};
