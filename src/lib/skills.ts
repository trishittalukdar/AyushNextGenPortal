/**
 * Comprehensive multi-industry skill taxonomy — organized by sector.
 * Covers AYUSH + Pharma, Tech/Software, Core Engineering, Business & Finance,
 * and Government/Public sector skills.
 */

export const SKILL_CATEGORIES = [
  {
    name: 'Pharma & Quality',
    color: 'emerald',
    skills: [
      'HPLC', 'Analytical Chemistry', 'Method Validation', 'GMP', 'QA', 'QC',
      'Stability Studies', 'Raw Material Testing', 'WHO-GMP Certification',
      'COPP Documentation', 'Pharmaceutical Formulation', 'Standardization of ASU Drugs',
    ],
  },
  {
    name: 'Pharmacovigilance & Safety',
    color: 'red',
    skills: [
      'Pharmacovigilance', 'ADR Reporting', 'ICSR', 'Argus', 'Signal Detection',
      'Drug Safety', 'ASU&H Pharmacovigilance', 'NPvCC Reporting',
      'Periodic Safety Update Reports',
    ],
  },
  {
    name: 'Clinical Research',
    color: 'blue',
    skills: [
      'GCP', 'NABH', 'Clinical Trials', 'Clinical Research Coordination',
      'Trial Monitoring', 'Regulatory Affairs', 'CDSCO Compliance',
      'Informed Consent Process', 'Case Report Forms', 'CPACR Certification',
    ],
  },
  {
    name: 'Ayurveda & Panchakarma',
    color: 'teal',
    skills: [
      'Panchakarma', 'Abhyanga', 'Shirodhara', 'Basti Therapy', 'Virechana',
      'Vamana', 'Nasya', 'Raktamokshana', 'Swedana', 'Ayurveda Formulation',
      'Nadi Pariksha', 'Dosha Assessment', 'Herbal Pharmacology', 'Rasa Shastra',
      'Bhaishajya Kalpana',
    ],
  },
  {
    name: 'Yoga & Naturopathy',
    color: 'cyan',
    skills: [
      'Yoga Therapy', 'Asana', 'Pranayama', 'Meditation', 'Mudra', 'Bandha',
      'Stress Management', 'Lifestyle Disorder Management', 'Yoga for Diabetes',
      'Naturopathy', 'Hydrotherapy', 'Mud Therapy', 'Diet & Nutrition Therapy',
    ],
  },
  {
    name: 'Unani Medicine',
    color: 'amber',
    skills: [
      'Unani Medicine', 'Hijama (Cupping)', 'Regimental Therapy', 'Dalak (Massage)',
      'Mizaj Assessment', 'Cupping Therapy',
    ],
  },
  {
    name: 'Siddha & Homeopathy',
    color: 'violet',
    skills: [
      'Siddha Medicine', 'Varma Therapy', 'Siddha Pharmacology', 'Homeopathy',
      'Repertory', 'Miasmatic Assessment', 'Potentization', 'Constitutional Prescribing',
    ],
  },
  {
    name: 'Tech & Software',
    color: 'indigo',
    skills: [
      'React', 'TypeScript', 'Node.js', 'Python', 'Django', 'PostgreSQL',
      'Docker', 'Kubernetes', 'AWS', 'Machine Learning', 'PyTorch', 'NLP',
      'Data Engineering', 'SQL', 'Redis', 'CI/CD', 'Terraform', 'REST API',
      'Tailwind CSS', 'Figma', 'Data Visualization', 'Tableau', 'Statistics',
    ],
  },
  {
    name: 'Core Engineering',
    color: 'orange',
    skills: [
      'SolidWorks', 'AutoCAD', 'FEA', 'Mechanical Design', 'GD&T',
      'Electrical Design', 'PLC', 'SCADA', 'Power Systems',
      'Site Management', 'Structural Analysis', 'Process Design',
      'HYSYS', 'Heat Transfer', 'Distillation',
    ],
  },
  {
    name: 'Business & Finance',
    color: 'rose',
    skills: [
      'Financial Modeling', 'Excel', 'Valuation', 'Accounting', 'Power BI',
      'Digital Marketing', 'SEO', 'Content Strategy', 'Social Media',
      'Google Analytics', 'B2B Sales', 'Negotiation', 'CRM', 'Market Research',
      'Product Strategy', 'Roadmapping', 'Agile', 'Recruitment', 'ATS', 'Onboarding',
    ],
  },
  {
    name: 'Government & Public',
    color: 'slate',
    skills: [
      'Public Health', 'Epidemiology', 'Policy Analysis', 'Health Programs',
      'Research', 'MATLAB', 'Signal Processing', 'Defense Tech', 'Technical Writing',
      'Aerospace', 'Orbital Mechanics', 'Satellite Systems', 'Law Enforcement',
      'Investigation', 'Physical Fitness', 'General Awareness', 'Reasoning',
    ],
  },
  {
    name: 'Hospital & Management',
    color: 'emerald',
    skills: [
      'Hospital Management', 'NABH Accreditation', 'Patient Safety',
      'Healthcare Quality', 'Medical Records Management', 'Infection Control',
      'Telemedicine', 'Health Informatics', 'Supply Chain Management',
      'Regulatory Documentation',
    ],
  },
];

/** Flat list of all skills for quick lookups */
export const ALL_SKILLS: string[] = SKILL_CATEGORIES.flatMap((c) => c.skills);

/** Quick-pick skill suggestions for the employer form */
export const SKILL_SUGGESTIONS: string[] = ALL_SKILLS;

/** Popular search filter chips for the student hub */
export const SEARCH_CHIPS: string[] = [
  'React', 'HPLC', 'Pharmacovigilance', 'Panchakarma', 'Machine Learning',
  'UX Design', 'GCP', 'NABH', 'Financial Modeling', 'SolidWorks',
  'Yoga Therapy', 'Data Analyst', 'Python', 'Unani Medicine', 'Digital Marketing',
];

/** Job categories for filtering and employer form dropdown */
export const JOB_CATEGORIES = [
  'All Fields',
  'Tech/Software',
  'Healthcare & Ayush',
  'Core Engineering',
  'Business & Finance',
  'Government & Public',
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];
