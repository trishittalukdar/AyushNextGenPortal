import { ALL_SKILLS } from '@/lib/skills';

export type SearchCategory =
  | 'All Skills'
  | 'AYUSH & Medicine'
  | 'Software & AI'
  | 'Core Engineering'
  | 'Clinical Research'
  | 'Government';

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

type RapidApiJob = Record<string, unknown>;

const SEARCH_SKILLS: Record<SearchCategory, string[]> = {
  'All Skills': ['Ayush', 'Healthcare', 'Research', 'Software', 'AI', 'Data', 'Engineering'],
  'AYUSH & Medicine': ['Ayurveda', 'Panchakarma', 'Ayush', 'Pharmacovigilance', 'NABH'],
  'Software & AI': ['React', 'Python', 'Machine Learning', 'AI', 'TypeScript', 'UX Design'],
  'Core Engineering': ['Mechanical Design', 'PLC', 'SCADA', 'AutoCAD', 'SolidWorks'],
  'Clinical Research': ['Clinical Trials', 'GCP', 'NABH', 'Pharmacovigilance', 'HPLC'],
  Government: ['Public Health', 'Policy Analysis', 'Epidemiology', 'NCS', 'Public Sector'],
};

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

function levenshteinDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[a.length][b.length];
}

function fuzzyCorrection(token: string, candidates: string[]): string[] {
  const normalizedToken = token.toLowerCase();
  const matches = new Set<string>();

  for (const candidate of candidates) {
    const value = candidate.toLowerCase();
    if (!value) continue;
    if (normalizedToken === value || value.includes(normalizedToken) || normalizedToken.includes(value)) {
      matches.add(candidate);
      continue;
    }

    const maxAllowed = Math.max(1, Math.ceil(value.length * 0.35));
    if (levenshteinDistance(normalizedToken, value) <= maxAllowed) {
      matches.add(candidate);
    }
  }

  return Array.from(matches);
}

function expandSearchTokens(query: string): string[] {
  const cleaned = normalizeText(query || 'Ayush healthcare jobs');
  const tokens = cleaned.split(/\s+/).filter((word) => word.length > 2 && !new Set(['the', 'and', 'for', 'with', 'jobs', 'job', 'role', 'work', 'open', 'apply', 'opportunity', 'careers', 'career', 'in', 'at', 'on', 'of', 'to', 'from', 'any', 'skill', 'search', 'portal', 'vacancy', 'vacancies']).has(word));
  const synonymMap: Record<string, string[]> = {
    'aiml': ['artificial intelligence', 'machine learning', 'ai', 'ml'],
    'ai': ['artificial intelligence', 'machine learning', 'ml'],
    'ml': ['machine learning', 'ai'],
    'machine': ['machine learning', 'ai'],
    'learning': ['machine learning', 'ai'],
    'data': ['data science', 'analytics', 'business intelligence'],
    'research': ['clinical research', 'research analyst', 'pharmacovigilance'],
    'ayush': ['ayurveda', 'panchakarma', 'natural medicine', 'wellness'],
    'healthcare': ['clinical research', 'hospital operations', 'public health'],
    'developer': ['software engineer', 'developer'],
    'engineer': ['software engineer', 'machine learning engineer', 'data engineer'],
    'analyst': ['data analyst', 'business analyst', 'research analyst'],
    'therapist': ['panchakarma therapist', 'ayurveda therapist', 'rehab therapist'],
    'officer': ['medical officer', 'operations officer', 'public health officer'],
  };

  const candidatePool = new Set<string>([
    ...ALL_SKILLS.map((skill) => skill.toLowerCase()),
    ...Object.keys(synonymMap),
    ...Object.values(synonymMap).flat(),
    'ai', 'machine learning', 'python', 'react', 'developer', 'engineer', 'research', 'clinical', 'analyst', 'medical officer', 'ayurveda', 'panchakarma', 'healthcare', 'pharmacovigilance', 'data scientist', 'frontend', 'product', 'quality', 'public health', 'operations', 'assistant'
  ]);

  const expanded = new Set<string>(tokens);
  for (const token of tokens) {
    const synonyms = synonymMap[token] ?? [];
    synonyms.forEach((synonym) => expanded.add(synonym));

    fuzzyCorrection(token, Array.from(candidatePool)).forEach((match) => expanded.add(match));
  }

  return Array.from(expanded).slice(0, 8);
}

