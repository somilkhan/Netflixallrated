---
name: FebBox lookup failures
description: How to tell a real bug from a FebBox upstream outage in the showbox route
---

"FebBox lookup failed" reports are often not a code bug — febbox.com has had full-site
outages (even its homepage returns HTTP 500 / a Chinese "系统发生错误" HTML error page).
Before touching `server/src/routes/showbox.ts`, isolate the failure point by running
each step (Showbox `Search5`, `showbox.media/index/share_link`, febbox.com
`file_share_list`) directly with a standalone script — if even febbox.com's homepage
500s, it's their outage, not ours.

**Why:** wasted a debugging cycle assuming the crypto/API integration was broken when
the third-party site was simply down.

**How to apply:** the route now returns 503 with "FebBox is temporarily unavailable"
when it detects a FebBox 5xx/HTML-instead-of-JSON response, vs 500 for other errors.
Client shows the server's actual message. If a future report recurs, re-run the
isolation script before assuming a code regression.
