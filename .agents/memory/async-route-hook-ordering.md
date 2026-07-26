---
name: Async route hook ordering
description: React hook ordering constraints in lazy-loaded pages that initially render before remote data arrives.
---

## Rule
Declare every hook in a component before any conditional return based on asynchronous data. A page that returns a loading/empty state before declaring a later hook can crash only on the first production render with a hook-order error.

**Why:** The Anime hero initially returned while AniList data was empty, then introduced a callback hook after data arrived. React treated those renders as different hook sequences and threw a minified hook-order error.

**How to apply:** Keep callbacks, effects, memoized values, and refs above `if (!data.length) return null` or loading/error returns. Let callbacks safely no-op when their async data is not available yet.