export function deriveSkillTags(query: string, category: string = 'All Skills'): string[] {
  const cleaned = normalizeText(query || 'Ayush healthcare jobs');
  const directTerms = expandSearchTokens(cleaned);

  const categorySkills = SEARCH_SKILLS[(category as SearchCategory) ?? 'All Skills'] ?? SEARCH_SKILLS['All Skills'];
  const merged = [...directTerms, ...categorySkills, ...ALL_SKILLS];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of merged) {
    const formatted = titleCase(item.trim());
    if (!formatted || seen.has(formatted.toLowerCase())) continue;
    seen.add(formatted.toLowerCase());
    result.push(formatted);
    if (result.length >= 8) break;
  }

  return result.length > 0 ? result : ['Healthcare', 'Research', 'Analytics', 'AI', 'Clinical Research'];
}

export function buildRecommendationSuggestions(query: string, category: string = 'All Skills'): string[] {
  const cleaned = (query || '').trim();
  const normalized = cleaned.toLowerCase();
  const baseSuggestions = new Set<string>([
    ...deriveSkillTags(cleaned || 'Ayush healthcare jobs', category),
    ...SEARCH_SKILLS[(category as SearchCategory) ?? 'All Skills'],
  ]);

  const roleRules: Record<string, string[]> = {
    'aiml': ['AI/ML Engineer', 'Machine Learning Engineer', 'Data Scientist', 'ML Ops Engineer'],
    'ai': ['AI/ML Engineer', 'Computer Vision Engineer', 'NLP Engineer', 'AI Product Analyst'],
    'ml': ['Machine Learning Engineer', 'ML Researcher', 'AI Engineer', 'Data Scientist'],
    'python': ['Python Developer', 'Python Data Engineer', 'Python Analyst', 'Back End Engineer'],
    'react': ['React Developer', 'Frontend Engineer', 'UI Engineer', 'Product Engineer'],
    'clinical research': ['Clinical Research Associate', 'Clinical Trial Coordinator', 'Pharmacovigilance Analyst', 'Research Scientist'],
    'ayurveda': ['Ayurveda Product Specialist', 'Panchakarma Therapist', 'Ayush Consultant', 'Ayurvedic Medical Officer'],
    'healthcare': ['Healthcare Analyst', 'Clinical Operations Executive', 'Public Health Specialist', 'Patient Care Coordinator'],
    'data': ['Data Analyst', 'BI Analyst', 'Analytics Engineer', 'Research Analyst'],
    'ux': ['UX Designer', 'Product Designer', 'Research Designer', 'Interaction Designer'],
    'government': ['Government Policy Analyst', 'Public Health Officer', 'Project Coordinator', 'E-Governance Specialist'],
  };

  for (const [matcher, suggestions] of Object.entries(roleRules)) {
    if (normalized.includes(matcher)) {
      suggestions.forEach((item) => baseSuggestions.add(item));
    }
  }

  if (cleaned) {
    baseSuggestions.add(cleaned);
    const words = cleaned.split(/\s+/).filter(Boolean);
    words.forEach((word) => {
      if (word.length > 2) baseSuggestions.add(titleCase(word));
    });
  }

  return Array.from(baseSuggestions).filter(Boolean).slice(0, 10);
}

export function resolveCategoryForQuery(query: string, selectedCategory: string): string {
  const normalized = normalizeText(query);
  if (selectedCategory && selectedCategory !== 'All Skills') {
    if (selectedCategory === 'AYUSH & Medicine') return 'Healthcare & Ayush';
    if (selectedCategory === 'Software & AI') return 'Tech/Software';
    if (selectedCategory === 'Core Engineering') return 'Core Engineering';
    if (selectedCategory === 'Clinical Research') return 'Healthcare & Ayush';
    if (selectedCategory === 'Government') return 'Government & Public';
  }

  if (/(aiml|ai ml|artificial intelligence|machine learning|ml|deep learning|computer vision|nlp|data science|python)/.test(normalized)) {
    return 'Tech/Software';
  }
  if (/(ayurveda|panchakarma|naturopathy|yoga|unani|homeopathy|medicine|healthcare|clinical|hplc|pharmacovigilance|gcp|nabh|research)/.test(normalized)) {
    return 'Healthcare & Ayush';
  }
  if (/(react|python|ml|ai|data|software|typescript|developer|design|ux|cloud|aws|sql|machine learning)/.test(normalized)) {
    return 'Tech/Software';
  }
  if (/(solidworks|cad|plc|scada|mechanical|electrical|engineering|design|process)/.test(normalized)) {
    return 'Core Engineering';
  }
  if (/(government|policy|public health|epidemiology|ncs|public sector|digital governance)/.test(normalized)) {
    return 'Government & Public';
  }
  return 'Tech/Software';
}

