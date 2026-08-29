# AyushNextGenPortal

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-5nmg26nu)

## Deploy to Vercel

1. Push this project to GitHub and import it at [vercel.com](https://vercel.com).
2. In the Vercel project settings, add an environment variable named `RAPIDAPI_KEY` containing your RapidAPI key.
3. Deploy. Vercel builds the Vite site and the `/api/jobs` serverless endpoint automatically.

The search bar queries JSearch and Internships API through the serverless endpoint, so the RapidAPI key is not exposed in browser code. For local development, `npm run dev` uses fallback results because Vite does not run the Vercel function; use `vercel dev` to test live API results locally.
