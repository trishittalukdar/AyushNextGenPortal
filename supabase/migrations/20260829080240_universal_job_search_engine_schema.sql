/*
# Universal job search engine — schema evolution

## Overview
Evolved from Ayush-only to a universal multi-industry job metasearch.
Adds `category` and `external_url` columns to the jobs table, then
reseeds with multi-industry jobs (Tech, Healthcare/Ayush, Core Engineering,
Business/Finance, Government) across external sources (LinkedIn, Indeed,
Glassdoor, Naukri, NCS) plus internal employer posts.

## Changes to existing tables
1. `jobs` — two new columns:
   - `category` text NOT NULL DEFAULT 'Healthcare & Ayush'
     (values: 'Tech/Software', 'Healthcare & Ayush', 'Core Engineering',
      'Business & Finance', 'Government & Public')
   - `external_url` text — nullable, used for external link-out cards
     (LinkedIn/Indeed/Glassdoor/Naukri/NCS redirect URLs with pre-filled search)

## Data changes
1. Truncates applications + jobs + candidates (prototype seed data).
2. Inserts 28 jobs spanning all 5 categories and 5 external sources.
3. Inserts 12 candidates with multi-industry skills and statuses
   ("Shortlisted", "Interview Scheduled", "Under Review").

## Security
- No schema or policy changes — RLS already enabled on all tables.
*/

-- Add new columns (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'category') THEN
    ALTER TABLE jobs ADD COLUMN category text NOT NULL DEFAULT 'Healthcare & Ayush';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'external_url') THEN
    ALTER TABLE jobs ADD COLUMN external_url text;
  END IF;
END $$;

-- Reseed
TRUNCATE TABLE applications, jobs, candidates;

-- =========================================================
-- Universal multi-industry jobs (28 listings)
-- =========================================================
INSERT INTO jobs (title, company, location, stipend, skills, description, source, category, external_url) VALUES
-- Healthcare & Ayush (internal + external)
('Pharmacovigilance Associate', 'Sun Pharma', 'Mumbai, MH', '₹25,000/mo',
  ARRAY['Pharmacovigilance','GCP','ADR Reporting','ICSR'],
  'Monitor adverse drug reactions for ASU&H products, compile safety reports, and support regulatory submissions to NPvCC.', 'linkedin', 'Healthcare & Ayush',
  'https://www.linkedin.com/jobs/search/?keywords=Pharmacovigilance%20Associate%20Mumbai'),
('HPLC Analyst', 'Himalaya Wellness', 'Bengaluru, KA', '₹22,000/mo',
  ARRAY['HPLC','Analytical Chemistry','Method Validation','QC'],
  'Operate HPLC systems, validate analytical methods for herbal extracts, and document results for QA release.', 'naukri', 'Healthcare & Ayush',
  'https://www.naukri.com/hplc-analyst-jobs-in-bengaluru'),
('Panchakarma Therapist', 'Ayush Wellness Centre', 'Pune, MH', '₹18,000/mo',
  ARRAY['Panchakarma','Abhyanga','Basti Therapy','Virechana','Swedana'],
  'Deliver classical Panchakarma therapies including Abhyanga, Basti, Virechana, and Swedana under senior vaidya supervision.', 'ncs', 'Healthcare & Ayush',
  'https://www.ncs.gov.in/jobsearch?keyword=Panchakarma%20Therapist'),
('Clinical Research Coordinator', 'Dabur India', 'Ghaziabad, UP', '₹30,000/mo',
  ARRAY['GCP','NABH','Clinical Trials','Clinical Research Coordination','CDSCO Compliance'],
  'Coordinate AYUSH clinical trial sites, manage regulatory documentation, and audit NABH compliance across study centers.', 'linkedin', 'Healthcare & Ayush',
  'https://www.linkedin.com/jobs/search/?keywords=Clinical%20Research%20Coordinator%20Ghaziabad'),
('Unani Regimental Therapy Specialist', 'Ajmal Khan Tibbiya College', 'Aligarh, UP', '₹20,000/mo',
  ARRAY['Unani Medicine','Hijama (Cupping)','Regimental Therapy','Mizaj Assessment'],
  'Provide Unani regimental therapies including Hijama, Dalak massage, and irrigation therapy with Mizaj assessment.', 'indeed', 'Healthcare & Ayush',
  'https://www.indeed.co.in/jobs?q=Unani%20Therapist&l=Aligarh'),
