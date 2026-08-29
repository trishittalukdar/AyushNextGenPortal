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

export function deriveSkillTags(query: string, category: string = 'All Skills'): string[] {
  const cleaned = normalizeText(query || 'Ayush healthcare jobs');
  const directTerms = cleaned
    .split(' ')
    .filter((word) => word.length > 2 && !new Set(['the', 'and', 'for', 'with', 'jobs', 'job', 'role', 'work', 'open', 'apply', 'opportunity', 'careers', 'career', 'in', 'at', 'on', 'of', 'to', 'from', 'any', 'skill', 'search', 'portal', 'vacancy', 'vacancies']).has(word));

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

export function resolveCategoryForQuery(query: string, selectedCategory: string): string {
  const normalized = normalizeText(query);
  if (selectedCategory && selectedCategory !== 'All Skills') {
    if (selectedCategory === 'AYUSH & Medicine') return 'Healthcare & Ayush';
    if (selectedCategory === 'Software & AI') return 'Tech/Software';
    if (selectedCategory === 'Core Engineering') return 'Core Engineering';
    if (selectedCategory === 'Clinical Research') return 'Healthcare & Ayush';
    if (selectedCategory === 'Government') return 'Government & Public';
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
    description: `Search-driven opportunity for ${safeQuery} and related skills across major hiring channels, with direct access to ${platform.label} results.`,
    source: platform.source,
    category: resolvedCategory,
    external_url: platform.urlBuilder(safeQuery),
    platform: platform.label,
    created_at: new Date().toISOString(),
  }));
}

function textValue(job: RapidApiJob, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = job[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return fallback;
}

function listValue(job: RapidApiJob, keys: string[], fallback: string[]): string[] {
  for (const key of keys) {
    const value = job[key];
    if (Array.isArray(value)) {
      const items = value.filter((item): item is string => typeof item === 'string' && item.trim()).map((item) => item.trim());
      if (items.length > 0) return items;
    }
    if (typeof value === 'string' && value.trim()) return value.split(/[,|]/).map((item) => item.trim()).filter(Boolean);
  }
  return fallback;
}

function normalizeRapidApiJobs(payload: unknown, source: string, platform: string, query: string, category: string): SearchResultJob[] {
  if (!payload || typeof payload !== 'object') return [];
  const data = (payload as { data?: unknown; jobs?: unknown; results?: unknown });
  const rows = [data.data, data.jobs, data.results].find(Array.isArray);
  if (!rows) return [];

  return (rows as RapidApiJob[]).map((job, index) => {
    const resultSource = textValue(job, ['__source'], source);
    const resultPlatform = resultSource === 'internships' ? 'Internships API' : resultSource === 'jsearch' ? 'JSearch' : platform;
    const title = textValue(job, ['job_title', 'title', 'jobTitle', 'position'], 'Open Opportunity');
    const company = textValue(job, ['employer_name', 'company_name', 'company', 'employer'], 'Hiring Partner');
    const location = textValue(job, ['job_location', 'location', 'job_city', 'city'], 'India');
    const description = textValue(job, ['job_description', 'description', 'summary'], `Opportunity for ${query}.`);
    const skills = listValue(job, ['job_required_skills', 'skills', 'skill_set', 'technologies'], [query, 'Healthcare']);
    return {
      id: textValue(job, ['job_id', 'id', 'internship_id'], `${source}-${index}-${title}`),
      title,
      company,
      location,
      stipend: textValue(job, ['salary', 'stipend', 'salary_range', 'job_salary'], 'Competitive / Standard'),
      skills,
      description: description.length > 220 ? `${description.slice(0, 220)}...` : description,
      source: resultSource,
      category: resolveCategoryForQuery(query, category),
      external_url: textValue(job, ['job_apply_link', 'apply_link', 'url', 'link'], `https://www.google.com/search?q=${encodeURIComponent(`${title} ${company}`)}`),
      platform: resultPlatform,
      created_at: new Date().toISOString(),
    };
  });
}

export async function searchJobsLive(query: string, category: string = 'All Skills', signal?: AbortSignal): Promise<SearchResultJob[]> {
  const safeQuery = (query || 'Ayush healthcare jobs').trim();
  const response = await fetch(`/api/jobs?query=${encodeURIComponent(safeQuery)}`, { signal });
  if (!response.ok) return searchJobs(safeQuery, category, 4);

  const payload = await response.json();
  const liveJobs = normalizeRapidApiJobs(payload, 'aggregated', 'RapidAPI Jobs', safeQuery, category);
  return liveJobs.length > 0 ? liveJobs.slice(0, 8) : searchJobs(safeQuery, category, 4);
}