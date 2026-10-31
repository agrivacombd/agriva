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
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO PUBLIC;

CREATE TABLE public.profiles (id uuid PRIMARY KEY, role text NOT NULL);
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  status text NOT NULL
);
INSERT INTO auth.users(id) VALUES
  ('10000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000003');
INSERT INTO public.profiles(id, role) VALUES
  ('10000000-0000-0000-0000-000000000001', 'farmer'),
  ('10000000-0000-0000-0000-000000000002', 'admin'),
  ('10000000-0000-0000-0000-000000000003', 'farmer');
INSERT INTO public.products(name, category, status) VALUES ('Plant seed', 'plants-gardening', 'active');

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

\i supabase/migrations/20261030183610_green_exchange_reconcile.sql
\i supabase/migrations/20261030183617_green_living_reconcile.sql
\i supabase/migrations/20261030183622_green_living_fk_indexes.sql

-- Every new private table is RLS-protected.
DO $rls$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.garden_plants'::regclass)
    OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.garden_care_tasks'::regclass)
    OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.garden_activity_logs'::regclass)
    OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.green_exchange_listings'::regclass)
    OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.green_exchange_requests'::regclass) THEN
    RAISE EXCEPTION 'FAIL: all Green Living and Green Exchange tables must have RLS enabled';
  END IF;
END
$rls$;

-- User 1 creates private Garden records and an unapproved exchange listing.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
INSERT INTO public.garden_plants(id, owner_id, plant_name, plant_type)
VALUES ('20000000-0000-0000-0000-000000000001', auth.uid(), 'মরিচ গাছ', 'vegetable');
INSERT INTO public.garden_care_tasks(owner_id, plant_id, task_type, title, due_on)
VALUES (auth.uid(), '20000000-0000-0000-0000-000000000001', 'water', 'পানি দিন', current_date);
INSERT INTO public.green_exchange_listings(
  id, owner_id, slug, title, plant_name, description, exchange_type, area, status
) VALUES (
  '30000000-0000-0000-0000-000000000001', auth.uid(), 'chili-seedling',
  'মরিচের চারা বিনিময়', 'মরিচ', 'সুস্থ মরিচের চারা বিনিময়ের জন্য প্রস্তুত।',
  'plant_swap', 'ধানমন্ডি', 'active'
);

DO $owner_visible$
BEGIN
  IF (SELECT count(*) FROM public.garden_plants) <> 1
    OR (SELECT count(*) FROM public.garden_care_tasks) <> 1
    OR (SELECT moderation_status FROM public.green_exchange_listings WHERE id='30000000-0000-0000-0000-000000000001') <> 'pending' THEN
    RAISE EXCEPTION 'FAIL: owner records or pending moderation defaults are incorrect';
  END IF;
END
$owner_visible$;

-- User 3 must not read or alter User 1's private Garden data.
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
DO $non_owner$
DECLARE affected integer;
BEGIN
  IF (SELECT count(*) FROM public.garden_plants) <> 0
    OR (SELECT count(*) FROM public.garden_care_tasks) <> 0 THEN
    RAISE EXCEPTION 'FAIL: another user can read private Garden records';
  END IF;
  UPDATE public.garden_plants SET nickname='forged' WHERE id='20000000-0000-0000-0000-000000000001';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN
    RAISE EXCEPTION 'FAIL: another user can update a private Garden record';
  END IF;
END
$non_owner$;

-- Admins can review pending listings, but ordinary users and anonymous visitors cannot.
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
DO $admin_read$
BEGIN
  IF (SELECT count(*) FROM public.green_exchange_listings) <> 1 THEN
    RAISE EXCEPTION 'FAIL: admin must be able to read pending exchange listings';
  END IF;
END
$admin_read$;

-- Anonymous users cannot see a pending exchange listing.
RESET ROLE;
SET LOCAL ROLE anon;
DO $pending_private$
BEGIN
  IF (SELECT count(*) FROM public.green_exchange_listings) <> 0 THEN
    RAISE EXCEPTION 'FAIL: pending exchange listing is public';
  END IF;
END
$pending_private$;

-- A profile-backed admin approves the listing through the restricted RPC.
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
SELECT public.admin_moderate_green_exchange_listing('30000000-0000-0000-0000-000000000001', 'approved');

-- User 3 requests the exchange; the owner responds; both participants confirm completion.
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
INSERT INTO public.green_exchange_requests(id, listing_id, requester_id, message, offered_item)
VALUES (
  '40000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  auth.uid(),
  'আমি আপনার চারাটি নিতে আগ্রহী, বিনিময়ে টব দেব।',
  'একটি মাঝারি টব'
);
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
SELECT public.respond_green_exchange_request('40000000-0000-0000-0000-000000000001', 'accepted', NULL);
SELECT public.confirm_green_exchange_completion('40000000-0000-0000-0000-000000000001');

DO $one_sided$
BEGIN
  IF (SELECT status FROM public.green_exchange_requests WHERE id='40000000-0000-0000-0000-000000000001') <> 'accepted'
    OR (SELECT owner_completed_at FROM public.green_exchange_requests WHERE id='40000000-0000-0000-0000-000000000001') IS NULL
    OR (SELECT requester_completed_at FROM public.green_exchange_requests WHERE id='40000000-0000-0000-0000-000000000001') IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: one-sided completion must not mark an exchange completed';
  END IF;
END
$one_sided$;

SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
SELECT public.confirm_green_exchange_completion('40000000-0000-0000-0000-000000000001');

RESET ROLE;
DO $complete$
DECLARE metrics record;
BEGIN
  IF (SELECT status FROM public.green_exchange_requests WHERE id='40000000-0000-0000-0000-000000000001') <> 'completed' THEN
    RAISE EXCEPTION 'FAIL: both participant confirmations must complete the exchange';
  END IF;
  SELECT * INTO metrics FROM public.get_green_impact_metrics();
  IF metrics.approved_exchange_listings <> 1
    OR metrics.active_marketplace_products <> 1
    OR metrics.completed_exchange_requests <> 1 THEN
    RAISE EXCEPTION 'FAIL: aggregate Green Impact metrics are incorrect: %', row_to_json(metrics);
  END IF;
  IF has_function_privilege('anon', 'public.admin_moderate_green_exchange_listing(uuid,text)', 'EXECUTE')
    OR has_function_privilege('anon', 'public.respond_green_exchange_request(uuid,text,text)', 'EXECUTE')
    OR has_function_privilege('anon', 'public.confirm_green_exchange_completion(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: anonymous role must not execute privileged exchange RPCs';
  END IF;
  IF NOT has_function_privilege('anon', 'public.get_green_impact_metrics()', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: anonymous role should read aggregate Green Impact metrics';
  END IF;
END
$complete$;

ROLLBACK;
