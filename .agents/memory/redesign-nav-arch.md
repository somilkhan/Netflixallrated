---
name: Redesign nav architecture
description: The old 3-nav-component setup (SideRail desktop + Navbar mobile + BottomNav mobile) was replaced by a single TopNav component.
---

# Nav Architecture Change

## The rule
`SideRail`, `Navbar`, and `BottomNav` are no longer used in App.tsx. All navigation is handled by `client/src/components/layout/TopNav.tsx`.

**Why:** User requested a complete UI redesign replacing the sidebar-first layout with a top-navigation pattern matching modern streaming apps (Netflix/Max style).

## How to apply
- App.tsx imports only `TopNav` from `./components/layout/TopNav` — do not re-add SideRail, Navbar, or BottomNav.
- No `rail-offset` padding class on any container — that was the 64px left offset for the old SideRail.
- No `pt-[52px]` top padding — TopNav is transparent at page top and overlays the hero section.
- `main` element has no padding; pages that need to account for the 64px nav height should do so locally (hero section covers the nav intentionally).

## TopNav features
- Desktop: transparent → glassmorphism on scroll (>50px). Logo | nav links | search | profile dropdown.
- Mobile: Logo | search icon | hamburger → full-screen overlay menu (56px+ tap targets).
- `useScrollDirection` hook drives the scroll state; `useClickOutside` closes dropdowns.
