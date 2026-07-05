# Allrated

A premium Netflix-style streaming UI featuring full-bleed hero trailer autoplay, interactive hover card expansion with video playback, and custom-styled video controls.

## Stack

- **Frontend:** React 19, Tailwind CSS v4, shadcn/ui, Framer Motion
- **Backend:** Express + Vite (full-stack dev server via `tsx server.ts`)
- **AI:** Google Gemini (`@google/genai`)
- **Language:** TypeScript

## How to run

```bash
npm install
npm run dev   # starts Express + Vite on port 5000
```

The workflow "Start application" is configured to run `npm run dev` automatically.

## Environment variables / secrets

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Required | Gemini AI API calls |
| `TMDB_API_KEY` | Optional | Live movie/TV data (falls back to built-in dataset) |
| `SUPABASE_URL` | Optional | Persistent auth & history sync |
| `SUPABASE_ANON_KEY` | Optional | Persistent auth & history sync |
| `NETMIRROR_API_KEY` | Optional | NetMirror premium stream provider |
| `NETMIRROR_API_URL` | Optional | NetMirror base URL (default: https://netmirror.one) |
| `SHOWBOX_FEB_BOX_API_URL` | Optional | Showbox/Febbox streaming service URL |
| `FEB_BOX_TOKEN` | Optional | Febbox UI token for download links |

All secrets are managed via Replit Secrets (never commit `.env.local`).

## User preferences

- Keep existing project structure and stack
