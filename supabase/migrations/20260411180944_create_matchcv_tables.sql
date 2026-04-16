/*
  # MatchCV - Initial Schema

  ## Overview
  Creates the core tables for the MatchCV SaaS application that matches
  resumes to job postings using AI analysis.

  ## New Tables

  ### resumes
  - Stores uploaded resume metadata and parsed content
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `file_name` (text) - original filename
  - `file_url` (text) - Supabase Storage URL
  - `content_text` (text) - raw extracted text
  - `content_json` (jsonb) - structured resume data
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### job_analyses
  - Stores job analysis sessions including the job posting and AI results
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `resume_id` (uuid, references resumes)
  - `job_title` (text) - extracted job title
  - `job_company` (text) - extracted company name
  - `job_text` (text) - raw job description text
  - `job_url` (text) - optional source URL
  - `job_structured` (jsonb) - structured job data from AI
  - `score` (integer 0-100) - compatibility score
  - `analysis_result` (jsonb) - full analysis output (gaps, strengths, keywords)
  - `optimized_resume` (jsonb) - AI-optimized resume content
  - `ats_keywords` (text[]) - ATS keyword list
  - `gupy_suggestions` (jsonb) - Gupy application texts (3 versions)
  - `salary_suggestion` (jsonb) - salary range estimation
  - `is_gupy` (boolean) - whether job is from Gupy platform
  - `status` (text) - pending/processing/completed/error
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
*/

CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL DEFAULT '',
  file_url text DEFAULT '',
  content_text text DEFAULT '',
  content_json jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resumes"
  ON resumes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes"
  ON resumes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes"
  ON resumes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
  ON resumes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS job_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id uuid REFERENCES resumes(id) ON DELETE SET NULL,
  job_title text DEFAULT '',
  job_company text DEFAULT '',
  job_text text NOT NULL DEFAULT '',
  job_url text DEFAULT '',
  job_structured jsonb DEFAULT '{}',
  score integer DEFAULT 0,
  analysis_result jsonb DEFAULT '{}',
  optimized_resume jsonb DEFAULT '{}',
  ats_keywords text[] DEFAULT '{}',
  gupy_suggestions jsonb DEFAULT '{}',
  salary_suggestion jsonb DEFAULT '{}',
  is_gupy boolean DEFAULT false,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE job_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON job_analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON job_analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
  ON job_analyses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON job_analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_job_analyses_user_id ON job_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_job_analyses_resume_id ON job_analyses(resume_id);
CREATE INDEX IF NOT EXISTS idx_job_analyses_status ON job_analyses(status);
CREATE INDEX IF NOT EXISTS idx_job_analyses_created_at ON job_analyses(created_at DESC);
