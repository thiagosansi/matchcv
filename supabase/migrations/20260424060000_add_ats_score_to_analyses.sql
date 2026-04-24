/*
  # Add ATS Score Breakdown to Job Analyses

  Adds ats_score_json column to store the multi-dimensional ATS score result
  (keywords, skills, experience, format, completeness dimensions + found/missing keywords).
  Also adds optimized_resume_json column if missing from prior migrations.
*/

ALTER TABLE public.job_analyses
  ADD COLUMN IF NOT EXISTS ats_score_json jsonb DEFAULT NULL;

ALTER TABLE public.job_analyses
  ADD COLUMN IF NOT EXISTS optimized_resume_json jsonb DEFAULT NULL;
