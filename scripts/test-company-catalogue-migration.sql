-- Minimal PostgreSQL integration test for the company catalogue migration.
\set ON_ERROR_STOP on

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE
AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[]
LANGUAGE sql IMMUTABLE
AS $$ SELECT (string_to_array(trim(both '/' from name), '/'))[1:greatest(array_length(string_to_array(trim(both '/' from name), '/'), 1) - 1, 0)] $$;
CREATE OR REPLACE FUNCTION public.has_platform_admin_access() RETURNS boolean
LANGUAGE sql STABLE
AS $$ SELECT false $$;

CREATE TABLE public.seed_company_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_user_id uuid NOT NULL,
  company_name text NOT NULL,
  legal_name text,
  registration_number text NOT NULL,
  contact_phone text NOT NULL,
  business_email text NOT NULL,
  district text NOT NULL,
  website text,
  product_categories text[] NOT NULL DEFAULT ARRAY['seeds']::text[],
  status text NOT NULL DEFAULT 'pending',
  review_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.seed_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL UNIQUE,
  application_id uuid NOT NULL UNIQUE,
  company_name text NOT NULL,
  legal_name text,
  registration_number text NOT NULL,
  contact_phone text NOT NULL,
  business_email text NOT NULL,
  district text NOT NULL,
  website text,
  product_categories text[] NOT NULL DEFAULT ARRAY['seeds']::text[],
  verification_status text NOT NULL DEFAULT 'verified',
  verified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.seed_company_application_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  applicant_user_id uuid NOT NULL,
  reviewer_user_id uuid NOT NULL,
  decision text NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid,
  name text NOT NULL DEFAULT 'test',
  slug text NOT NULL DEFAULT gen_random_uuid()::text,
  listing_source text NOT NULL DEFAULT 'platform',
  status text NOT NULL DEFAULT 'draft',
  moderation_status text NOT NULL DEFAULT 'pending',
  image_url text,
  price numeric NOT NULL DEFAULT 1,
  stock integer NOT NULL DEFAULT 0,
  category text,
  category_slug text,
  subcategory_slug text,
  reseller_commission_percent numeric NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text NOT NULL, name text NOT NULL);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

INSERT INTO public.seed_companies (
  owner_user_id, application_id, company_name, registration_number, contact_phone,
  business_email, district, product_categories, verification_status
) VALUES (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  'AGRIVA Test Company', 'REG-123', '+8801700000000', 'test@example.com',
  'Dhaka', ARRAY['seeds']::text[], 'verified'
);

\ir ../supabase/migrations/20261029380000_company_product_catalogue_and_public_profiles.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'seed_companies' AND column_name = 'slug'
  ) THEN RAISE EXCEPTION 'company slug column missing'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'products'
      AND policyname = 'Verified companies can create own draft products'
  ) THEN RAISE EXCEPTION 'company product ownership policy missing'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Verified companies can upload own product images'
  ) THEN RAISE EXCEPTION 'company image ownership policy missing'; END IF;

  IF has_function_privilege('anon', 'public.admin_review_seed_company_application(uuid,text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anonymous role must not execute company application review';
  END IF;

  IF NOT has_function_privilege('anon', 'public.get_public_seed_company_profile(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anonymous role should execute the narrow public company profile RPC';
  END IF;
END $$;

SELECT 'Company catalogue migration integration checks passed.' AS result;
