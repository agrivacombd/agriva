-- Disposable PostgreSQL regression test for the farm/crop-cycle RLS migration.
-- Run only against a fresh local/CI database; never point this at Supabase Production.
\set ON_ERROR_STOP on

CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE
AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth TO PUBLIC;
GRANT EXECUTE ON FUNCTION auth.uid() TO PUBLIC;

CREATE TABLE public.farms (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL
);
CREATE TABLE public.crop_cycles (
  id uuid PRIMARY KEY,
  farm_id uuid NOT NULL REFERENCES public.farms(id),
  owner_id uuid NOT NULL
);
CREATE TABLE public.farm_expenses (
  id bigserial PRIMARY KEY,
  owner_id uuid NOT NULL,
  farm_id uuid NOT NULL REFERENCES public.farms(id),
  crop_cycle_id uuid NULL REFERENCES public.crop_cycles(id)
);
CREATE TABLE public.farm_sales (
  id bigserial PRIMARY KEY,
  owner_id uuid NOT NULL,
  farm_id uuid NOT NULL REFERENCES public.farms(id),
  crop_cycle_id uuid NULL REFERENCES public.crop_cycles(id)
);

GRANT SELECT ON public.farms, public.crop_cycles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.farm_expenses, public.farm_sales TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.farm_expenses_id_seq, public.farm_sales_id_seq TO authenticated;

INSERT INTO public.farms (id, owner_id) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111');
INSERT INTO public.crop_cycles (id, farm_id, owner_id) VALUES
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111'),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111');

ALTER TABLE public.farm_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_sales ENABLE ROW LEVEL SECURITY;

-- Reproduce the current faulty policies first, so the migration under test must replace them.
CREATE POLICY farm_expenses_owner_select ON public.farm_expenses FOR SELECT TO public USING ((select auth.uid()) = owner_id);
CREATE POLICY farm_expenses_owner_insert ON public.farm_expenses FOR INSERT TO public WITH CHECK (
  (select auth.uid()) = owner_id
  AND EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_expenses.farm_id AND f.owner_id = (select auth.uid()))
  AND (crop_cycle_id IS NULL OR EXISTS (SELECT 1 FROM public.crop_cycles c WHERE c.id = farm_expenses.crop_cycle_id AND c.farm_id = c.farm_id AND c.owner_id = (select auth.uid())))
);
CREATE POLICY farm_expenses_owner_update ON public.farm_expenses FOR UPDATE TO public USING ((select auth.uid()) = owner_id) WITH CHECK (
  (select auth.uid()) = owner_id
  AND EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_expenses.farm_id AND f.owner_id = (select auth.uid()))
  AND (crop_cycle_id IS NULL OR EXISTS (SELECT 1 FROM public.crop_cycles c WHERE c.id = farm_expenses.crop_cycle_id AND c.farm_id = c.farm_id AND c.owner_id = (select auth.uid())))
);
CREATE POLICY farm_sales_owner_select ON public.farm_sales FOR SELECT TO public USING ((select auth.uid()) = owner_id);
CREATE POLICY farm_sales_owner_insert ON public.farm_sales FOR INSERT TO public WITH CHECK (
  (select auth.uid()) = owner_id
  AND EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_sales.farm_id AND f.owner_id = (select auth.uid()))
  AND (crop_cycle_id IS NULL OR EXISTS (SELECT 1 FROM public.crop_cycles c WHERE c.id = farm_sales.crop_cycle_id AND c.farm_id = c.farm_id AND c.owner_id = (select auth.uid())))
);
CREATE POLICY farm_sales_owner_update ON public.farm_sales FOR UPDATE TO public USING ((select auth.uid()) = owner_id) WITH CHECK (
  (select auth.uid()) = owner_id
  AND EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_sales.farm_id AND f.owner_id = (select auth.uid()))
  AND (crop_cycle_id IS NULL OR EXISTS (SELECT 1 FROM public.crop_cycles c WHERE c.id = farm_sales.crop_cycle_id AND c.farm_id = c.farm_id AND c.owner_id = (select auth.uid())))
);

\ir ../supabase/migrations/20261026110000_fix_farm_finance_crop_cycle_scope.sql

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);

DO $$
DECLARE
  expense_id bigint;
  sale_id bigint;
  blocked boolean;
BEGIN
  -- Correct farm/cycle combinations and NULL cycles remain allowed.
  INSERT INTO public.farm_expenses (owner_id, farm_id, crop_cycle_id)
  VALUES ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc')
  RETURNING id INTO expense_id;
  INSERT INTO public.farm_expenses (owner_id, farm_id, crop_cycle_id)
  VALUES ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', NULL);
  INSERT INTO public.farm_sales (owner_id, farm_id, crop_cycle_id)
  VALUES ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc')
  RETURNING id INTO sale_id;
  INSERT INTO public.farm_sales (owner_id, farm_id, crop_cycle_id)
  VALUES ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', NULL);

  blocked := false;
  BEGIN
    INSERT INTO public.farm_expenses (owner_id, farm_id, crop_cycle_id)
    VALUES ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd');
  EXCEPTION WHEN insufficient_privilege THEN blocked := true;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'farm_expenses accepted a crop cycle from a different farm'; END IF;

  blocked := false;
  BEGIN
    INSERT INTO public.farm_sales (owner_id, farm_id, crop_cycle_id)
    VALUES ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd');
  EXCEPTION WHEN insufficient_privilege THEN blocked := true;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'farm_sales accepted a crop cycle from a different farm'; END IF;

  blocked := false;
  BEGIN
    UPDATE public.farm_expenses SET crop_cycle_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' WHERE id = expense_id;
  EXCEPTION WHEN insufficient_privilege THEN blocked := true;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'farm_expenses update accepted a crop cycle from a different farm'; END IF;

  blocked := false;
  BEGIN
    UPDATE public.farm_sales SET crop_cycle_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' WHERE id = sale_id;
  EXCEPTION WHEN insufficient_privilege THEN blocked := true;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'farm_sales update accepted a crop cycle from a different farm'; END IF;
END
$$;

RESET ROLE;
SELECT 'farm crop-cycle RLS regression tests passed' AS result;
