# Bolt's Journal - Critical Learnings Only

## 2025-08-06 - Intersection Observer Optimization & Monorepo Lockfile Guardrails
**Learning:** Over-retaining DOM observers in custom hooks like `useHasIntersected` leads to continuous CPU/memory consumption since intersection events are continuously tracked even after the element is loaded. Adding a `triggerOnce` option (defaulting to `true`) successfully disconnects the observer upon first intersection, while letting infinite scroll/sentinel features opt-out. Furthermore, running direct package commands (like subdirectory installations) can inadvertently break workspace-level tooling and create decoupled lockfiles that corrupt root dependency graphs.
**Action:** Always clean up IntersectionObservers immediately after their first match for static elements and ensure workspace dependencies are managed globally at the workspace root to prevent corruption of `pnpm-lock.yaml`.
