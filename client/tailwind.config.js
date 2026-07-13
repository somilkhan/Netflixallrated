/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // bingr.one exact design tokens
        void:          '#0f1014',   // bingr's main bg — dark charcoal, not pure black
        surface:       '#1a1c20',   // bingr's card/surface bg
        'surface-2':   '#1a1c24',
        line:          '#ffffff1a', // white/10 — bingr uses this for borders
        'line-bright': '#ffffff26', // white/15
        maroon:        '#7A2530',   // kept for legacy references
        'maroon-bright': '#C2434F',
        amber:         '#C99A4A',
        ink:           '#ffffff',
        'ink-dim':     '#a0a0a0',
        'ink-faint':   '#555555',
      },
      fontFamily: {
        // bingr's exact font stack
        display: ['"Bebas Neue"', 'Anton', 'Impact', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        serif:   ['"Cormorant Garamond"', 'Georgia', 'serif'],  // keep for legacy
        mono:    ['"IBM Plex Mono"', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        display: '0.04em',   // bingr's Bebas Neue letter-spacing
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
