---
name: framer-motion / client package install gotcha
description: installLanguagePackages can silently install into the wrong package.json in this monorepo
---
`installLanguagePackages`/default Node package tooling installed `framer-motion` into the repo-root
`package.json`, not `client/package.json`, causing an "Invalid hook call" runtime error (two copies of
React resolved) until it was `npm install`ed manually inside `client/`.

**Why:** this repo has a separate, unused root `package.json` alongside the real app in `client/`
(see `client-package-installs` memory) — the same trap applies to any package installer, not just
manual `npm install`.

**How to apply:** after installing any client-side npm package here, verify with
`grep <pkg> client/package.json` and `npm ls <pkg>` from inside `client/` before trusting it's usable;
if it only shows up in the root `package.json`, `cd client && npm install <pkg>` explicitly.