('Yoga Therapist Intern', 'Morarji Desai Institute', 'Bengaluru, KA', '₹15,000/mo',
  ARRAY['Yoga Therapy','Asana','Pranayama','Stress Management'],
  'Lead therapeutic yoga sessions for diabetes, cardiovascular health, and stress management in a clinical setting.', 'glassdoor', 'Healthcare & Ayush',
  'https://www.glassdoor.co.in/Job/yoga-therapist-jobs-SRCH_KO0,14.htm'),
-- Tech / Software
('Frontend React Developer', 'Razorpay', 'Bengaluru, KA', '₹45,000/mo',
  ARRAY['React','TypeScript','Tailwind CSS','REST API'],
  'Build customer-facing payment dashboards with React 18, TypeScript, and a modern component library.', 'linkedin', 'Tech/Software',
  'https://www.linkedin.com/jobs/search/?keywords=React%20Developer%20Bengaluru'),
('Machine Learning Engineer', 'Swiggy', 'Bengaluru, KA', '₹80,000/mo',
  ARRAY['Python','Machine Learning','PyTorch','NLP','Data Engineering'],
  'Develop recommendation models for food discovery using PyTorch, and deploy ML pipelines to production.', 'indeed', 'Tech/Software',
  'https://www.indeed.co.in/jobs?q=Machine%20Learning%20Engineer&l=Bengaluru'),
('Full Stack Developer', 'Zomato', 'Gurugram, HR', '₹55,000/mo',
  ARRAY['Node.js','React','PostgreSQL','Docker','AWS'],
  'Build and maintain high-traffic backend services and React frontends for the Zomato platform.', 'naukri', 'Tech/Software',
  'https://www.naukri.com/full-stack-developer-jobs-in-gurugram'),
('UX Designer', 'PhonePe', 'Bengaluru, KA', '₹50,000/mo',
  ARRAY['Figma','User Research','Prototyping','Design Systems','Wireframing'],
  'Design intuitive payment flows, conduct user research, and maintain the PhonePe design system.', 'glassdoor', 'Tech/Software',
  'https://www.glassdoor.co.in/Job/ux-designer-jobs-SRCH_KO0,10.htm'),
('Data Analyst', 'Flipkart', 'Bengaluru, KA', '₹40,000/mo',
  ARRAY['SQL','Python','Tableau','Data Visualization','Statistics'],
  'Analyze customer behavior data, build dashboards in Tableau, and drive insights for the retail analytics team.', 'linkedin', 'Tech/Software',
  'https://www.linkedin.com/jobs/search/?keywords=Data%20Analyst%20Flipkart%20Bengaluru'),
('DevOps Engineer', 'Freshworks', 'Chennai, TN', '₹60,000/mo',
  ARRAY['Kubernetes','Docker','CI/CD','Terraform','AWS'],
  'Manage Kubernetes clusters, build CI/CD pipelines, and automate infrastructure provisioning with Terraform.', 'indeed', 'Tech/Software',
  'https://www.indeed.co.in/jobs?q=DevOps%20Engineer&l=Chennai'),
-- Core Engineering
('Mechanical Design Engineer', 'Tata Motors', 'Pune, MH', '₹38,000/mo',
  ARRAY['SolidWorks','AutoCAD','FEA','Mechanical Design','GD&T'],
  'Design automotive components using SolidWorks, perform FEA analysis, and collaborate with manufacturing teams.', 'naukri', 'Core Engineering',
  'https://www.naukri.com/mechanical-design-engineer-jobs-in-pune'),
('Electrical Engineer', 'Siemens India', 'Mumbai, MH', '₹42,000/mo',
  ARRAY['Electrical Design','PLC','SCADA','Power Systems','AutoCAD Electrical'],
  'Design electrical control systems, program PLCs and SCADA, and support commissioning of industrial automation projects.', 'linkedin', 'Core Engineering',
  'https://www.linkedin.com/jobs/search/?keywords=Electrical%20Engineer%20Siemens%20Mumbai'),
('Civil Site Engineer', 'L&T Construction', 'Hyderabad, TS', '₹32,000/mo',
  ARRAY['Site Management','AutoCAD','Structural Analysis','QC','Safety Compliance'],
  'Manage construction site operations, ensure quality control and safety compliance, and coordinate with subcontractors.', 'indeed', 'Core Engineering',
  'https://www.indeed.co.in/jobs?q=Civil%20Site%20Engineer&l=Hyderabad'),
