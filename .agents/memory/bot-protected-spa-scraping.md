---
name: Bot-protected SPA scraping fallback
description: What to do when Playwright/headless scraping of a reference site returns an empty body
---
When cloning/migrating another site's design, raw Playwright automation (even with a real user agent,
`--no-sandbox`, and all the right system libs installed via `installSystemDependencies`) can still get
an empty `<html><head></head><body></body></html>` from a bot-protected or heavily-guarded SPA, while
the platform's own `Screenshot` tool (external URL) renders the same page correctly.

**Why:** the Screenshot tool's rendering path evidently isn't flagged by the target's bot/anti-automation
checks the way a bare `playwright.chromium.launch()` session is (different fingerprint/headers/behavior).

**How to apply:** don't sink time into further Playwright dependency-chasing when this happens once —
pivot immediately to: (1) `Screenshot` tool for visual reference at whatever viewport it gives you
(usually one fixed size, no device emulation), (2) treat the migration as visually-driven (read the
screenshot, describe layout/spacing/type by eye) rather than pixel-CSS-driven, (3) try guessing a few
concrete sub-routes (e.g. `/search`, `/movie/123`) as separate Screenshot calls to get more reference
pages instead of trying to script navigation.
