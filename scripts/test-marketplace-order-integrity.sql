-- Disposable PostgreSQL integration fixture for PR #361.
-- This runs only in a GitHub Actions postgres service, never against Supabase.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS auth;
DO $$ BEGIN
  CREATE ROLE authenticated NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE ROLE anon NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('test.is_admin', true), '')::boolean
$$;
CREATE OR REPLACE FUNCTION public.has_module_access(text,text,text,uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT true $$;

CREATE TABLE public.profiles (id uuid PRIMARY KEY);
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL,
  stock integer NOT NULL CHECK (stock >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  status text NOT NULL
);
CREATE TABLE public.marketplace_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL,
  status text NOT NULL,
  shipped_at timestamptz,
  delivered_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.reseller_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.marketplace_orders(id),
  status text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Minimal trusted finalizer stand-in. It models the stock reservation contract
-- while the migration under test supplies the real idempotency wrapper.
CREATE OR REPLACE FUNCTION public.finalize_marketplace_cod_order_safe(
  p_product_id uuid, p_quantity integer, p_shipping_address jsonb,
  p_attribution_code text DEFAULT NULL, p_visitor_token text DEFAULT NULL
) RETURNS public.marketplace_orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE p public.products; o public.marketplace_orders;
BEGIN
  SELECT * INTO p FROM public.products WHERE id=p_product_id FOR UPDATE;
  IF NOT FOUND OR p.stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock' USING ERRCODE='23514';
  END IF;
  UPDATE public.products SET stock=stock-p_quantity, updated_at=now() WHERE id=p.id;
  INSERT INTO public.marketplace_orders(farmer_id,product_id,quantity,status)
  VALUES (p.farmer_id,p.id,p_quantity,'processing') RETURNING * INTO o;
  RETURN o;
END $$;

INSERT INTO public.profiles(id) VALUES
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222'),
 ('33333333-3333-4333-8333-333333333333');
INSERT INTO public.organizations(owner_id,status)
VALUES ('22222222-2222-4222-8222-222222222222','verified');

INSERT INTO public.products(id,farmer_id,stock) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222',10),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222',10);

-- Apply the exact PR migration to this disposable schema.
\i supabase/migrations/20261120140000_marketplace_order_integrity_idempotency.sql

GRANT USAGE ON SCHEMA public, auth TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_marketplace_cod_order_idempotent(uuid,integer,jsonb,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_marketplace_order_status(uuid,text) TO authenticated;

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
SELECT set_config('test.is_admin','false',false);

DO $$
DECLARE first_order public.marketplace_orders; replay_order public.marketplace_orders;
        stock_after integer; changed_payload_rejected boolean := false;
BEGIN
  SELECT * INTO first_order FROM public.finalize_marketplace_cod_order_idempotent(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',2,'{"city":"Dhaka"}','buy_now_key_000001',NULL,NULL
  );
  SELECT * INTO replay_order FROM public.finalize_marketplace_cod_order_idempotent(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',2,'{"city":"Dhaka"}','buy_now_key_000001',NULL,NULL
  );
  IF first_order.id <> replay_order.id THEN RAISE EXCEPTION 'Idempotent replay created a second order'; END IF;
  SELECT stock INTO stock_after FROM public.products WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  IF stock_after <> 8 THEN RAISE EXCEPTION 'Replay decremented stock more than once: %',stock_after; END IF;
  BEGIN
    PERFORM public.finalize_marketplace_cod_order_idempotent(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',3,'{"city":"Dhaka"}','buy_now_key_000001',NULL,NULL
    );
  EXCEPTION WHEN SQLSTATE '22023' THEN changed_payload_rejected := true;
  END;
  IF NOT changed_payload_rejected THEN RAISE EXCEPTION 'Changed payload reused idempotency key'; END IF;
END $$;

-- A seller must not cancel a shipped order.
DO $$
DECLARE order_id uuid; rejected boolean := false; stock_before integer;
BEGIN
  INSERT INTO public.marketplace_orders(farmer_id,product_id,quantity,status,shipped_at)
  VALUES ('22222222-2222-4222-8222-222222222222',
          'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',2,'shipped',now())
  RETURNING id INTO order_id;
  SELECT stock INTO stock_before FROM public.products WHERE id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  PERFORM set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
  BEGIN
    PERFORM public.set_marketplace_order_status(order_id,'cancelled');
  EXCEPTION WHEN SQLSTATE '22023' THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Seller cancelled a shipped order'; END IF;
  IF (SELECT stock FROM public.products WHERE id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') <> stock_before
    THEN RAISE EXCEPTION 'Rejected seller cancellation changed stock'; END IF;
END $$;

-- An admin refund after shipment must not automatically restore stock.
DO $$
DECLARE order_id uuid; stock_before integer;
BEGIN
  INSERT INTO public.marketplace_orders(farmer_id,product_id,quantity,status,shipped_at)
  VALUES ('22222222-2222-4222-8222-222222222222',
          'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',2,'shipped',now())
  RETURNING id INTO order_id;
  SELECT stock INTO stock_before FROM public.products WHERE id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  PERFORM set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false);
  PERFORM set_config('test.is_admin','true',false);
  PERFORM public.set_marketplace_order_status(order_id,'refunded');
  IF (SELECT stock FROM public.products WHERE id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') <> stock_before
    THEN RAISE EXCEPTION 'Post-shipment refund incorrectly restocked inventory'; END IF;
END $$;

-- Pending cancellation restores reserved stock exactly once.
DO $$
DECLARE order_id uuid; stock_before integer; restored integer; repeated_rejected boolean := false;
BEGIN
  INSERT INTO public.marketplace_orders(farmer_id,product_id,quantity,status)
  VALUES ('22222222-2222-4222-8222-222222222222',
          'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',3,'pending')
  RETURNING id INTO order_id;
  SELECT stock INTO stock_before FROM public.products WHERE id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  PERFORM public.set_marketplace_order_status(order_id,'cancelled');
  SELECT stock INTO restored FROM public.products WHERE id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  IF restored <> stock_before+3 THEN RAISE EXCEPTION 'Pending cancellation did not restore stock once'; END IF;
  BEGIN
    PERFORM public.set_marketplace_order_status(order_id,'refunded');
  EXCEPTION WHEN SQLSTATE '22023' THEN repeated_rejected := true;
  END;
  IF NOT repeated_rejected THEN RAISE EXCEPTION 'Closed order accepted a second restock transition'; END IF;
  IF (SELECT stock FROM public.products WHERE id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') <> restored
    THEN RAISE EXCEPTION 'Repeated close transition changed stock'; END IF;
END $$;

RESET ROLE;
SELECT 'marketplace order integrity integration tests passed' AS result;
