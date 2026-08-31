-- Remove the demo identity from existing data and future application defaults.
ALTER TABLE applications
  ALTER COLUMN applicant_name SET DEFAULT 'Portal user';

UPDATE applications
SET applicant_name = 'Portal user'
WHERE applicant_name IN ('Trishit Talukdar', 'Trishti Talukdar');

UPDATE candidates
SET name = 'Sample Candidate'
WHERE name IN ('Trishit Talukdar', 'Trishti Talukdar');