('Chemical Process Engineer', 'Reliance Industries', 'Jamnagar, GJ', '₹44,000/mo',
  ARRAY['Process Design','HYSYS','Heat Transfer','Distillation','Safety'],
  'Optimize petrochemical process units using Aspen HYSYS, perform heat and mass transfer calculations, and ensure plant safety.', 'glassdoor', 'Core Engineering',
  'https://www.glassdoor.co.in/Job/chemical-engineer-jobs-SRCH_KO0,17.htm'),
-- Business & Finance
('Financial Analyst', 'HDFC Bank', 'Mumbai, MH', '₹48,000/mo',
  ARRAY['Financial Modeling','Excel','Valuation','Accounting','Power BI'],
  'Build financial models, perform company valuations, and prepare investment recommendations for the corporate banking division.', 'linkedin', 'Business & Finance',
  'https://www.linkedin.com/jobs/search/?keywords=Financial%20Analyst%20HDFC%20Mumbai'),
('Marketing Associate', 'Nykaa', 'Mumbai, MH', '₹30,000/mo',
  ARRAY['Digital Marketing','SEO','Content Strategy','Social Media','Google Analytics'],
  'Execute digital marketing campaigns, optimize SEO, and create content strategies across social media channels.', 'naukri', 'Business & Finance',
  'https://www.naukri.com/marketing-associate-jobs-in-mumbai'),
('Business Development Manager', 'Paytm', 'Noida, UP', '₹55,000/mo',
  ARRAY['B2B Sales','Negotiation','CRM','Market Research','Strategy'],
  'Drive B2B partnerships, manage enterprise client relationships in CRM, and develop market expansion strategies.', 'indeed', 'Business & Finance',
  'https://www.indeed.co.in/jobs?q=Business%20Development%20Manager&l=Noida'),
('HR Recruiter', 'TCS', 'Chennai, TN', '₹28,000/mo',
  ARRAY['Recruitment','ATS','Interviewing','Onboarding','HR Policies'],
  'Manage end-to-end recruitment, source candidates through ATS, conduct interviews, and handle onboarding for IT roles.', 'glassdoor', 'Business & Finance',
  'https://www.glassdoor.co.in/Job/hr-recruiter-jobs-SRCH_KO0,11.htm'),
-- Government & Public
('Junior Research Fellow (DRDO)', 'DRDO', 'Hyderabad, TS', '₹37,000/mo',
  ARRAY['Research','MATLAB','Signal Processing','Defense Tech','Technical Writing'],
  'Conduct defense research in signal processing, publish technical reports, and support laboratory experiments at DRDO.', 'ncs', 'Government & Public',
  'https://www.ncs.gov.in/jobsearch?keyword=Junior%20Research%20Fellow%20DRDO'),
('Scientist B (ISRO)', 'ISRO', 'Bengaluru, KA', '₹56,000/mo',
  ARRAY['Aerospace','Orbital Mechanics','Python','Satellite Systems','Research'],
  'Contribute to satellite mission design, orbital mechanics analysis, and spacecraft systems engineering at ISRO.', 'ncs', 'Government & Public',
  'https://www.ncs.gov.in/jobsearch?keyword=Scientist%20ISRO'),
('Public Health Officer', 'Ministry of Health & FW', 'New Delhi, DL', '₹45,000/mo',
  ARRAY['Public Health','Epidemiology','Policy Analysis','Data Analysis','Health Programs'],
  'Implement national public health programs, analyze epidemiological data, and support health policy formulation.', 'ncs', 'Government & Public',
  'https://www.ncs.gov.in/jobsearch?keyword=Public%20Health%20Officer'),
('Sub-Inspector (SSC CGL)', 'Staff Selection Commission', 'Pan-India', '₹44,900/mo',
  ARRAY['Law Enforcement','Investigation','Physical Fitness','General Awareness','Reasoning'],
  'Serve as Sub-Inspector in central government paramilitary forces; eligibility via SSC CGL examination.', 'ncs', 'Government & Public',
  'https://www.ncs.gov.in/jobsearch?keyword=Sub%20Inspector%20SSC'),