function overlapScore(text: string, terms: string[]): number {
  const normalized = text.toLowerCase();
  return terms.reduce((total, term) => {
    if (!term) return total;
    return total + (normalized.includes(term.toLowerCase()) ? 1 : 0);
  }, 0);
}

function semanticBoost(query: string, job: SearchResultJob): number {
  const terms = expandSearchTokens(query).map((term) => term.toLowerCase());
  const compactTerms = new Set(terms.filter(Boolean));
  if (!compactTerms.size) return 0;

  const title = job.title.toLowerCase();
  const desc = `${job.description} ${job.company} ${(job.skills ?? []).join(' ')}`.toLowerCase();

  let boost = 0;
  for (const term of compactTerms) {
    if (title.includes(term)) boost += 6;
    if (desc.includes(term)) boost += 2;
    if (term.includes('machine') && (title.includes('ml') || title.includes('ai') || title.includes('data'))) boost += 3;
    if (term.includes('artificial') && (title.includes('ai') || title.includes('machine'))) boost += 3;
    if ((job.skills ?? []).some((skill) => skill.toLowerCase().includes(term))) boost += 5;
  }

  return boost + overlapScore(`${job.title} ${job.description} ${(job.skills ?? []).join(' ')}`.toLowerCase(), Array.from(compactTerms));
}

function scoreQueryMatch(job: SearchResultJob, query: string): number {
  const text = [job.title, job.company, job.description, job.category, ...(job.skills ?? [])].join(' ').toLowerCase();
  const expanded = expandSearchTokens(query).map((item) => item.toLowerCase());
  const terms = new Set(expanded);

  if (!terms.size) return 1;

  let score = 0;
  for (const term of terms) {
    if (!term) continue;
    if (text.includes(term)) score += 3;
    if (job.title.toLowerCase().includes(term)) score += 5;
    if (job.company.toLowerCase().includes(term)) score += 2;
    if ((job.skills ?? []).some((skill) => skill.toLowerCase().includes(term))) score += 4;
  }

  return score + semanticBoost(query, job);
}

export function searchJobs(query: string, category: string = 'All Skills', limit = 4): SearchResultJob[] {
  const safeQuery = (query || 'Ayush healthcare jobs').trim();
  const resolvedCategory = resolveCategoryForQuery(safeQuery, category);
  const tags = deriveSkillTags(safeQuery, category);

  const PLATFORM_TARGETS = [
    { name: 'LinkedIn', label: 'LinkedIn', source: 'linkedin', urlBuilder: (k: string) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(k)}&location=India` },
    { name: 'Naukri', label: 'Naukri', source: 'naukri', urlBuilder: (k: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:naukri.com ${k} jobs`)}` },
    { name: 'Indeed', label: 'Indeed', source: 'indeed', urlBuilder: (k: string) => `https://in.indeed.com/jobs?q=${encodeURIComponent(k)}&l=India` },
    { name: 'Government Portal', label: 'Government Portal', source: 'ncs', urlBuilder: (k: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:ncs.gov.in ${k} government jobs`)}` },
  ];

  return PLATFORM_TARGETS.slice(0, limit).map((platform, index) => ({
    id: `search-${platform.source}-${index}`,
    title: `${tags[index] || tags[0] || 'Healthcare'} ${index === 0 ? 'Specialist' : index === 1 ? 'Engineer' : index === 2 ? 'Analyst' : 'Advisor'}`,
    company: `${platform.label} Aggregated Listing`,
    location: index % 2 === 0 ? 'India' : 'Remote / Hybrid',
    stipend: '₹35,000 - ₹60,000/mo',
    skills: tags.length > 0 ? tags : ['Healthcare', 'Research', 'Analytics'],
    description: `Search-driven opportunity for ${safeQuery} and related skills across major hiring channels.`,
    source: platform.source,
    category: resolvedCategory,
    external_url: '',
    platform: platform.label,
    created_at: new Date().toISOString(),
  }));
}

