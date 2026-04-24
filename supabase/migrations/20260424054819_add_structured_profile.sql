/*
  # Add Structured Profile Tables

  Adds structured data tables for the ATS resume builder:
  - work_experiences: job history with bullets and dates
  - education_entries: academic background
  - profile_skills: technical skills, tools, languages, certifications
  - contact_info column in profiles (JSONB)

  All tables reference auth.users(id) directly (profiles was created without a migration).
  RLS enabled: users can only access their own records.
  Soft-delete via deleted_at on experiences and education.
  display_order uses step-of-10 convention for easy reordering.
*/

-- ─── Contact info column on profiles ─────────────────────────────────────────
-- profiles may have been created manually — use IF EXISTS guard
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_info jsonb DEFAULT '{}';
  END IF;
END $$;

-- ─── Work Experiences ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_experiences (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company       text        NOT NULL DEFAULT '',
  title         text        NOT NULL DEFAULT '',
  location      text                 DEFAULT '',
  start_date    date,
  end_date      date,
  is_current    boolean     NOT NULL DEFAULT false,
  description   text                 DEFAULT '',
  display_order integer     NOT NULL DEFAULT 0,
  deleted_at    timestamptz,
  created_at    timestamptz          DEFAULT now(),
  updated_at    timestamptz          DEFAULT now()
);

-- ─── Education Entries ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.education_entries (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution   text        NOT NULL DEFAULT '',
  degree        text                 DEFAULT '',
  field         text                 DEFAULT '',
  start_date    date,
  end_date      date,
  is_current    boolean     NOT NULL DEFAULT false,
  description   text                 DEFAULT '',
  display_order integer     NOT NULL DEFAULT 0,
  deleted_at    timestamptz,
  created_at    timestamptz          DEFAULT now(),
  updated_at    timestamptz          DEFAULT now()
);

-- ─── Profile Skills ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profile_skills (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  category      text        NOT NULL DEFAULT 'technical',
  proficiency   text                 DEFAULT '',
  display_order integer     NOT NULL DEFAULT 0,
  deleted_at    timestamptz,
  created_at    timestamptz          DEFAULT now(),
  CONSTRAINT profile_skills_category_check
    CHECK (category IN ('technical', 'tool', 'language', 'certification'))
);

-- ─── Indexes (partial — active records only) ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_work_exp_user_id
  ON public.work_experiences(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_education_user_id
  ON public.education_entries(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_skills_user_id
  ON public.profile_skills(user_id) WHERE deleted_at IS NULL;

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.work_experiences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_skills    ENABLE ROW LEVEL SECURITY;

-- (SELECT auth.uid()) evaluated once per query, not row-by-row
CREATE POLICY "Users manage own work experiences"
  ON public.work_experiences FOR ALL TO authenticated
  USING  ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users manage own education entries"
  ON public.education_entries FOR ALL TO authenticated
  USING  ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users manage own skills"
  ON public.profile_skills FOR ALL TO authenticated
  USING  ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
