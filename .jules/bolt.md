## 2025-03-02 - Hook-Based DOM Observation Tuning & Workspace Dependency Hygiene
**Learning:**
1. Passive and continuous IntersectionObserver instances for elements that only need to load once (such as row/category lazy loaders or above-the-fold content wrappers) introduce unnecessary layout callback execution overhead during scroll events. Adding a `triggerOnce` flag that disconnects the observer immediately upon intersection saves valuable rendering main-thread time.
2. Conversely, infinite scroll sentinels must keep observing the viewport and reset their state back to `false` when they leave the viewport; otherwise, they get stuck in a stale `true` state, causing redundant/double fetch cycles and API request duplication when other unrelated states render.
3. In a pnpm monorepo structure, running install commands (like `pnpm install` or `pnpm --prefix client install`) within subfolders can create local `pnpm-lock.yaml` files, which breaks package deduplication, decouples dependencies, and causes CI/CD build pipelines to fail. Workspace-aware package installations must always be managed from the repository root.

**Action:**
- Implement customizable `triggerOnce` option on custom `useIntersectionObserver` hooks to allow static lazy components to cleanly self-terminate observation.
- Set `triggerOnce: false` for infinite scroll sentinels and reset state to `false` when out of view.
- Never run subfolder dependency commands that can create local lockfiles; keep all lockfile tracking centralized in the root `pnpm-lock.yaml`.
