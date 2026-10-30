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
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
GRANT USAGE ON SCHEMA auth TO authenticated, anon;
GRANT EXECUTE ON FUNCTION auth.uid() TO PUBLIC;

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
GRANT SELECT ON public.admin_audit_log TO authenticated;

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

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT public.is_admin();
$$;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

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

\i supabase/migrations/20261029090000_create_harvest_listings.sql
\i supabase/migrations/20261026233434_harden_harvest_moderation.sql
-- Simulate legacy policy names from the production schema to prove the corrective migration removes them.
CREATE POLICY "Admins can delete harvest listings"
  ON public.harvest_listings FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY "Authenticated users can submit harvest listings"
  ON public.harvest_listings FOR INSERT TO authenticated WITH CHECK (owner_id = (SELECT auth.uid()));
CREATE POLICY "Owners can update own harvest listings"
  ON public.harvest_listings FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid())) WITH CHECK (owner_id = (SELECT auth.uid()));
CREATE POLICY "Public can read approved available harvest listings"
  ON public.harvest_listings FOR SELECT TO anon
  USING (moderation_status = 'approved' AND status = 'available');
CREATE POLICY "Users can read approved or own harvest listings"
  ON public.harvest_listings FOR SELECT TO authenticated
  USING (owner_id = (SELECT auth.uid()) OR (moderation_status = 'approved' AND status = 'available'));

\i supabase/migrations/20261029093000_reconcile_harvest_listing_policies.sql

-- Seed a legacy pending listing; the forward migration must publish it.
INSERT INTO public.harvest_listings (
  owner_id, seller_name, crop_name, description, quantity, unit,
  price_per_unit, district, image_urls, status, moderation_status
) VALUES (
  '10000000-0000-0000-0000-000000000001', 'Legacy farmer', 'Wheat',
  'Legacy pending listing', 50, 'kg', 25, 'Rajshahi',
  ARRAY['https://example.supabase.co/storage/v1/object/public/harvest-images/10000000-0000-0000-0000-000000000001/legacy.jpg'], 'paused', 'pending'
);

\i supabase/migrations/20261030235100_reconcile_harvest_immediate_publication.sql

DO $legacy_normalization$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.harvest_listings
    WHERE crop_name = 'Wheat'
      AND (moderation_status <> 'approved' OR moderation_note IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'FAIL: legacy pending listings must be normalized to published';
  END IF;
END
$legacy_normalization$;

DO $policy_cleanup$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'harvest_listings'
      AND policyname IN (
        'Admins can delete harvest listings',
        'Authenticated users can submit harvest listings',
        'Owners can update own harvest listings',
        'Public can read approved available harvest listings',
        'Users can read approved or own harvest listings'
      )
  ) THEN
    RAISE EXCEPTION 'FAIL: legacy permissive harvest policies remain active';
  END IF;
END
$policy_cleanup$;

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
    id, owner_id, seller_name, crop_name, description, quantity, unit,
    price_per_unit, district, contact_phone, contact_phone_public,
    image_urls, status, moderation_status, moderation_note
  ) VALUES (
    '20000000-0000-0000-0000-000000000002', auth.uid(), 'Test farmer', 'Rice', 'Test listing', 100, 'kg',
    30, 'Naogaon', '01700000000', false,
    ARRAY['https://example.supabase.co/storage/v1/object/public/harvest-images/10000000-0000-0000-0000-000000000001/test.jpg'], 'available', 'rejected', 'client-forged'
  ) RETURNING id, moderation_status, moderation_note, contact_phone
  INTO listing_id, listing_status, listing_note, listing_phone;

  RAISE NOTICE 'Immediate publication check: status=%, note=%, phone=%', listing_status, listing_note, listing_phone;
  IF listing_status <> 'approved' OR listing_note IS NOT NULL OR listing_phone IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: listing must publish immediately while preserving phone privacy';
  END IF;

  denied := false;
  BEGIN
    UPDATE public.harvest_listings
    SET moderation_status = 'rejected', moderation_note = 'client-forged'
    WHERE id = listing_id;
  EXCEPTION WHEN insufficient_privilege THEN
    denied := true;
  END;
  IF NOT denied THEN
    RAISE EXCEPTION 'FAIL: owner must not write moderation fields directly';
  END IF;
  SELECT moderation_status, moderation_note
  INTO listing_status, listing_note
  FROM public.harvest_listings WHERE id = listing_id;
  IF listing_status <> 'approved' OR listing_note IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: owner moderation fields must remain server controlled';
  END IF;

  UPDATE public.harvest_listings SET status = 'paused' WHERE id = listing_id;
  SELECT moderation_status INTO listing_status FROM public.harvest_listings WHERE id = listing_id;
  IF listing_status <> 'approved' THEN
    RAISE EXCEPTION 'FAIL: ordinary owner updates must preserve published moderation state';
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

SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
SELECT public.admin_moderate_harvest_listing('20000000-0000-0000-0000-000000000002', 'rejected', 'test moderation compatibility');

DO $admin_reject$
BEGIN
  IF (SELECT status FROM public.harvest_listings WHERE crop_name = 'Rice') <> 'paused'
    OR (SELECT moderation_status FROM public.harvest_listings WHERE crop_name = 'Rice') <> 'rejected'
    OR (SELECT moderation_note FROM public.harvest_listings WHERE crop_name = 'Rice') <> 'test moderation compatibility' THEN
    RAISE EXCEPTION 'FAIL: legacy admin reject action must pause and audit a rejected listing';
  END IF;
END
$admin_reject$;

DO $admin_can_read_paused$
BEGIN
  IF (SELECT count(*) FROM public.harvest_listings WHERE id='20000000-0000-0000-0000-000000000002') <> 1 THEN
    RAISE EXCEPTION 'FAIL: admin must be able to read paused harvest listings';
  END IF;
END
$admin_can_read_paused$;

SELECT public.admin_moderate_harvest_listing('20000000-0000-0000-0000-000000000002', 'approved', NULL);

DO $admin_approve$
BEGIN
  IF (SELECT status FROM public.harvest_listings WHERE crop_name = 'Rice') <> 'available'
    OR (SELECT moderation_status FROM public.harvest_listings WHERE crop_name = 'Rice') <> 'approved'
    OR (SELECT moderation_note FROM public.harvest_listings WHERE crop_name = 'Rice') IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: legacy admin approve action must restore listing visibility';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.admin_audit_log WHERE action = 'harvest_listing.visibility_changed') THEN
    RAISE EXCEPTION 'FAIL: compatibility admin visibility changes must be audited';
  END IF;
END
$admin_approve$;

RESET ROLE;
DO $compatibility_rpc$
BEGIN
  IF to_regprocedure('public.admin_moderate_harvest_listing(uuid,text,text)') IS NULL
    OR to_regprocedure('private.admin_moderate_harvest_listing(uuid,text,text)') IS NULL THEN
    RAISE EXCEPTION 'FAIL: legacy admin visibility RPC compatibility must remain during rollout';
  END IF;
END
$compatibility_rpc$;
SET LOCAL ROLE anon;
DO $public$
DECLARE visible_count integer;
BEGIN
  SELECT count(*) INTO visible_count FROM public.harvest_listings;
  IF visible_count <> 1 THEN
    RAISE EXCEPTION 'FAIL: public should see the immediately published, available listing; saw %', visible_count;
  END IF;
END
$public$;

RESET ROLE;
ROLLBACK;
