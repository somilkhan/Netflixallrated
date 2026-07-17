---
name: Luxury UI/UX upgrade — component decisions
description: Design system choices made during the comprehensive luxury UI upgrade — animation patterns, color system purge, and component API changes.
---

# Luxury UI/UX Upgrade — Decisions

## Color system: white-only, no maroon in primary UI
**Rule:** All nav, search, input, button, and interactive states use white/opacity tokens only. Maroon (#7A2530 / #C2434F) is reserved for admin-specific UI and rating tier badges only.
**Why:** Maroon crept into focus rings, filter pills, avatar gradients, region picker — creating a split design system inconsistent with the dark cinematic aesthetic.
**Fixed files:** Navbar.tsx, SideRail.tsx, SearchResults.tsx, RegionPicker.tsx, SearchResultsGrid.tsx, GlassLoader.tsx (spinner now white gradient).

## Animation: GPU-only transforms throughout
**Rule:** All hover/active animations use only `transform` + `opacity`. Never animate width/height/padding/margin. Use `will-change: transform` on cards.
**Why:** Layout-triggering properties cause jank on low-end devices. All effects are now GPU-composited.

## GlassCard hover
- Lift: `-translate-y-[8px] scale(1.026)`
- Shadow: `0 28px 60px -10px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.10)`
- Gloss sweep: div with `glossSweep` keyframe fires on mouseenter via React state
- Poster scale: `group-hover:scale-[1.04]` on img for parallax depth

## Section reveal: framer-motion whileInView
Section.tsx converted from manual IntersectionObserver + classList to framer-motion `whileInView` with `once: true`. Eliminates race condition where elements re-animated on scroll-back.

## SideRail active state
Active nav item: `bg-white/[0.09]` pill + 2.5px left edge white bar with box-shadow glow. No background on inactive hover — color transition only.

## HeroCarousel: Ken Burns on active slide
ImageBg uses `kenBurns` keyframe (scale 1.0→1.06 + slight translate) applied via `style.animation` prop so it resets on slide change.

## SearchOverlay: framer-motion AnimatePresence
Replaced CSS animation + conditional render with AnimatePresence for proper mount/unmount exit animation.

## CategoryTile hover
Converted from static inline styles to useTileHover() hook with onMouseEnter/Leave that sets transform + boxShadow + borderColor inline. GPU-only.