-- Internal employer-posted jobs (source = employer, no external_url)
('Ayurveda Formulation Scientist', 'Patanjali Ayurved', 'Haridwar, UK', '₹24,000/mo',
  ARRAY['Ayurveda Formulation','GMP','QA','Standardization of ASU Drugs','Bhaishajya Kalpana'],
  'Ensure GMP compliance in Ayurvedic manufacturing, audit batch records, and standardize ASU drug formulations.', 'employer', 'Healthcare & Ayush', NULL),
('Drug Safety Scientist', 'Cipla', 'Goa', '₹35,000/mo',
  ARRAY['Pharmacovigilance','GCP','ICSR','Argus','Signal Detection'],
  'Perform ICSR case processing, signal detection, and periodic safety update reports for ASU&H product portfolio.', 'employer', 'Healthcare & Ayush', NULL),
('Backend Python Developer', 'Zerodha', 'Bengaluru, KA', '₹70,000/mo',
  ARRAY['Python','Django','PostgreSQL','Redis','Kubernetes'],
  'Build high-throughput trading APIs in Django, optimize PostgreSQL queries, and manage Redis caching layers.', 'employer', 'Tech/Software', NULL),
('Product Manager Intern', 'Cred', 'Bengaluru, KA', '₹50,000/mo',
  ARRAY['Product Strategy','Roadmapping','Analytics','User Research','Agile'],
  'Own a product roadmap, conduct user research, and drive feature launches for credit card management features.', 'employer', 'Business & Finance', NULL);

-- =========================================================
-- Expanded candidates (12 multi-industry profiles)
-- =========================================================
INSERT INTO candidates (name, institution, asq_score, clinical_hours, skills, status) VALUES
('Trishit Talukdar', 'Ayush Stream Academy', 88, 140,
  ARRAY['HPLC','Pharmacovigilance','GCP','Panchakarma','Analytical Chemistry','ADR Reporting','Clinical Trials'], 'Shortlisted'),
('Ananya Sharma', 'National Institute of Ayurveda, Jaipur', 92, 165,
  ARRAY['Panchakarma','Abhyanga','Shirodhara','Ayurveda Formulation','NABH','Nadi Pariksha'], 'Interview Scheduled'),
('Rahul Verma', 'IIT Bombay', 85, 78,
  ARRAY['React','TypeScript','Node.js','Python','Machine Learning','Docker'], 'Shortlisted'),
('Priya Nair', 'SDMCA Udupi', 90, 158,
  ARRAY['Yoga Therapy','Asana','Pranayama','GCP','NABH','Naturopathy'], 'Interview Scheduled'),
('Karan Mehta', 'NIT Surat', 81, 60,
  ARRAY['SolidWorks','AutoCAD','FEA','Mechanical Design','GD&T'], 'Under Review'),
('Sneha Iyer', 'MMC Pharmacy College, Chennai', 85, 132,
  ARRAY['Pharmacovigilance','ICSR','Argus','Signal Detection','ADR Reporting'], 'Shortlisted'),
('Arjun Reddy', 'NIA Jaipur', 79, 88,
  ARRAY['Panchakarma','Abhyanga','Basti Therapy','Virechana','Swedana'], 'Under Review'),
('Divya Gupta', 'IIT Delhi', 87, 72,
  ARRAY['Python','Machine Learning','PyTorch','SQL','Data Visualization'], 'Interview Scheduled'),
('Mohammed Faizan', 'Ajmal Khan Tibbiya College, AMU', 83, 120,
  ARRAY['Unani Medicine','Hijama (Cupping)','Regimental Therapy','Mizaj Assessment'], 'Shortlisted'),
('Lakshmi Sundaram', 'National Institute of Siddha, Chennai', 84, 115,
  ARRAY['Siddha Medicine','Varma Therapy','Siddha Pharmacology','Herbal Pharmacology'], 'Under Review'),
('Aditya Joshi', 'IIM Bangalore', 89, 45,
  ARRAY['Financial Modeling','Excel','Valuation','Strategy','Market Research'], 'Interview Scheduled'),
('Vikram Singh', 'Jindal Naturopathy Institute, Bengaluru', 86, 130,
  ARRAY['Naturopathy','Hydrotherapy','Mud Therapy','Diet & Nutrition Therapy','Yoga Therapy'], 'Shortlisted');
