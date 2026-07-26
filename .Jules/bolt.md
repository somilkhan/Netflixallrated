# Bolt's Journal

Welcome to Bolt's Journal. Here we record critical performance learnings specific to this codebase's architecture.

## 2025-02-15 - Infinite Scroll Eager Loading Prevention
**Learning:** Infinite scroll sentinels require `triggerOnce: false` in `useIntersectionObserver` to correctly reset their intersected state to `false` when they go out of view. If `triggerOnce` is left to default (`true`), the sentinel remains in an intersected state, which causes continuous page fetching without scrolling, triggering severe API overhead and browser layout lag.
**Action:** Always configure infinite scroll sentinels with `triggerOnce: false` to ensure lazy loading is scroll-driven.
