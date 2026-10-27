\set ON_ERROR_STOP on
BEGIN;

DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN EXECUTE 'CREATE ROLE anon NOLOGIN'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN EXECUTE 'CREATE ROLE authenticated NOLOGIN'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN EXECUTE 'CREATE ROLE service_role NOLOGIN'; END IF;
END
$roles$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

DO $type$
BEGIN
  CREATE TYPE public.user_role AS ENUM ('farmer', 'reseller', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$type$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  role public.user_role NOT NULL DEFAULT 'farmer'
);
GRANT SELECT ON public.profiles TO authenticated;

CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE TABLE storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  public boolean NOT NULL DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
CREATE TABLE storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL,
  name text NOT NULL
);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT INSERT ON storage.objects TO authenticated;

CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT string_to_array(name, '/');
$$;
GRANT EXECUTE ON FUNCTION storage.foldername(text) TO PUBLIC;

INSERT INTO public.profiles (id, role) VALUES
  ('10000000-0000-0000-0000-000000000001', 'farmer'),
  ('10000000-0000-0000-0000-000000000002', 'admin');

\i supabase/migrations/20261027210000_create_harvest_listings.sql
\i supabase/migrations/20261027210500_harden_harvest_moderation.sql

SET LOCAL ROLE authenticated;
DO $test$
DECLARE
  listing_id uuid;
  listing_status text;
  listing_note text;
  listing_phone text;
  denied boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  INSERT INTO public.harvest_listings (
    owner_id, seller_name, crop_name, description, quantity, unit,
    price_per_unit, district, contact_phone, contact_phone_public,
    image_urls, status, moderation_status, moderation_note
  ) VALUES (
    auth.uid(), 'Test farmer', 'Rice', 'Test listing', 100, 'kg',
    30, 'Naogaon', '01700000000', false,
    ARRAY['https://example.invalid/harvest.jpg'], 'available', 'approved', 'client-forged'
  ) RETURNING id, moderation_status, moderation_note, contact_phone
  INTO listing_id, listing_status, listing_note, listing_phone;

  IF listing_status <> 'pending' OR listing_note IS NOT NULL OR listing_phone IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: insert trigger did not enforce pending moderation and phone privacy';
  END IF;

  UPDATE public.harvest_listings SET status = 'paused' WHERE id = listing_id;

  BEGIN
    UPDATE public.harvest_listings SET moderation_status = 'approved' WHERE id = listing_id;
  EXCEPTION WHEN insufficient_privilege THEN
    denied := true;
  END;
  IF NOT denied THEN
    RAISE EXCEPTION 'FAIL: owner could update moderation status directly';
  END IF;

  INSERT INTO storage.objects(bucket_id, name)
  VALUES ('harvest-images', auth.uid()::text || '/own.jpg');

  denied := false;
  BEGIN
    INSERT INTO storage.objects(bucket_id, name)
    VALUES ('harvest-images', '10000000-0000-0000-0000-000000000099/other.jpg');
  EXCEPTION WHEN insufficient_privilege THEN
    denied := true;
  END;
  IF NOT denied THEN
    RAISE EXCEPTION 'FAIL: owner could upload into another user folder';
  END IF;
END
$test$;

DO $owner$
DECLARE
  listing_id uuid;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
  SELECT id INTO listing_id FROM public.harvest_listings WHERE owner_id = auth.uid() LIMIT 1;
  UPDATE public.harvest_listings SET status = 'available' WHERE id = listing_id;
END
$owner$;

DO $admin$
DECLARE
  listing_id uuid;
  status_value text;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SELECT id INTO listing_id FROM public.harvest_listings LIMIT 1;
  PERFORM public.admin_moderate_harvest_listing(listing_id, 'approved', NULL);
  SELECT moderation_status INTO status_value FROM public.harvest_listings WHERE id = listing_id;
  IF status_value <> 'approved' THEN
    RAISE EXCEPTION 'FAIL: admin moderation RPC did not approve listing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.admin_audit_log WHERE action = 'harvest_listing.moderated') THEN
    RAISE EXCEPTION 'FAIL: moderation action was not audited';
  END IF;
END
$admin$;

RESET ROLE;
SET LOCAL ROLE anon;
DO $public$
DECLARE visible_count integer;
BEGIN
  SELECT count(*) INTO visible_count FROM public.harvest_listings;
  IF visible_count <> 1 THEN
    RAISE EXCEPTION 'FAIL: public should see only the approved, available listing; saw %', visible_count;
  END IF;
END
$public$;

RESET ROLE;
ROLLBACK;
