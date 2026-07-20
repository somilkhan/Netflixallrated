---
name: Redesign component map
description: Where new components live after the 2025 redesign.
---

# New Component Locations (post-redesign)

## Layout
- `client/src/components/layout/TopNav.tsx` — unified nav bar

## Sections (page-level building blocks)
- `client/src/components/sections/HeroSection.tsx` — full-viewport hero with auto-advance + YouTube trailer bg
- `client/src/components/sections/ContentRow.tsx` — horizontal scroll section with nav arrows
- `client/src/components/sections/TopTenRow.tsx` — large rank numerals behind cards

## UI atoms
- `client/src/components/ui/ContentCard.tsx` — poster card (replaces GlassCard+Card for new design)
- `client/src/components/ui/SkeletonCard.tsx` — loading skeleton
- `client/src/components/ui/FilterPill.tsx` — glassmorphism filter button

## Hooks
- `client/src/hooks/useScrollDirection.ts`
- `client/src/hooks/useMediaQuery.ts`
- `client/src/hooks/useClickOutside.ts`

## Styles
- `client/src/styles/design-tokens.css` — CSS custom properties (single source of truth)
- `client/src/styles/animations.css` — shared animation keyframes + utility classes

## Design tokens
- Background: `#0A0A0A` / `#141414` / `#1A1A1A`
- Text: `#FFFFFF` / `#A3A3A3` / `#737373`
- Font: Inter only (no Bebas Neue for display)
- Nav height: 64px

**Why:** Complete frontend redesign requested — new component architecture to enforce clean separation between layout, sections, and UI atoms.
