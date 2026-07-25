---
name: PWA deployment updates
description: Prevent stale service-worker app shells from masking successful production deployments.
---

## Rule
The PWA service worker must prefer the network for navigations and `index.html`, and its cache name must be versioned when the shell strategy changes.

**Why:** Hashed JavaScript and CSS filenames change on each build, but a cache-first cached HTML document can keep pointing browsers at an old bundle even after Railway has successfully deployed a newer release.

**How to apply:** Keep static assets cacheable for offline use, but use network-first for navigations and API requests. When changing the worker's shell behavior, increment the cache name so activation removes stale caches.