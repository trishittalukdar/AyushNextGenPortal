import type { VercelRequest, VercelResponse } from '@vercel/node';

const RAPID_API_KEY = process.env.RAPIDAPI_KEY ?? process.env.VITE_RAPIDAPI_KEY;

async function fetchRapidApi(url: string, host: string) {
  if (!RAPID_API_KEY) return null;
  const response = await fetch(url, {
    headers: {
      'x-rapidapi-key': RAPID_API_KEY,
      'x-rapidapi-host': host,
    },
  });
  if (!response.ok) return null;
  return response.json() as Promise<unknown>;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const query = typeof request.query.query === 'string' ? request.query.query.trim() : '';
  if (!query) return response.status(400).json({ error: 'A search query is required' });
  if (!RAPID_API_KEY) return response.status(500).json({ error: 'RAPIDAPI_KEY is not configured' });

  const encodedQuery = encodeURIComponent(`${query} India`);
  const [jsearch, internships] = await Promise.all([
    fetchRapidApi(
      `https://jsearch.p.rapidapi.com/search?query=${encodedQuery}&page=1&num_pages=1`,
      'jsearch.p.rapidapi.com',
    ),
    fetchRapidApi(
      `https://internships-api.p.rapidapi.com/search?query=${encodedQuery}`,
      'internships-api.p.rapidapi.com',
    ),
  ]);

  const jobs = [jsearch, internships].flatMap((payload) => {
    if (!payload || typeof payload !== 'object') return [];
    const body = payload as { data?: unknown; jobs?: unknown; results?: unknown };
    const rows = [body.data, body.jobs, body.results].find(Array.isArray);
    const source = payload === jsearch ? 'jsearch' : 'internships';
    return (rows ?? []).map((job) => ({ ...(job as Record<string, unknown>), __source: source }));
  });

  return response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600').status(200).json({ data: jobs });
}
