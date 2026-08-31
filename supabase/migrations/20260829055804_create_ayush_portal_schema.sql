/*
# Ayush NextGen Portal — initial schema

## Overview
Creates the data layer for the Ministry of Ayush NextGen Portal prototype:
a skill-based job aggregator connecting Ayush academia with industry.

## New Tables
1. `jobs` — Aggregated and employer-posted internships/jobs.
   - title, company, location, stipend, skills (text[]), description, source
   - source distinguishes aggregated listings (linkedin / naukri / ncs) from
     employer-published posts (employer).
2. `candidates` — Candidate profiles for the ASQ ranking table.
   - name, institution, asq_score, clinical_hours, skills (text[]), status
3. `applications` — Quick-apply records linking a student to a job.
   - job_id (FK to jobs), applicant_name, asq_fit
4. `clinical_checkins` — GPS observership check-in records.
   - location_name, latitude, longitude, hours_added, verified, created_at

## Security
- RLS enabled on every table.
- No sign-in screen in this prototype → all CRUD open to anon + authenticated
  (intentionally public/shared single-tenant data).
- Policies documented per table.

## Notes
1. Seed data (aggregated jobs, candidates) is inserted so the dashboards are
   populated on first load.
2. All timestamps default to now().
3. Skills stored as text[] for clean tag handling.
*/

-- =========================================================
-- jobs
-- =========================================================
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  location text NOT NULL,
  stipend text NOT NULL,
  skills text[] NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'employer',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_jobs" ON jobs;
CREATE POLICY "anon_select_jobs" ON jobs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_jobs" ON jobs;
CREATE POLICY "anon_insert_jobs" ON jobs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_jobs" ON jobs;
CREATE POLICY "anon_update_jobs" ON jobs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_jobs" ON jobs;
CREATE POLICY "anon_delete_jobs" ON jobs FOR DELETE
  TO anon, authenticated USING (true);

-- =========================================================
-- candidates
-- =========================================================
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  institution text NOT NULL,
  asq_score integer NOT NULL DEFAULT 0,
  clinical_hours integer NOT NULL DEFAULT 0,
  skills text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'Under Review',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_candidates" ON candidates;
CREATE POLICY "anon_select_candidates" ON candidates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_candidates" ON candidates;
CREATE POLICY "anon_insert_candidates" ON candidates FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_candidates" ON candidates;
CREATE POLICY "anon_update_candidates" ON candidates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_candidates" ON candidates;
CREATE POLICY "anon_delete_candidates" ON candidates FOR DELETE
  TO anon, authenticated USING (true);

-- =========================================================
-- applications
-- =========================================================
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_name text NOT NULL DEFAULT 'Portal user',
  asq_fit integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_applications" ON applications;
CREATE POLICY "anon_select_applications" ON applications FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_applications" ON applications;
CREATE POLICY "anon_insert_applications" ON applications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_applications" ON applications;
CREATE POLICY "anon_delete_applications" ON applications FOR DELETE
  TO anon, authenticated USING (true);

-- =========================================================
-- clinical_checkins
-- =========================================================
CREATE TABLE IF NOT EXISTS clinical_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name text NOT NULL,
  latitude double precision,
  longitude double precision,
  hours_added integer NOT NULL DEFAULT 4,
  verified boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clinical_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_checkins" ON clinical_checkins;
CREATE POLICY "anon_select_checkins" ON clinical_checkins FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_checkins" ON clinical_checkins;
CREATE POLICY "anon_insert_checkins" ON clinical_checkins FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_checkins" ON clinical_checkins;
CREATE POLICY "anon_delete_checkins" ON clinical_checkins FOR DELETE
  TO anon, authenticated USING (true);

-- =========================================================
-- Seed: aggregated jobs
-- =========================================================
INSERT INTO jobs (title, company, location, stipend, skills, description, source) VALUES
('Pharmacovigilance Associate', 'Sun Pharma', 'Mumbai, MH', '₹25,000/mo', ARRAY['Pharmacovigilance','GCP','ADR Reporting'], 'Monitor adverse drug reactions, compile safety reports, and support regulatory submissions.', 'linkedin'),
('HPLC Analyst', 'Himalaya Wellness', 'Bengaluru, KA', '₹22,000/mo', ARRAY['HPLC','Analytical Chemistry','Method Validation'], 'Operate HPLC systems, validate analytical methods, and document results for QA.', 'naukri'),
('Panchakarma Therapist', 'Ayush Wellness Centre', 'Pune, MH', '₹18,000/mo', ARRAY['Panchakarma','Abhyanga','Basti Therapy'], 'Deliver classical Panchakarma therapies under senior vaidya supervision.', 'ncs'),
('Clinical Research Coordinator', 'Dabur India', 'Ghaziabad, UP', '₹30,000/mo', ARRAY['GCP','NABH','Clinical Trials'], 'Coordinate clinical trial sites, manage regulatory docs, and audit compliance.', 'linkedin'),
('QA Officer - Ayurveda', 'Patanjali Ayurved', 'Haridwar, UK', '₹24,000/mo', ARRAY['QA','GMP','NABH','Ayurveda Formulation'], 'Ensure GMP compliance in Ayurvedic manufacturing and audit batch records.', 'naukri'),
('Drug Safety Scientist', 'Cipla', 'Goa', '₹35,000/mo', ARRAY['Pharmacovigilance','GCP','ICSR','Argus'], 'Perform case processing, ICSR submissions, and signal detection activities.', 'linkedin'),
('Yoga Therapist Intern', 'Morarji Desai Institute', 'Bengaluru, KA', '₹15,000/mo', ARRAY['Yoga Therapy','Asana','Stress Management'], 'Lead therapeutic yoga sessions for lifestyle disorder management.', 'ncs')
ON CONFLICT DO NOTHING;

-- =========================================================
-- Seed: candidates (for ASQ ranking table)
-- =========================================================
INSERT INTO candidates (name, institution, asq_score, clinical_hours, skills, status) VALUES
('Sample Candidate', 'Ayush Stream Academy', 88, 140, ARRAY['HPLC','Pharmacovigilance','GCP','Panchakarma'], 'Shortlisted'),
('Ananya Sharma', 'National Institute of Ayurveda', 92, 165, ARRAY['Panchakarma','Ayurveda Formulation','NABH'], 'Shortlisted'),
('Rahul Verma', 'IPGME&R Kolkata', 81, 110, ARRAY['HPLC','Analytical Chemistry'], 'Under Review'),
('Priya Nair', 'SDMCA Udupi', 90, 158, ARRAY['Yoga Therapy','GCP','NABH'], 'Shortlisted'),
('Karan Mehta', 'Gujarat Ayurved University', 76, 95, ARRAY['GMP','QA','Ayurveda Formulation'], 'Under Review'),
('Sneha Iyer', 'MMC Chennai', 85, 132, ARRAY['Pharmacovigilance','ICSR','Argus'], 'Shortlisted'),
('Arjun Reddy', 'NIA Jaipur', 79, 88, ARRAY['Panchakarma','Abhyanga'], 'Under Review'),
('Divya Gupta', 'BHU Varanasi', 87, 145, ARRAY['HPLC','GCP','Clinical Trials'], 'Shortlisted')
ON CONFLICT DO NOTHING;
