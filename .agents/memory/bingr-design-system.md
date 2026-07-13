---
name: bingr.one Design System
description: Exact design tokens and font stack extracted from bingr.one for pixel-perfect UI match
---

## Fonts
- **Display/Title**: `Bebas Neue` (Google Fonts) + Anton, Impact fallbacks; `letter-spacing: 0.04em`
  - Used for ALL hero titles, hero carousel titles, AnimeHeroBanner titles
  - Tailwind class: `font-display`; CSS class: `.font-display`
- **Body/UI**: `Inter` (weights 400, 500, 600, 700) — loaded via Google Fonts
  - Tailwind class: `font-sans`

## Colors (exact bingr tokens)
- **Main background**: `#0f1014` — dark charcoal, NOT pure black
- **Surface/card bg**: `#1a1c20`, `#1a1c22`, `#1a1c24`
- **Border**: `rgba(255,255,255,0.08-0.15)` range
- **Icon inactive**: `rgba(255,255,255,0.30)` (not `#555`)
- **Text dim**: `rgba(255,255,255,0.60-0.65)`

## Sidebar
- Width: **64px** (`w-16`) on desktop
- Background: **solid `#0f1014`** — NOT transparent with gradient
- Icons: 20px, strokeWidth 2.2 active / 1.7 inactive; color-only transitions (no bg box)
- rail-offset: `padding-left: 64px`

## Hero Carousel
- Title: `font-display` (Bebas Neue), `font-size: clamp(52px, 7vw, 86px)`, UPPERCASE
- Gradient overlays use `rgba(15,16,20,...)` (not pure black)
- Play button: white solid circle 46px
- See More: dark pill `rgba(255,255,255,0.08)` bg + `rgba(255,255,255,0.15)` border + backdrop-blur

## Shimmer skeleton
- Colors: `#1a1c20` → `#1f2126` → `#1a1c20` (matches surface colors, not maroon)

**Why:** Extracted directly from bingr.one CSS bundle (`index-D6SDZyLN.css`) and Google Fonts import in HTML.
**How to apply:** Any future redesign or new component must use these exact tokens to maintain consistency.
