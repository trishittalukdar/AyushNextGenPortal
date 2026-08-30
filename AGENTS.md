# Base44 Dev Environment

## Stack
Vite + React + TypeScript single-page app (Ayush NextGen job portal). The Vite dev
server is the only app service; it also serves the `/api/jobs` search endpoint via
a server-side middleware plugin (see below).

## Running
`docker compose -f docker-compose.base44.yml up -d` — runs `node:22`, bind-mounts
the repo at `/app`, installs deps on boot, and runs `vite --host 0.0.0.0`. Web entry
is host port 3000 → container 5173.

## Live job search architecture
- **`api/searchEngine.ts`** — framework-agnostic search engine. Reads API keys
  from `process.env` ONLY (RAPIDAPI_KEY, GOOGLE_SEARCH_API_KEY,
  GOOGLE_SEARCH_ENGINE_ID, SERPAPI_KEY). Calls JSearch + Internships API in
  parallel (plus optional Google Programmable Search + SerpApi), normalizes every
  provider into one `SearchResultJob` shape, dedupes, ranks by query relevance +
  source quality, and returns `{ data, source, providers }`. Falls back to
  generated results when no keys are set or all providers fail.
- **`vite.config.ts`** — `localApiPlugin()` serves `/api/jobs` inside the Vite dev
  server (server-side, Node) so the frontend calls it same-origin in dev. Keys
  are read from `process.env` and are NEVER exposed to the browser (only `VITE_`-
  prefixed vars reach client code, and the search keys are not `VITE_`-prefixed).
- **`api/jobs.ts`** — Vercel serverless function (production) that delegates to
  `searchEngine.ts`. Same engine, same keys from server env.
- **`src/services/jobSearchService.ts`** — `searchJobsLive()` calls `/api/jobs`
  (not RapidAPI directly) and falls back to generated `searchJobs()` if the
  backend is unreachable. No API keys live in frontend code.
- **`src/components/StudentHub.tsx`** — renders live search-as-you-type results in
  a "Live Web Results" section (`searchedWebJobs`) with loading skeletons, plus
  the "Find Matching Jobs" button results (`candidateJobs`).

## Credentials
None required to boot — the app degrades to generated fallback jobs.
- **RAPIDAPI_KEY** — powers JSearch + Internships API live search. Provided via
  the platform secrets (delivered to `/run/base44/app.env`, wired into the web
  service `env_file`). A legacy key also exists in `jsearchapi.env` but is not
  loaded (it is `VITE_`-prefixed and would leak to the browser).
- **GOOGLE_SEARCH_API_KEY / GOOGLE_SEARCH_ENGINE_ID / SERPAPI_KEY** — optional
  extra providers.
- **Supabase** (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`) — optional; without
  them the app uses `FALLBACK_*` data + localStorage auth.

## Notes
- `vite.config.ts` sets `server.host: true` + `allowedHosts: true` so the preview's
  external hostname is accepted.
- `CHOKIDAR_USEPOLLING=true` ensures file-watch fires under the bind mount.
- `node_modules` is an anonymous volume so the bind mount doesn't shadow deps.
- `tsconfig.app.json` has a pre-existing `--ignoreDeprecations` config error;
  Vite compiles via esbuild and runs fine regardless.
