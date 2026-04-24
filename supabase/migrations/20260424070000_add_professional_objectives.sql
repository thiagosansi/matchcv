/*
  # Add professional_objectives array to profiles

  Replaces single professional_goal text field with an array to support
  users searching for multiple roles simultaneously (e.g. Product Manager,
  Product Owner, Analista de Produto).

  professional_goal is kept for backwards compatibility but no longer written.
*/

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS professional_objectives text[] NOT NULL DEFAULT '{}';
