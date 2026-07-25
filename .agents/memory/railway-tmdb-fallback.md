---
name: Railway TMDB fallback
description: Why the deployed client can lose TMDB data even when the Replit preview works
---

Railway and Replit do not share frontend build-time environment variables. A `VITE_TMDB_API_KEY` configured in Replit is baked into the Replit bundle but is not automatically available when Railway builds the client. The deployed client must either receive that value as a Railway Docker build argument or use the server-side TMDB proxy backed by Railway's `TMDB_API_KEY`.

**Why:** The Railway bundle can load successfully while all direct TMDB browser requests fail because the key is absent; SPA fallback routes can make missing proxy endpoints look like successful HTML responses.

**How to apply:** Keep direct TMDB calls for builds with `VITE_TMDB_API_KEY`, provide an allowlisted `/api/tmdb` server proxy for builds without it, and verify the proxy response is JSON rather than the SPA document before diagnosing UI layout.