# Base44 Dev Environment

## Stack
Vite + React + TypeScript single-page app (Ayush NextGen job portal). No backend process — the Vite dev server is the only app service.

## Running
`docker compose -f docker-compose.base44.yml up -d` — runs `node:22`, bind-mounts the repo at `/app`, installs deps on boot, and runs `vite --host 0.0.0.0`. Web entry is host port 3000 → container 5173.

## Credentials
None required to boot. The app degrades gracefully:
- **RapidAPI (JSearch)** — `VITE_RAPIDAPI_KEY` powers live job search from the browser. Without it, `jobSearchService.ts` falls back to local demo jobs. A key is committed in `jsearchapi.env` but Vite does not auto-load that filename; it is optional.
- **Supabase** — `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` enable DB-backed data. Without them `supabase.ts` sets `hasSupabaseConfig=false` and the app uses `FALLBACK_*` data + localStorage auth.
- The `/api/jobs` Vercel serverless function (`api/jobs.ts`) is only used in production on Vercel, not in local dev.

## Notes
- `vite.config.ts` sets `server.host: true` + `allowedHosts: true` so the preview's external hostname is accepted.
- `CHOKIDAR_USEPOLLING=true` ensures file-watch fires under the bind mount.
- `node_modules` is an anonymous volume so the bind mount doesn't shadow the container-installed deps.
