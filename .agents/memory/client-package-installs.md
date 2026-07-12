---
name: Client package installs
description: Where npm packages must be installed in this repo — the client app has its own package.json separate from the repo root.
---

The repo root has its own `package.json` that is a separate, legacy/unrelated project — it is NOT used by the actual client app.

**Why:** Default package-install tooling targets the repo root by default. Using it for a frontend dependency silently adds the package to the wrong manifest, where it has zero effect on the running app (`Start application` workflow runs `cd client && npm run dev`).

**How to apply:** Any package needed by the client app must be installed by running `npm install <pkg>` with cwd set to `client/`, so it lands in `client/package.json` / `client/node_modules`. Always verify the dependency appears in `client/package.json` afterward, not just in `node_modules`.
