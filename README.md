# AyushNextGenPortal

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-5nmg26nu)

## Deploy to Vercel

1. Push this project to GitHub and import it at [vercel.com](https://vercel.com).
2. In the Vercel project settings, add any of the search provider keys you want to enable:
   - `RAPIDAPI_KEY`
   - `GOOGLE_SEARCH_API_KEY`
   - `GOOGLE_SEARCH_ENGINE_ID`
   - `SERPAPI_KEY`
3. Deploy. Vercel builds the Vite site and the `/api/jobs` serverless endpoint automatically.

The search bar queries the backend endpoint, which can combine live results from RapidAPI, Google Programmable Search, and SerpApi depending on what you configure. The key is never exposed in browser code. For local development, `npm run dev` uses fallback results because Vite does not run the Vercel function; use `vercel dev` to test live API results locally.
