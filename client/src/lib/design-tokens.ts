// ── Allrated Design Tokens ── Netflix UI Specification ──
// Zero hardcoded values allowed in components. Use these tokens only.

export const colors = {
  // Backgrounds
  page:        '#000000',
  surface:     '#161616',
  surfaceHover:'#1f1f1f',
  elevated:    '#1a1a1a',

  // Text
  textPrimary:   '#ffffff',
  textSecondary: 'rgba(255,255,255,0.70)',
  textTertiary:  'rgba(255,255,255,0.45)',
  textDisabled:  'rgba(255,255,255,0.30)',

  // Accents
  primary:     '#e50914',      // Netflix red
  primaryHover:'#f40612',
  success:     '#46d369',      // Match % green
  warning:     '#e87c03',      // Amber for warnings

  // Buttons
  buttonSecondary: '#4d4d4d',
  buttonSecondaryHover: '#5a5a5a',

  // Borders
  borderSubtle:   'rgba(255,255,255,0.06)',
  borderDefault:  'rgba(255,255,255,0.10)',
  borderHover:    'rgba(255,255,255,0.20)',

  // Overlays
  overlayLight: 'rgba(255,255,255,0.06)',
  overlayMedium:'rgba(255,255,255,0.10)',
  overlayDark:  'rgba(0,0,0,0.60)',
  gradientHero: 'linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.40) 50%, transparent 100%)',
} as const;

export const spacing = {
  // 8px grid — Netflix uses this strictly
  '0':  '0px',
  '0.5':'4px',
  '1':  '8px',
  '1.5':'12px',
  '2':  '16px',
  '2.5':'20px',
  '3':  '24px',
  '4':  '32px',
  '5':  '40px',
  '6':  '48px',
  '8':  '64px',
  '10': '80px',
  '12': '96px',
} as const;

export const radius = {
  none:   '0px',
  sm:     '2px',
  md:     '4px',    // Cards, posters, buttons
  lg:     '8px',    // Containers, modals
  xl:     '12px',   // Large containers
  full:   '9999px', // Avatars, profile pics only
} as const;

export const typography = {
  // Netflix uses a tight, bold hierarchy
  '2xs':  { size: '9px',  lineHeight: '12px',  weight: 400 },
  xs:     { size: '10px', lineHeight: '14px',  weight: 400 },
  sm:     { size: '11px', lineHeight: '15px',  weight: 400 },
  base:   { size: '12px', lineHeight: '16px',  weight: 400 },
  md:     { size: '13px', lineHeight: '17px',  weight: 500 },
  lg:     { size: '14px', lineHeight: '20px',  weight: 400 },
  xl:     { size: '15px', lineHeight: '22px',  weight: 400 },
  '2xl':  { size: '16px', lineHeight: '24px',  weight: 500 },
  '3xl':  { size: '18px', lineHeight: '26px',  weight: 500 },
  '4xl':  { size: '20px', lineHeight: '28px',  weight: 600 },
  '5xl':  { size: '22px', lineHeight: '30px',  weight: 700 },
  '6xl':  { size: '24px', lineHeight: '32px',  weight: 700 },
  '7xl':  { size: '28px', lineHeight: '36px',  weight: 700 },
  '8xl':  { size: '32px', lineHeight: '40px',  weight: 700 },
  hero:   { size: 'clamp(28px, 4vw, 48px)', lineHeight: '1.1', weight: 700 },
} as const;

export const cards = {
  poster: {
    width: { mobile: '140px', tablet: '180px', desktop: '230px' },
    aspectRatio: '2 / 3',
    radius: '4px',
    gap: '8px',
  },
  backdrop: {
    width: { mobile: '280px', tablet: '320px', desktop: '400px' },
    aspectRatio: '16 / 9',
    radius: '4px',
    gap: '8px',
  },
  square: {
    width: { mobile: '130px', tablet: '160px', desktop: '200px' },
    aspectRatio: '1 / 1',
    radius: '4px',
    gap: '8px',
  },
} as const;

export const zIndex = {
  base:     0,
  content:  10,
  header:   40,
  overlay:  50,
  modal:    60,
  tooltip:  70,
  toast:    80,
} as const;

export const transitions = {
  fast:   '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  default:'250ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow:   '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  hover:  '400ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

export const shadows = {
  none:   'none',
  sm:     '0 2px 8px rgba(0,0,0,0.30)',
  md:     '0 4px 16px rgba(0,0,0,0.40)',
  lg:     '0 8px 32px rgba(0,0,0,0.50)',
  hero:   '0 4px 24px rgba(0,0,0,0.50)',
} as const;
