---
name: Aperture Star brand identity
description: NetflixAllrated's logo/brand system — where it lives, how variants map to use cases, and a WebGL caveat for the interactive 3D mark.
---

The full brand identity ("The Aperture Star" — faceted 4-point glass star with N/A facet creases and a hidden negative-space play triangle) lives in `client/src/brand/`. `Logo.tsx` exports ready-made lockups (`PrimaryLogo`, `Monogram`, `NavbarLogo`, `SplashLogo`, `LoadingLogo`, `DarkVariantLogo`) — use those instead of composing `LogoMark` by hand when adding the mark elsewhere.

Review page at `/brand` (not linked in nav) shows every asset side by side.

**Whyःa dedicated review route instead of mockup sandbox:** the assets are real deliverables meant to be wired into the live app (favicon, navbar, loader), not throwaway mockups, so they were built directly in `client/src/` with a hidden route for visual QA.

**WebGL caveat:** `InteractiveLogoScene.tsx` (Three.js interactive version) fails to get a WebGL context in this sandbox's headless screenshot tool ("BindToCurrentSequence failed") — this is a headless/sandbox GPU limitation, not a code bug. It has a graceful fallback to the static `AnimatedLogoMark` when `renderer.getContext()` fails, so real browsers with WebGL are unaffected.
