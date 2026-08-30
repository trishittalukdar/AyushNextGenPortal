import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { searchJobs as runJobSearch } from './api/searchEngine';

/**
 * Serves the `/api/jobs` endpoint inside the Vite dev server so the frontend can
 * call it at the same origin in local dev. The search engine runs server-side
 * here (Node), reading API keys from `process.env` — they are never exposed to
 * the browser. In production the same engine runs inside the Vercel function at
 * `api/jobs.ts`.
 */
function localApiPlugin(): PluginOption {
  return {
    name: 'ayush-local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const reqUrl = req.url ?? '';
        if (!reqUrl.startsWith('/api/jobs')) return next();

        try {
          const parsed = new URL(reqUrl, 'http://localhost');
          const query = (parsed.searchParams.get('query') ?? '').trim();
          const category = parsed.searchParams.get('category') ?? 'All Skills';

          if (!query) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'A search query is required' }));
            return;
          }

          const result = await runJobSearch(query, category);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify(result));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Search failed', detail: String(error) }));
        }
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/AyushNextGenPortal/' : '/',
  plugins: [react(), localApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    allowedHosts: true,
    port: 5173,
  },
}));
