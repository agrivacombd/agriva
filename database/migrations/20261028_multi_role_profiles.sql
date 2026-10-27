-- Multi-role preferences are synchronized with user_role_memberships by the
-- canonical Supabase migration. This migration only ensures the profile field
-- exists for deployments that also run database/migrations.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS selected_roles text[] NOT NULL DEFAULT ARRAY['farmer']::text[];

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_selected_roles_allowed;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_selected_roles_allowed
  CHECK (
    cardinality(selected_roles) BETWEEN 1 AND 9
    AND selected_roles <@ ARRAY[
      'farmer', 'buyer', 'seller', 'transport', 'job_seeker',
      'employer', 'student', 'agriculturist', 'rooftop_gardener'
    ]::text[]
  );
