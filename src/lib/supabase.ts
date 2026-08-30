import { createClient } from '@supabase/supabase-js';

const getAppBaseUrl = () => {
  const envUrl = import.meta.env.VITE_APP_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return 'http://localhost:5173';
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

export const APP_BASE_URL = getAppBaseUrl();
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseAnonKey) : null;

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  stipend: string;
  skills: string[];
  description: string;
  source: string;
  category: string;
  external_url: string | null;
  created_at: string;
};

export type Candidate = {
  id: string;
  name: string;
  institution: string;
  asq_score: number;
  clinical_hours: number;
  skills: string[];
  status: string;
  created_at: string;
};

export type Application = {
  id: string;
  job_id: string;
  applicant_name: string;
  asq_fit: number;
  created_at: string;
};

export type CheckIn = {
  id: string;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  hours_added: number;
  verified: boolean;
  created_at: string;
};

export const FALLBACK_JOBS: Job[] = [
  {
    id: 'job-demo-1',
    title: 'Clinical Research Analyst',
    company: 'Ayush BioMed Labs',
    location: 'Bengaluru, Karnataka',
    stipend: '₹35,000/mo',
    skills: ['Clinical Research', 'Data Analysis', 'HPLC'],
    description: 'Support trial monitoring and data validation for AYUSH formulations.',
    source: 'employer',
    category: 'Healthcare & Ayush',
    external_url: null,
    created_at: '2026-08-01T12:00:00.000Z',
  },
  {
    id: 'job-demo-2',
    title: 'Frontend React Developer',
    company: 'RitualTech India',
    location: 'Hyderabad, Telangana',
    stipend: '₹48,000/mo',
    skills: ['React', 'TypeScript', 'Accessibility'],
    description: 'Build user-facing dashboards for healthcare and education products.',
    source: 'employer',
    category: 'Tech/Software',
    external_url: null,
    created_at: '2026-08-05T12:00:00.000Z',
  },
  {
    id: 'job-demo-3',
    title: 'Ayurveda Product Specialist',
    company: 'Nisarga Wellness',
    location: 'Pune, Maharashtra',
    stipend: '₹30,000/mo',
    skills: ['Ayurveda', 'Product Marketing', 'Consumer Health'],
    description: 'Support market expansion for research-backed wellness products.',
    source: 'linkedin',
    category: 'Healthcare & Ayush',
    external_url: 'https://example.com/jobs/ayurveda-product-specialist',
    created_at: '2026-08-12T12:00:00.000Z',
  },
];

export const FALLBACK_CANDIDATES: Candidate[] = [
  {
    id: 'cand-demo-1',
    name: 'Aarav Sharma',
    institution: 'Ayush Stream Academy',
    asq_score: 92,
    clinical_hours: 170,
    skills: ['HPLC', 'Clinical Research', 'Data Analysis'],
    status: 'Shortlisted',
    created_at: '2026-08-10T08:30:00.000Z',
  },
  {
    id: 'cand-demo-2',
    name: 'Meera Nair',
    institution: 'BAMS Centre for Excellence',
    asq_score: 88,
    clinical_hours: 152,
    skills: ['Ayurveda', 'Patient Care', 'Research'],
    status: 'Interviewing',
    created_at: '2026-08-11T10:15:00.000Z',
  },
];

export const FALLBACK_CHECKINS: CheckIn[] = [
  {
    id: 'checkin-demo-1',
    location_name: 'Accredited Practical Training Centre',
    latitude: 12.9716,
    longitude: 77.5946,
    hours_added: 4,
    verified: true,
    created_at: '2026-08-20T09:00:00.000Z',
  },
];
