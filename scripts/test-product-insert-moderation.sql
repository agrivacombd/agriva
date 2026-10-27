\set ON_ERROR_STOP on
BEGIN;

-- Match the Supabase API roles referenced by the production migration.
DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN EXECUTE 'CREATE ROLE anon NOLOGIN'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN EXECUTE 'CREATE ROLE authenticated NOLOGIN'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN EXECUTE 'CREATE ROLE service_role NOLOGIN'; END IF;
END
$roles$;

-- Minimal, isolated fixture for exercising the real trigger in PostgreSQL.
CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(current_setting('request.jwt.claim.role', true) = 'admin', false);
$$;

CREATE TABLE public.products (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  farmer_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'draft'
);

\i supabase/migrations/20261028173000_guard_product_insert_status.sql

DO $test$
DECLARE
  product_id bigint;
  denied boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  INSERT INTO public.products (farmer_id, status)
  VALUES ('10000000-0000-0000-0000-000000000001', 'draft')
  RETURNING id INTO product_id;

  BEGIN
    INSERT INTO public.products (farmer_id, status)
    VALUES ('10000000-0000-0000-0000-000000000001', 'active');
  EXCEPTION WHEN insufficient_privilege THEN
    denied := true;
  END;
  IF NOT denied THEN
    RAISE EXCEPTION 'FAIL: non-admin INSERT with active status was allowed';
  END IF;

  denied := false;
  BEGIN
    UPDATE public.products SET status = 'active' WHERE id = product_id;
  EXCEPTION WHEN insufficient_privilege THEN
    denied := true;
  END;
  IF NOT denied THEN
    RAISE EXCEPTION 'FAIL: non-admin UPDATE of moderation status was allowed';
  END IF;

  PERFORM set_config('request.jwt.claim.role', 'admin', true);
  INSERT INTO public.products (farmer_id, status)
  VALUES ('10000000-0000-0000-0000-000000000002', 'active');

  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  INSERT INTO public.products (farmer_id, status)
  VALUES ('10000000-0000-0000-0000-000000000003', 'active');

  RAISE NOTICE 'PASS: draft insert allowed; non-admin publish insert/update rejected; admin and trusted service inserts allowed';
END
$test$;

ROLLBACK;
