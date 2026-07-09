---
name: UI Typography Decision
description: Font stack after the premium UI overhaul — serif is now Cormorant Garamond, not Fraunces.
---

## Rule
The primary heading font is **Cormorant Garamond** (via Google Fonts), loaded in `client/index.html`.
`tailwind.config.js` maps `font-serif` to `"Cormorant Garamond"`.
`client/src/styles/MovieDetailPage.css` uses `'Cormorant Garamond', Georgia, serif` for the three heading rules that previously used Fraunces.
Sans = Inter; Mono = IBM Plex Mono. No Fraunces anywhere.

**Why:** Cormorant Garamond is more cinematic and optical-display-weight-friendly for large hero headings; it also has a free italic that pairs better with the maroon glassmorphism identity than Fraunces's optical-size axis.

**How to apply:** Any new heading that needs `font-serif` will automatically use Cormorant Garamond. Never re-introduce Fraunces. If adding an italic heading, use `italic font-serif` classes — Cormorant Garamond 400 italic is loaded.
