/**
 * Server-side job search engine.
 *
 * Aggregates live results from RapidAPI JSearch + Internships API, with optional
 * Google Programmable Search and SerpApi fallbacks. Normalizes every provider
 * into one shape, deduplicates, ranks by query relevance + source quality, and
 * returns a polished fallback set when no keys are configured or all providers
 * fail.
 *
 * IMPORTANT: API keys are read from `process.env` only — this module must never
 * be imported by browser code. In local dev it runs inside the Vite server
 * middleware (see vite.config.ts); in production it runs inside the Vercel
 * serverless function (see api/jobs.ts).
 */

export type SearchResultJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  stipend: string;
  skills: string[];
  description: string;
  source: string;
  category: string;
  external_url: string;
  platform: string;
  created_at: string;
};

export type SearchKind = 'jobs' | 'internships';

type RawJob = Record<string, unknown>;

const RAPIDAPI_KEY = (process.env.RAPIDAPI_KEY ?? '').trim();
const GOOGLE_SEARCH_API_KEY = (process.env.GOOGLE_SEARCH_API_KEY ?? '').trim();
const GOOGLE_SEARCH_ENGINE_ID = (process.env.GOOGLE_SEARCH_ENGINE_ID ?? '').trim();
const SERPAPI_KEY = (process.env.SERPAPI_KEY ?? '').trim();

const SEARCH_SKILLS: Record<string, string[]> = {
  'All Skills': ['Ayush', 'Healthcare', 'Research', 'Software', 'AI', 'Data', 'Engineering'],
  'AYUSH & Medicine': ['Ayurveda', 'Panchakarma', 'Ayush', 'Pharmacovigilance', 'NABH'],
  'Software & AI': ['React', 'Python', 'Machine Learning', 'AI', 'TypeScript', 'UX Design'],
  'Core Engineering': ['Mechanical Design', 'PLC', 'SCADA', 'AutoCAD', 'SolidWorks'],
  'Clinical Research': ['Clinical Trials', 'GCP', 'NABH', 'Pharmacovigilance', 'HPLC'],
  Government: ['Public Health', 'Policy Analysis', 'Epidemiology', 'NCS', 'Public Sector'],
};

const SKILL_POOL = [
  'Ayurveda', 'Panchakarma', 'Pharmacovigilance', 'Clinical Research', 'GCP', 'NABH',
  'HPLC', 'Public Health', 'React', 'Python', 'TypeScript', 'Machine Learning',
  'Data Science', 'AI', 'SQL', 'AutoCAD', 'SolidWorks', 'PLC', 'SCADA',
];

const SYNONYMS: Record<string, string[]> = {
  'aiml': ['artificial intelligence', 'machine learning', 'ai', 'ml', 'data science'],
  'ai ml': ['artificial intelligence', 'machine learning', 'ai', 'ml'],
  ai: ['artificial intelligence', 'machine learning', 'ml'],
  ml: ['machine learning', 'ai'],
  machine: ['machine learning', 'ai'],
  learning: ['machine learning', 'ai'],
  data: ['data science', 'analytics', 'business intelligence'],
  research: ['clinical research', 'research analyst', 'pharmacovigilance'],
  ayush: ['ayurveda', 'panchakarma', 'natural medicine', 'wellness'],
  ayurveda: ['panchakarma', 'wellness', 'herbal medicine'],
  panchakarma: ['ayurveda', 'wellness therapy'],
  healthcare: ['clinical research', 'hospital operations', 'public health'],
  developer: ['software engineer', 'developer'],
  engineer: ['software engineer', 'machine learning engineer', 'data engineer'],
  analyst: ['data analyst', 'business analyst', 'research analyst'],
  therapist: ['panchakarma therapist', 'ayurveda therapist'],
  officer: ['medical officer', 'public health officer'],
  clinical: ['clinical research', 'clinical trials', 'gcp'],
  python: ['python developer', 'backend developer'],
  react: ['react developer', 'frontend developer'],
  remote: ['remote', 'work from home', 'hybrid'],
};

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'jobs', 'job', 'role', 'work', 'open', 'apply',
  'opportunity', 'careers', 'career', 'in', 'at', 'on', 'of', 'to', 'from',
  'any', 'skill', 'search', 'portal', 'vacancy', 'vacancies', 'a', 'an',
]);

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s+&/]/g, ' ').replace(/\s+/g, ' ').trim();
}

function titleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ''))
    .join(' ');
}

/** Expand a raw user query into smarter search variants + enriched query string. */
function buildSearchVariants(query: string): { variants: string[]; enriched: string } {
  const cleaned = normalizeText(query || 'Ayush healthcare jobs');
  const tokens = cleaned.split(/\s+/).filter((word) => word.length > 1 && !STOPWORDS.has(word));
  const expanded = new Set<string>(tokens);

  for (const token of tokens) {
    (SYNONYMS[token] ?? []).forEach((synonym) => expanded.add(synonym));
  }

  const variants = Array.from(expanded).filter(Boolean).slice(0, 8);
  // Primary enriched query sent to providers: original + strongest synonyms.
  const enriched = [cleaned, ...Array.from(expanded).slice(0, 3)].filter(Boolean).join(' ');
  return { variants, enriched: enriched || cleaned };
}

function resolveCategoryForQuery(query: string, selectedCategory: string): string {
  const normalized = normalizeText(query);
  if (selectedCategory && selectedCategory !== 'All Skills') {
    if (selectedCategory === 'AYUSH & Medicine') return 'Healthcare & Ayush';
    if (selectedCategory === 'Software & AI') return 'Tech/Software';
    if (selectedCategory === 'Core Engineering') return 'Core Engineering';
    if (selectedCategory === 'Clinical Research') return 'Healthcare & Ayush';
    if (selectedCategory === 'Government') return 'Government & Public';
  }

  if (/(aiml|ai ml|artificial intelligence|machine learning|ml|deep learning|computer vision|nlp|data science|python|react|typescript|software|developer)/.test(normalized)) {
    return 'Tech/Software';
  }
  if (/(ayurveda|panchakarma|naturopathy|yoga|unani|homeopathy|medicine|healthcare|clinical|hplc|pharmacovigilance|gcp|nabh|research)/.test(normalized)) {
    return 'Healthcare & Ayush';
  }
  if (/(solidworks|cad|plc|scada|mechanical|electrical|process engineering)/.test(normalized)) {
    return 'Core Engineering';
  }
  if (/(government|policy|public health|epidemiology|ncs|public sector)/.test(normalized)) {
    return 'Government & Public';
  }
  return 'Tech/Software';
}

function deriveSkillTags(query: string, category: string): string[] {
  const { variants } = buildSearchVariants(query);
  const categorySkills = SEARCH_SKILLS[category] ?? SEARCH_SKILLS['All Skills'];
  const merged = [...variants, ...categorySkills, ...SKILL_POOL];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of merged) {
    const formatted = titleCase(item);
    if (!formatted || seen.has(formatted.toLowerCase())) continue;
    seen.add(formatted.toLowerCase());
    result.push(formatted);
    if (result.length >= 8) break;
  }
  return result.length > 0 ? result : ['Healthcare', 'Research', 'Analytics', 'AI', 'Clinical Research'];
}

