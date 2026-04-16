/*
  # Refactor to Session-Based (No Auth)

  ## Overview
  Removes user_id / auth dependency and replaces with session_id (anonymous per-browser).
  All writes go through API routes, not directly from the frontend.

  ## Changes
  - Drop existing tables (resumes, job_analyses)
  - Create new tables with session_id instead of user_id
  - Add gupy_suggestions, salary_suggestions, analysis_versions tables
  - Add indexes on session_id fields
  - No RLS needed (all access via service role in API routes)

  ## New Tables
  - resumes: session_id, file_name, raw_text, structured_json
  - job_analyses: session_id, all analysis output columns
  - gupy_suggestions: linked to job_analyses
  - salary_suggestions: linked to job_analyses
  - analysis_versions: versioned optimized resumes
*/

DROP TABLE IF EXISTS public.job_analyses CASCADE;
DROP TABLE IF EXISTS public.resumes CASCADE;

CREATE TABLE IF NOT EXISTS public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL DEFAULT '',
  file_name text NOT NULL DEFAULT '',
  file_path text DEFAULT '',
  raw_text text DEFAULT '',
  structured_json jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL DEFAULT '',
  resume_id uuid REFERENCES public.resumes(id) ON DELETE SET NULL,
  job_source_type text DEFAULT 'text',
  job_url text DEFAULT '',
  job_raw_text text DEFAULT '',
  job_structured_json jsonb DEFAULT '{}',
  match_score integer DEFAULT 0,
  strengths_json jsonb DEFAULT '[]',
  gaps_json jsonb DEFAULT '[]',
  missing_keywords_json jsonb DEFAULT '[]',
  section_recommendations_json jsonb DEFAULT '[]',
  optimized_resume_text text DEFAULT '',
  executive_summary text DEFAULT '',
  ats_keywords text[] DEFAULT '{}',
  is_gupy boolean DEFAULT false,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gupy_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.job_analyses(id) ON DELETE CASCADE,
  formal_text text DEFAULT '',
  human_text text DEFAULT '',
  objective_text text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.salary_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.job_analyses(id) ON DELETE CASCADE,
  salary_min numeric(12,2) DEFAULT 0,
  salary_mid numeric(12,2) DEFAULT 0,
  salary_max numeric(12,2) DEFAULT 0,
  currency text DEFAULT 'BRL',
  explanation text DEFAULT '',
  source_summary text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analysis_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.job_analyses(id) ON DELETE CASCADE,
  version_name text DEFAULT '',
  optimized_resume_text text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resumes_session_id ON public.resumes(session_id);
CREATE INDEX IF NOT EXISTS idx_job_analyses_session_id ON public.job_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_job_analyses_resume_id ON public.job_analyses(resume_id);
CREATE INDEX IF NOT EXISTS idx_job_analyses_created_at ON public.job_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gupy_analysis_id ON public.gupy_suggestions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_salary_analysis_id ON public.salary_suggestions(analysis_id);
