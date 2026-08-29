import type { VercelRequest, VercelResponse } from '@vercel/node';

const RAPID_API_KEY = process.env.RAPIDAPI_KEY ?? process.env.VITE_RAPIDAPI_KEY;
const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
const SERPAPI_KEY = process.env.SERPAPI_KEY;

function buildSearchVariants(query: string): string[] {
  const clean = query.trim().replace(/[^a-z0-9\s+/-]/gi, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return ['jobs'];

  const lower = clean.toLowerCase();
  const aliasMap: Record<string, string[]> = {
    'aiml': ['ai ml', 'artificial intelligence', 'machine learning', 'ai'],
    'ai ml': ['artificial intelligence', 'machine learning'],
    'data scientist': ['data science', 'analytics', 'machine learning'],
    'machine learning': ['ml', 'ai', 'artificial intelligence', 'data science'],
    'ml engineer': ['machine learning engineer', 'ai engineer'],
    'python developer': ['python engineer', 'backend developer', 'software engineer'],
    'react developer': ['frontend developer', 'ui engineer'],
    'clinical research': ['clinical trials', 'research associate', 'pharmacovigilance'],
    'ayush': ['ayurveda', 'panchakarma', 'natural medicine'],
    'panchakarma': ['ayurveda', 'wellness therapy'],
    'pharmacovigilance': ['drug safety', 'clinical safety'],
  };

  const primaryVariants = new Set<string>([clean]);
  const tokens = lower.split(/\s+/);
  for (const token of tokens) {
    const alias = aliasMap[token] ?? aliasMap[lower] ?? [];
    alias.forEach((alternative) => primaryVariants.add(alternative));
  }

  const variants = Array.from(primaryVariants)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 8);

  const expanded = variants.flatMap((variant) => [
    variant,
    `${variant} jobs`,
    `${variant} job openings`,
    `${variant} india`,
  ]);

  return [...new Set(expanded)].slice(0, 12);
}

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

async function fetchGoogleCustomSearch(query: string) {
  if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) return null;

  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(GOOGLE_SEARCH_API_KEY)}&cx=${encodeURIComponent(GOOGLE_SEARCH_ENGINE_ID)}&q=${encodeURIComponent(`${query} jobs India`)}&num=8`;
  const response = await fetch(url);
  if (!response.ok) return null;
  return response.json() as Promise<unknown>;
}

async function fetchSerpApiJobs(query: string) {
  if (!SERPAPI_KEY) return null;

  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(`${query} jobs`)}&engine=google_jobs&location=India&api_key=${encodeURIComponent(SERPAPI_KEY)}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  return response.json() as Promise<unknown>;
}

function flattenSearchResults(payload: unknown, source: string): Array<Record<string, unknown>> {
  if (!payload || typeof payload !== 'object') return [];
  const body = payload as { data?: unknown; jobs?: unknown; results?: unknown; items?: unknown; organic_results?: unknown; jobs_results?: unknown };
  const rows = [body.data, body.jobs, body.results, body.items, body.organic_results, body.jobs_results].find(Array.isArray);
  if (!rows) return [];

  return (rows as Array<Record<string, unknown>>).map((row) => ({ ...row, __source: source }));
}

function rankJobsForQuery(jobs: Array<Record<string, unknown>>, query: string) {
  const queryVariants = buildSearchVariants(query);
  const normalizedVariants = queryVariants.map((value) => value.toLowerCase());

  return jobs
    .map((job) => {
      const title = String((job.job_title ?? job.title ?? job.position ?? '') || '').toLowerCase();
      const company = String((job.employer_name ?? job.company_name ?? job.company ?? '') || '').toLowerCase();
      const description = String((job.job_description ?? job.description ?? job.summary ?? '') || '').toLowerCase();
      const skills = String((job.job_required_skills ?? job.skills ?? job.skill_set ?? '') || '').toLowerCase();
      const text = `${title} ${company} ${description} ${skills}`;

      let score = 0;
      if (job.__source === 'jsearch') score += 35;
      if (job.__source === 'serpapi') score += 30;
      if (job.__source === 'google_search') score += 25;
      if (job.__source === 'internships') score += 20;

      normalizedVariants.forEach((variant) => {
        if (!variant) return;
        if (title.includes(variant)) score += 30;
        if (company.includes(variant)) score += 10;
        if (description.includes(variant)) score += 16;
        if (skills.includes(variant)) score += 14;
        if (text.includes(variant)) score += 8;
      });

      return { ...job, __score: score };
    })
    .sort((a, b) => Number(b.__score) - Number(a.__score));
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const query = typeof request.query.query === 'string' ? request.query.query.trim() : '';
  if (!query) {
    return response.status(400).json({ error: 'A search query is required' });
  }

  const queryVariants = buildSearchVariants(query);
  const primaryQuery = queryVariants[0] ?? query;
  const encodedQuery = encodeURIComponent(`${primaryQuery} India`);
  const [jsearch, internships, googleSearch, serpApiJobs] = await Promise.all([
    fetchRapidApi(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(`${primaryQuery} India`)}&page=1&num_pages=1`,
      'jsearch.p.rapidapi.com',
    ),
    fetchRapidApi(
      `https://internships-api.p.rapidapi.com/search?query=${encodeURIComponent(primaryQuery)}`,
      'internships-api.p.rapidapi.com',
    ),
    fetchGoogleCustomSearch(primaryQuery),
    fetchSerpApiJobs(primaryQuery),
  ]);

  const jobs = rankJobsForQuery([
    ...flattenSearchResults(jsearch, 'jsearch'),
    ...flattenSearchResults(internships, 'internships'),
    ...flattenSearchResults(googleSearch, 'google_search'),
    ...flattenSearchResults(serpApiJobs, 'serpapi'),
  ], query);

  return response
    .setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    .status(200)
    .json({ data: jobs.map(({ __score, ...job }) => job) });
}
