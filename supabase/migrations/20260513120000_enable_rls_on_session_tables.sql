/*
  # Enable RLS on session-based tables

  ## Problem
  The session-based tables were created without Row-Level Security, which
  allows anyone with the public anon key to read, insert, update, and delete
  all rows via the Supabase REST API.

  ## Fix
  Enable RLS on all five session-based tables. No policies are added — this
  produces a "deny-all" for the anon and authenticated roles.

  API routes use SUPABASE_SERVICE_ROLE_KEY via createServerClient(), which
  bypasses RLS entirely, so they are unaffected by this change.

  ## Tables fixed
  - public.resumes
  - public.job_analyses
  - public.gupy_suggestions
  - public.salary_suggestions
  - public.analysis_versions
  - public.profiles (if it exists)
*/

ALTER TABLE public.resumes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_analyses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gupy_suggestions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_versions  ENABLE ROW LEVEL SECURITY;

-- profiles was likely created manually in the Supabase dashboard
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
