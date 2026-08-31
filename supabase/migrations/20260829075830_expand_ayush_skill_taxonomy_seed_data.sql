/*
# Expand AYUSH skill taxonomy — seed data update

## Overview
Replaces the initial 7 jobs and 8 candidates with a much larger dataset
covering all six AYUSH systems (Ayurveda, Yoga & Naturopathy, Unani,
Siddha, Homeopathy) plus pharma, pharmacovigilance, clinical research,
and hospital management skill domains.

## Changes
1. Truncates applications, jobs, candidates tables (prototype seed data,
   no user data at risk).
2. Inserts 18 aggregated jobs across LinkedIn, Naukri, NCS with diverse
   skill requirements spanning every AYUSH domain.
3. Inserts 12 candidates with realistic ASQ scores, clinical hours, and
   multi-domain skill sets from institutions across India.

## Security
- No schema or policy changes — RLS already enabled on all tables.
*/

TRUNCATE TABLE applications, jobs, candidates;

-- =========================================================
-- Expanded jobs (18 aggregated listings)
-- =========================================================
INSERT INTO jobs (title, company, location, stipend, skills, description, source) VALUES
('Pharmacovigilance Associate', 'Sun Pharma', 'Mumbai, MH', '₹25,000/mo',
  ARRAY['Pharmacovigilance','GCP','ADR Reporting','ICSR'],
  'Monitor adverse drug reactions for ASU&H products, compile safety reports, and support regulatory submissions to NPvCC.', 'linkedin'),
('HPLC Analyst', 'Himalaya Wellness', 'Bengaluru, KA', '₹22,000/mo',
  ARRAY['HPLC','Analytical Chemistry','Method Validation','QC'],
  'Operate HPLC systems, validate analytical methods for herbal extracts, and document results for QA release.', 'naukri'),
('Panchakarma Therapist', 'Ayush Wellness Centre', 'Pune, MH', '₹18,000/mo',
  ARRAY['Panchakarma','Abhyanga','Basti Therapy','Virechana','Swedana'],
  'Deliver classical Panchakarma therapies including Abhyanga, Basti, Virechana, and Swedana under senior vaidya supervision.', 'ncs'),
('Clinical Research Coordinator', 'Dabur India', 'Ghaziabad, UP', '₹30,000/mo',
  ARRAY['GCP','NABH','Clinical Trials','Clinical Research Coordination','CDSCO Compliance'],
  'Coordinate AYUSH clinical trial sites, manage regulatory documentation, and audit NABH compliance across study centers.', 'linkedin'),
('QA Officer - Ayurveda Manufacturing', 'Patanjali Ayurved', 'Haridwar, UK', '₹24,000/mo',
  ARRAY['QA','GMP','NABH','Ayurveda Formulation','Standardization of ASU Drugs'],
  'Ensure GMP compliance in Ayurvedic manufacturing, audit batch records, and standardize ASU drug formulations.', 'naukri'),
('Drug Safety Scientist', 'Cipla', 'Goa', '₹35,000/mo',
  ARRAY['Pharmacovigilance','GCP','ICSR','Argus','Signal Detection'],
  'Perform ICSR case processing, signal detection, and periodic safety update reports for ASU&H product portfolio.', 'linkedin'),
('Yoga Therapist Intern', 'Morarji Desai Institute', 'Bengaluru, KA', '₹15,000/mo',
  ARRAY['Yoga Therapy','Asana','Pranayama','Stress Management','Lifestyle Disorder Management'],
  'Lead therapeutic yoga sessions for diabetes, cardiovascular health, and stress management in a clinical setting.', 'ncs'),
('Unani Regimental Therapy Specialist', 'Ajmal Khan Tibbiya College', 'Aligarh, UP', '₹20,000/mo',
  ARRAY['Unani Medicine','Hijama (Cupping)','Regimental Therapy','Dalak (Massage)','Mizaj Assessment'],
  'Provide Unani regimental therapies including Hijama (cupping), Dalak massage, and irrigation therapy with Mizaj assessment.', 'linkedin'),
('Siddha Varma Therapist', 'National Institute of Siddha', 'Chennai, TN', '₹19,000/mo',
  ARRAY['Siddha Medicine','Varma Therapy','Siddha Pharmacology'],
  'Practice Siddha Varma therapy for neuromuscular disorders and prepare traditional Siddha formulations.', 'ncs'),
('Homeopathic Physician Intern', 'Central Council of Homoeopathy', 'Hyderabad, TS', '₹17,000/mo',
  ARRAY['Homeopathy','Repertory','Miasmatic Assessment','Constitutional Prescribing','Potentization'],
  'Conduct homeopathic case taking, repertory analysis, miasmatic assessment, and constitutional prescribing under supervision.', 'naukri'),
('Naturopathy & Diet Consultant', 'Jindal Naturopathy Institute', 'Bengaluru, KA', '₹21,000/mo',
  ARRAY['Naturopathy','Hydrotherapy','Mud Therapy','Diet & Nutrition Therapy','Yoga Therapy'],
  'Design naturopathy treatment protocols using hydrotherapy, mud therapy, and diet-nutrition therapy for lifestyle disorders.', 'linkedin'),
('Analytical Chemist - Herbal Extracts', 'Natural Remedies Pvt Ltd', 'Bengaluru, KA', '₹28,000/mo',
  ARRAY['HPLC','Analytical Chemistry','Method Validation','Stability Studies','Raw Material Testing'],
  'Develop and validate analytical methods for herbal raw material testing and stability studies of ASU drug products.', 'naukri'),