async function fetchWithTimeout(url: string, headers: Record<string, string>, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url: string, headers: Record<string, string>): Promise<unknown | null> {
  try {
    const response = await fetchWithTimeout(url, headers);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function textValue(job: RawJob, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = job[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return fallback;
}

function listValue(job: RawJob, keys: string[], fallback: string[]): string[] {
  for (const key of keys) {
    const value = job[key];
    if (Array.isArray(value)) {
      const items = value
        .map((item) => (typeof item === 'string' ? item.trim() : typeof item === 'object' && item && 'name' in item && typeof (item as { name: unknown }).name === 'string' ? (item as { name: string }).name.trim() : ''))
        .filter(Boolean);
      if (items.length > 0) return items;
    }
    if (typeof value === 'string' && value.trim()) return value.split(/[,|]/).map((item) => item.trim()).filter(Boolean);
  }
  return fallback;
}

function isDirectJobLink(value: string): boolean {
  const link = value.trim();
  if (!link || !/^https?:\/\//i.test(link)) return false;
  try {
    const url = new URL(link);
    const pathname = url.pathname.toLowerCase();
    const hasSearchParams = url.searchParams.has('q') || url.searchParams.has('keywords') || url.searchParams.has('query') || url.searchParams.has('search');
    return !pathname.includes('/search') && !hasSearchParams;
  } catch {
    return false;
  }
}

function directJobLink(job: RawJob): string {
  const candidates = [
    textValue(job, ['job_apply_link', 'apply_link', 'job_url', 'url', 'link', 'page_url', 'job_post_url'], ''),
    textValue(job, ['job_apply_link', 'apply_link', 'url', 'link', 'page_url'], ''),
  ];
  for (const candidate of candidates) {
    if (candidate && isDirectJobLink(candidate)) return candidate;
  }
  return '';
}

function compensationValue(job: RawJob): string {
  const explicit = textValue(job, ['salary', 'stipend', 'salary_range', 'job_salary', 'compensation'], '');
  if (explicit) return explicit;
  const min = textValue(job, ['job_min_salary', 'min_salary', 'salary_min'], '');
  const max = textValue(job, ['job_max_salary', 'max_salary', 'salary_max'], '');
  const currency = textValue(job, ['job_salary_currency', 'currency'], '₹');
  const period = textValue(job, ['job_salary_period', 'salary_period', 'pay_period'], 'month');
  if (min && max) return `${currency}${min} – ${currency}${max} / ${period}`;
  if (min) return `From ${currency}${min} / ${period}`;
  if (max) return `Up to ${currency}${max} / ${period}`;
  return 'Not disclosed';
}

/** Find the first array-like payload inside common wrapper keys. */
function findRows(payload: unknown): RawJob[] | null {
  if (!payload || typeof payload !== 'object') return null;
  const body = payload as Record<string, unknown>;
  const rows = [body.data, body.jobs, body.results, body.items, body.organic_results, body.jobs_results, body.internships].find(Array.isArray);
  if (Array.isArray(rows)) return rows as RawJob[];
  // Some providers return a bare array.
  if (Array.isArray(payload)) return payload as RawJob[];
  return null;
}

function normalizeRows(rows: RawJob[], source: string, platform: string, query: string, category: string): SearchResultJob[] {
  const resolvedCategory = resolveCategoryForQuery(query, category);
  const tags = deriveSkillTags(query, category);

  return rows.map((job, index) => {
    const title = textValue(job, ['job_title', 'title', 'position', 'role', 'name'], 'Open Opportunity');
    const company = textValue(job, ['employer_name', 'company_name', 'company', 'employer', 'organization'], 'Hiring Partner');
    const location = textValue(job, ['job_city', 'job_location', 'location', 'city', 'country', 'region'], 'India');
    const description = textValue(job, ['job_description', 'description', 'summary', 'snippet', 'about'], `Opportunity for ${query}.`);
    const publisher = textValue(job, ['publisher_name', 'job_publisher', 'publisher', 'source', 'platform'], platform);
    const skills = listValue(job, ['job_required_skills', 'skills', 'skill_set', 'technologies', 'tags'], tags.slice(0, 4));
    const applyLink = directJobLink(job);

    return {
      id: textValue(job, ['job_id', 'id', 'position_id', '_id'], `${source}-${index}-${title}`),
      title,
      company,
      location,
      stipend: compensationValue(job),
      skills,
      description: description.length > 240 ? `${description.slice(0, 240)}...` : description,
      source: source,
      category: resolvedCategory,
      external_url: applyLink,
      platform: publisher || platform,
      created_at: new Date().toISOString(),
    };
  });
}

function normalizeGoogleResults(payload: unknown, query: string, category: string): SearchResultJob[] {
  const rows = findRows(payload);
  if (!rows) return [];
  const tags = deriveSkillTags(query, category);
  const resolvedCategory = resolveCategoryForQuery(query, category);
  return rows.map((item, index) => {
    const title = textValue(item, ['title'], 'Job Listing');
    const link = textValue(item, ['link', 'url'], '');
    const snippet = textValue(item, ['snippet', 'description'], `Search result for ${query}.`);
    return {
      id: textValue(item, ['cacheId', 'id', 'guid'], `google-${index}-${title}`),
      title,
      company: textValue(item, ['displayLink', 'pagemap_metatags_company', 'company'], 'Google Search Result'),
      location: 'India',
      stipend: 'Competitive / Standard',
      skills: tags.slice(0, 4),
      description: snippet.length > 240 ? `${snippet.slice(0, 240)}...` : snippet,
      source: 'google_search',
      category: resolvedCategory,
      external_url: isDirectJobLink(link) ? link : '',
      platform: 'Google',
      created_at: new Date().toISOString(),
    };
  });
}

function normalizeSerpApiJobs(payload: unknown, query: string, category: string): SearchResultJob[] {
  const body = (payload ?? {}) as Record<string, unknown>;
  const rows = findRows(body.jobs_results ?? body.organic_results ?? payload);
  if (!rows) return [];
  return normalizeRows(rows, 'serpapi', 'SerpApi', query, category);
}

async function fetchJSearch(enrichedQuery: string): Promise<SearchResultJob[] | null> {
  if (!RAPIDAPI_KEY) return null;
  const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(`${enrichedQuery} India`)}&page=1&num_pages=1&country=in`;
  const payload = await fetchJson(url, {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': 'jsearch.p.rapidapi.com',
  });
  const rows = findRows(payload);
  if (!rows) return null;
  return normalizeRows(rows, 'jsearch', 'JSearch', enrichedQuery, '');
}

async function fetchInternships(enrichedQuery: string): Promise<SearchResultJob[] | null> {
  if (!RAPIDAPI_KEY) return null;
  const url = `https://internships-api.p.rapidapi.com/search?query=${encodeURIComponent(enrichedQuery)}`;
  const payload = await fetchJson(url, {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': 'internships-api.p.rapidapi.com',
  });
  const rows = findRows(payload);
  if (!rows) return null;
  return normalizeRows(rows, 'internships', 'Internships API', enrichedQuery, '');
}

async function fetchGoogleSearch(enrichedQuery: string): Promise<SearchResultJob[] | null> {
  if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) return null;
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(GOOGLE_SEARCH_API_KEY)}&cx=${encodeURIComponent(GOOGLE_SEARCH_ENGINE_ID)}&q=${encodeURIComponent(`${enrichedQuery} jobs India`)}&num=8`;
  const payload = await fetchJson(url, {});
  if (!payload) return null;
  return normalizeGoogleResults(payload, enrichedQuery, '');
}

async function fetchSerpApi(enrichedQuery: string): Promise<SearchResultJob[] | null> {
  if (!SERPAPI_KEY) return null;
  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(`${enrichedQuery} jobs`)}&engine=google_jobs&location=India&api_key=${encodeURIComponent(SERPAPI_KEY)}`;
  const payload = await fetchJson(url, {});
  if (!payload) return null;
  return normalizeSerpApiJobs(payload, enrichedQuery, '');
}

/** Deduplicate by id, then by normalized title+company. */
function dedupeJobs(jobs: SearchResultJob[]): SearchResultJob[] {
  const seenId = new Set<string>();
  const seenKey = new Set<string>();
  const result: SearchResultJob[] = [];
  for (const job of jobs) {
    if (seenId.has(job.id)) continue;
    seenId.add(job.id);
    const key = `${job.title.toLowerCase()}|${job.company.toLowerCase()}`;
    if (seenKey.has(key)) continue;
    seenKey.add(key);
    result.push(job);
  }
  return result;
}

const SOURCE_QUALITY: Record<string, number> = {
  jsearch: 35,
  serpapi: 30,
  google_search: 25,
  internships: 20,
};

function rankJobs(jobs: SearchResultJob[], query: string): SearchResultJob[] {
  const { variants } = buildSearchVariants(query);
  const terms = variants.map((v) => v.toLowerCase());

  return jobs
    .map((job) => {
      const title = job.title.toLowerCase();
      const company = job.company.toLowerCase();
      const description = job.description.toLowerCase();
      const skills = (job.skills ?? []).join(' ').toLowerCase();
      let score = SOURCE_QUALITY[job.source] ?? 10;

      for (const term of terms) {
        if (!term) continue;
        if (title.includes(term)) score += 30;
        if (company.includes(term)) score += 10;
        if (description.includes(term)) score += 16;
        if (skills.includes(term)) score += 14;
      }
      return { job, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ job }) => job);
}

/** Polished generated fallback when no keys / all providers fail. */
function fallbackJobs(query: string, category: string): SearchResultJob[] {
  const safeQuery = (query || 'Ayush healthcare jobs').trim();
  const resolvedCategory = resolveCategoryForQuery(safeQuery, category);
  const tags = deriveSkillTags(safeQuery, category);

  const platforms = [
    { label: 'LinkedIn', source: 'linkedin', url: (k: string) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(k)}&location=India` },
    { label: 'Naukri', source: 'naukri', url: (k: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:naukri.com ${k} jobs`)}` },
    { label: 'Indeed', source: 'indeed', url: (k: string) => `https://in.indeed.com/jobs?q=${encodeURIComponent(k)}&l=India` },
    { label: 'Government Portal', source: 'ncs', url: (k: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:ncs.gov.in ${k} government jobs`)}` },
  ];

  return platforms.map((platform, index) => ({
    id: `fallback-${platform.source}-${index}`,
    title: `${tags[index] || tags[0] || 'Healthcare'} ${index === 0 ? 'Specialist' : index === 1 ? 'Engineer' : index === 2 ? 'Analyst' : 'Advisor'}`,
    company: `${platform.label} Aggregated Listing`,
    location: index % 2 === 0 ? 'India' : 'Remote / Hybrid',
    stipend: '₹35,000 - ₹60,000/mo',
    skills: tags.length > 0 ? tags : ['Healthcare', 'Research', 'Analytics'],
    description: `Search-driven opportunity for ${safeQuery} and related skills across major hiring channels.`,
    source: platform.source,
    category: resolvedCategory,
    external_url: platform.url(safeQuery),
    platform: platform.label,
    created_at: new Date().toISOString(),
  }));
}

