import type { Job } from './supabase';

/** Trishit's verified skills across multiple domains */
const studentSkills = [
  'HPLC',
  'Pharmacovigilance',
  'GCP',
  'Panchakarma',
  'Abhyanga',
  'NABH',
  'QA',
  'Analytical Chemistry',
  'ADR Reporting',
  'Clinical Trials',
  'Ayurveda Formulation',
  'Yoga Therapy',
  'React',
  'TypeScript',
  'Python',
  'Machine Learning',
  'SQL',
  'Data Visualization',
];

/**
 * Calculate Skill Match Percentage between a job's required skills and the student's skills.
 * Uses fuzzy matching so e.g. "GCP" matches "GCP Guidelines".
 * Returns a percentage (0-100) based on skill coverage.
 */
export function calculateAsqFit(job: Job, skillMatchIndex = 100, clinicalHours = 500): number {
  const required = (job.skills ?? []).map((s) => s.toLowerCase());
  const have = studentSkills.map((s) => s.toLowerCase());
  const matched = required.filter((r) =>
    have.some((h) => h.includes(r) || r.includes(h) || h === r)
  );
  const coverage = required.length === 0 ? 0.5 : matched.length / required.length;
  const skillsCoverage = coverage * 90 + 10;
  const clinicalExperience = Math.min(100, (clinicalHours / 500) * 100);
  return Math.round(Math.min(100, skillsCoverage * 0.6 + skillMatchIndex * 0.3 + clinicalExperience * 0.1));
}

export const STUDENT_SKILLS = studentSkills;