('Shirodhara & Abhyanga Specialist', 'Kerala Ayurveda Resort', 'Kovalam, KL', '₹16,000/mo',
  ARRAY['Shirodhara','Abhyanga','Panchakarma','Swedana','Nadi Pariksha'],
  'Perform Shirodhara, Abhyanga, and Swedana therapies with Nadi Pariksha diagnosis at a premium Ayurveda wellness resort.', 'ncs'),
('Regulatory Affairs Executive', 'Emami Ltd', 'Kolkata, WB', '₹32,000/mo',
  ARRAY['CDSCO Compliance','Regulatory Affairs','WHO-GMP Certification','COPP Documentation','NABH Accreditation'],
  'Prepare CDSCO regulatory submissions, WHO-GMP and COPP documentation, and coordinate NABH accreditation audits.', 'linkedin'),
('Rasa Shastra Research Associate', 'Banaras Hindu University', 'Varanasi, UP', '₹26,000/mo',
  ARRAY['Rasa Shastra','Bhaishajya Kalpana','Ayurveda Formulation','Herbal Pharmacology'],
  'Research Rasa Shastra (herbo-mineral formulations), Bhaishajya Kalpana preparation methods, and document herbal pharmacology.', 'naukri'),
('Telemedicine Coordinator - AYUSH', 'eSanjeevani Ayush', 'New Delhi, DL', '₹23,000/mo',
  ARRAY['Telemedicine','Health Informatics','Hospital Management','Patient Safety'],
  'Coordinate AYUSH telemedicine consultations, manage health informatics records, and ensure patient safety protocols.', 'linkedin'),
('NABH Accreditation Consultant', 'Quality Council of India', 'New Delhi, DL', '₹40,000/mo',
  ARRAY['NABH Accreditation','Healthcare Quality','Infection Control','Medical Records Management','Patient Safety'],
  'Guide AYUSH hospitals through NABH accreditation: infection control, medical records, patient safety, and quality audits.', 'naukri'),
('GMP Manufacturing Supervisor', 'Sandu Pharmaceuticals', 'Nashik, MH', '₹27,000/mo',
  ARRAY['GMP','QA','Pharmaceutical Formulation','Standardization of ASU Drugs','Supply Chain Management'],
  'Supervise GMP-compliant manufacturing of Ayurvedic formulations, standardize ASU drugs, and manage supply chain logistics.', 'ncs');

-- =========================================================
-- Expanded candidates (12 profiles across AYUSH systems)
-- =========================================================
INSERT INTO candidates (name, institution, asq_score, clinical_hours, skills, status) VALUES
('Sample Candidate', 'Ayush Stream Academy', 88, 140,
  ARRAY['HPLC','Pharmacovigilance','GCP','Panchakarma','Analytical Chemistry','ADR Reporting','Clinical Trials'], 'Shortlisted'),
('Ananya Sharma', 'National Institute of Ayurveda, Jaipur', 92, 165,
  ARRAY['Panchakarma','Abhyanga','Shirodhara','Ayurveda Formulation','NABH','Nadi Pariksha','Rasa Shastra'], 'Shortlisted'),
('Rahul Verma', 'JSS College of Pharmacy, Ooty', 81, 110,
  ARRAY['HPLC','Analytical Chemistry','Method Validation','QC','Stability Studies'], 'Under Review'),
('Priya Nair', 'SDMCA Udupi', 90, 158,
  ARRAY['Yoga Therapy','Asana','Pranayama','GCP','NABH','Stress Management','Naturopathy'], 'Shortlisted'),
('Karan Mehta', 'Gujarat Ayurved University, Jamnagar', 76, 95,
  ARRAY['GMP','QA','Ayurveda Formulation','Standardization of ASU Drugs','Bhaishajya Kalpana'], 'Under Review'),
('Sneha Iyer', 'MMC Pharmacy College, Chennai', 85, 132,
  ARRAY['Pharmacovigilance','ICSR','Argus','Signal Detection','ADR Reporting','GCP'], 'Shortlisted'),
('Arjun Reddy', 'NIA Jaipur', 79, 88,
  ARRAY['Panchakarma','Abhyanga','Basti Therapy','Virechana','Swedana','Nadi Pariksha'], 'Under Review'),
('Divya Gupta', 'BHU Varanasi', 87, 145,
  ARRAY['HPLC','GCP','Clinical Trials','Rasa Shastra','Bhaishajya Kalpana','Herbal Pharmacology'], 'Shortlisted'),
('Mohammed Faizan', 'Ajmal Khan Tibbiya College, AMU', 83, 120,
  ARRAY['Unani Medicine','Hijama (Cupping)','Regimental Therapy','Dalak (Massage)','Mizaj Assessment'], 'Shortlisted'),
('Lakshmi Sundaram', 'National Institute of Siddha, Chennai', 84, 115,
  ARRAY['Siddha Medicine','Varma Therapy','Siddha Pharmacology','Herbal Pharmacology'], 'Under Review'),
('Aishwarya Pawar', 'SKK Homoeopathic Medical College, Beed', 78, 92,
  ARRAY['Homeopathy','Repertory','Miasmatic Assessment','Constitutional Prescribing','Potentization'], 'Under Review'),
('Vikram Singh', 'Jindal Naturopathy Institute, Bengaluru', 86, 130,
  ARRAY['Naturopathy','Hydrotherapy','Mud Therapy','Diet & Nutrition Therapy','Yoga Therapy','Telemedicine'], 'Shortlisted');
