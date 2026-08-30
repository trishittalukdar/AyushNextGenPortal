import type { VercelRequest, VercelResponse } from '@vercel/node';
import { searchJobs } from './searchEngine';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const query = typeof request.query.query === 'string' ? request.query.query.trim() : '';
  const category = typeof request.query.category === 'string' ? request.query.category : 'All Skills';

  if (!query) {
    return response.status(400).json({ error: 'A search query is required' });
  }

  try {
    const result = await searchJobs(query, category);
    return response
      .setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
      .status(200)
      .json(result);
  } catch (error) {
    return response.status(500).json({ error: 'Search failed', detail: String(error) });
  }
}
