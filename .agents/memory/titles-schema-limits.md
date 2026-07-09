---
name: Title schema real-data limits
description: What genre/platform/type filters are actually backed by real data on the Title model, for anyone wiring more discovery/browse UI.
---

The `Title` Prisma model has no language field and no studio/brand field (Disney, Marvel, etc. are not real entities). Only `genres String[]`, `type` (MOVIE/SERIES/ANIME), and `platforms` (via `Platform.abbr`) are real, queryable dimensions on `GET /api/titles`.

**Why:** a prior "Categories" page used fake Studios (Disney/Marvel/Pixar/Star Wars) and Popular Languages sections with mock data — neither maps to anything in the schema, so filtering by them silently returned nothing/fake data.

**How to apply:** when building browse/filter UI, only offer genre, type, and platform (abbr) as filters unless a migration adds new fields. `genre` filtering on `/api/titles` is an exact string match against the genres array, so any slug→label mapping must match the exact stored genre strings (e.g. "Science Fiction", not "Sci-Fi") — verify against a live `/api/titles` sample before hardcoding a slug map.