function textValue(job: RapidApiJob, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = job[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return fallback;
}

function isDirectJobLink(value: string): boolean {
  const link = value.trim();
  if (!link || !/^https?:\/\//i.test(link)) return false;

  try {
    const url = new URL(link);
    const pathname = url.pathname.toLowerCase();
    const hasSearchParams = url.searchParams.has('q') || url.searchParams.has('keywords') || url.searchParams.has('query') || url.searchParams.has('search') || url.searchParams.has('text');
    return !pathname.includes('/search') && !pathname.includes('/jobs/search') && !pathname.includes('/jobs/search/') && !hasSearchParams;
  } catch {
    return false;
  }
}

function directJobLink(job: RapidApiJob): string {
  const candidates = [
    textValue(job, ['job_apply_link', 'apply_link', 'job_url', 'url', 'link', 'page_url', 'job_post_url'], ''),
    textValue(job, ['job_apply_link', 'apply_link', 'url', 'link', 'page_url', 'job_post_url'], ''),
  ];

  for (const candidate of candidates) {
    if (candidate && isDirectJobLink(candidate)) return candidate;
  }

  return '';
}

function listValue(job: RapidApiJob, keys: string[], fallback: string[]): string[] {
  for (const key of keys) {
    const value = job[key];
    if (Array.isArray(value)) {
      const items = value
        .map((item) => (typeof item === 'string' ? item.trim() : typeof item === 'object' && item && 'name' in item && typeof item.name === 'string' ? item.name.trim() : ''))
        .filter(Boolean);
      if (items.length > 0) return items;
    }
    if (typeof value === 'string' && value.trim()) return value.split(/[,|]/).map((item) => item.trim()).filter(Boolean);
  }
  return fallback;
}

function normalizeJSearchJobs(payload: unknown, query: string, category: string): SearchResultJob[] {
  if (!payload || typeof payload !== 'object') return [];
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];

  return (data as RapidApiJob[]).map((job, index) => {
    const title = textValue(job, ['job_title', 'title', 'position'], 'Open Opportunity');
    const company = textValue(job, ['employer_name', 'company_name', 'company', 'employer'], 'Hiring Partner');
    const location = textValue(job, ['job_city', 'job_location', 'location', 'city', 'country'], 'India');
    const description = textValue(job, ['job_description', 'description', 'summary', 'snippet'], `Opportunity for ${query}.`);
    const publisher = textValue(job, ['publisher_name', 'job_publisher', 'publisher', 'source'], 'JSearch');
    const skills = listValue(job, ['job_required_skills', 'skills', 'skill_set', 'technologies'], [query, 'Healthcare']);
    const applyLink = directJobLink(job);

    return {
      id: textValue(job, ['job_id', 'id', 'position_id'], `${publisher}-${index}-${title}`),
      title,
      company,
      location,
      stipend: textValue(job, ['salary', 'stipend', 'salary_range', 'job_salary'], 'Competitive / Standard'),
      skills,
      description: description.length > 220 ? `${description.slice(0, 220)}...` : description,
      source: publisher.toLowerCase().replace(/\s+/g, '-'),
      category: resolveCategoryForQuery(query, category),
      external_url: applyLink,
      platform: publisher || 'JSearch',
      created_at: new Date().toISOString(),
    };
  });
}

export async function searchJobsLive(query: string, category: string = 'All Skills', signal?: AbortSignal): Promise<SearchResultJob[]> {
  const safeQuery = (query || 'Ayush healthcare jobs').trim();
  const searchTerms = expandSearchTokens(safeQuery).join(' ');
  const enrichedQuery = searchTerms || safeQuery;
  const rapidApiKey = (import.meta.env.VITE_RAPIDAPI_KEY ?? '').trim();

  if (!rapidApiKey) {
    return searchJobs(safeQuery, category, 4);
  }

  try {
    const url = new URL('https://jsearch.p.rapidapi.com/search');
    url.searchParams.set('query', enrichedQuery);
    url.searchParams.set('page', '1');
    url.searchParams.set('num_pages', '1');
    url.searchParams.set('country', 'in');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
        'Content-Type': 'application/json',
      },
      signal,
    });

    if (!response.ok) {
      return searchJobs(safeQuery, category, 4);
    }

    const payload = await response.json();
    const liveJobs = normalizeJSearchJobs(payload, safeQuery, category);

    if (liveJobs.length === 0) {
      return searchJobs(safeQuery, category, 4);
    }

    const scoredJobs = liveJobs
      .map((job) => ({ job, score: scoreQueryMatch(job, safeQuery) }))
      .sort((a, b) => b.score - a.score)
      .map(({ job }) => job)
      .slice(0, 8);

    return scoredJobs.length > 0 ? scoredJobs : searchJobs(safeQuery, category, 4);
  } catch {
    return searchJobs(safeQuery, category, 4);
  }
}