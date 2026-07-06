/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep space palette — "Deep Scan"
        void:           '#04080F',
        surface:        '#0A1423',
        'surface-2':    '#0E1C30',
        line:           '#152840',
        'line-bright':  '#1E3D5C',
        // Accent: electric cyan (replaces maroon semantically)
        maroon:         '#004D6B',
        'maroon-bright':'#00D4FF',
        // Highlight: emerald (replaces amber semantically)
        amber:          '#00E5A0',
        // Text hierarchy
        ink:            '#E4F1FF',
        'ink-dim':      '#6A9AB8',
        'ink-faint':    '#2C4D67',
      },
      fontFamily: {
        // Space Grotesk for all display & body — geometric, precise, futuristic
        serif: ['Space Grotesk', 'sans-serif'],
        sans:  ['Space Grotesk', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      animation: {
        marquee:  'marquee 42s linear infinite',
        drift:    'drift 24s ease-in-out infinite',
        fadeUp:   'fadeUp 0.6s cubic-bezier(.2,.7,.3,1) forwards',
        scanline: 'scanline 8s linear infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        marquee:   { from: { transform: 'translate3d(0,0,0)' }, to: { transform: 'translate3d(-50%,0,0)' } },
        drift:     { '0%,100%': { transform: 'translate3d(0,0,0)' }, '50%': { transform: 'translate3d(-2%,1.5%,0)' } },
        fadeUp:    { from: { opacity: '0', transform: 'translate3d(0,14px,0)' }, to: { opacity: '1', transform: 'translate3d(0,0,0)' } },
        scanline:  { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
        glowPulse: { '0%,100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
      },
      boxShadow: {
        'cyan-sm':  '0 0 8px rgba(0,212,255,0.3)',
        'cyan-md':  '0 0 20px rgba(0,212,255,0.2)',
        'cyan-lg':  '0 0 40px rgba(0,212,255,0.15)',
      },
    },
  },
  plugins: [],
};