export type SearchResponse = { data: SearchResultJob[]; source: 'live' | 'unavailable'; providers: string[] };

/**
 * Run a job search across all configured providers in parallel, merge, dedupe,
 * rank, and return `{ data, source, providers }`. Falls back to generated results
 * when no keys are set or every provider returns nothing.
 */
export async function searchJobs(query: string, category: string = 'All Skills', kind: SearchKind = 'jobs'): Promise<SearchResponse> {
  const safeQuery = (query || 'Ayush healthcare jobs').trim();
  const { enriched } = buildSearchVariants(safeQuery);

  const [jsearch, internships, google, serp] = await Promise.all([
    kind === 'jobs' ? fetchJSearch(enriched) : Promise.resolve(null),
    kind === 'internships' ? fetchInternships(enriched) : Promise.resolve(null),
    kind === 'jobs' ? fetchGoogleSearch(enriched) : Promise.resolve(null),
    kind === 'jobs' ? fetchSerpApi(enriched) : Promise.resolve(null),
  ]);

  const providers: string[] = [];
  if (jsearch?.length) providers.push('jsearch');
  if (internships?.length) providers.push('internships');
  if (google?.length) providers.push('google_search');
  if (serp?.length) providers.push('serpapi');

  const merged = dedupeJobs([
    ...(jsearch ?? []),
    ...(internships ?? []),
    ...(google ?? []),
    ...(serp ?? []),
  ]);

  if (merged.length === 0) return { data: [], source: 'unavailable', providers: [] };

  const ranked = rankJobs(merged, safeQuery).slice(0, 24);
  return { data: ranked, source: 'live', providers };
}
