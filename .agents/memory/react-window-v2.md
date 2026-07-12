---
name: react-window v2 API
description: react-window v2's virtualization API is a full rewrite from v1 — don't reach for v1-era patterns or the separate types package.
---

`react-window` v2.x replaced the v1 API (`FixedSizeList`, `itemSize`, `itemCount`, `itemData`) with a new shape: `List` component using `rowComponent`, `rowHeight`, `rowCount`, and `rowProps`.

**Why:** Most existing examples/docs online and muscle memory reference v1. Installing `@types/react-window` (a v1-era types package) alongside v2 causes type conflicts because v2 ships its own bundled `.d.ts` with the new API — the two disagree on component shape.

**How to apply:** When adding virtualized lists with react-window v2, use `List` + `rowComponent`/`rowHeight`/`rowCount`/`rowProps` only, and do not install `@types/react-window`. If `rowComponent` needs to be memoized for perf, wrap the memoized component inside a plain function component passed as `rowComponent` — react-window's type expects a bare function returning `ReactElement | null`, and `React.memo(...)`'s `NamedExoticComponent` return type doesn't satisfy that directly.
