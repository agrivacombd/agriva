-- Synthetic schema fixture for isolated validation of Admin P0 migrations.
-- Runs only in the disposable local Supabase CI database.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  role text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key text UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS public.admin_role_permissions (
  role_id uuid NOT NULL REFERENCES public.admin_roles(id),
  capability text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, capability)
);
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'pg_catalog','public','pg_temp'
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') $$;
CREATE OR REPLACE FUNCTION public.bulk_is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'pg_catalog','public','pg_temp'
AS $$ SELECT public.is_admin() $$;
CREATE OR REPLACE FUNCTION public.has_admin_permission(p_capability text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'pg_catalog','public','pg_temp'
AS $function$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') AND p_capability IN ('payments.reconcile','seller_access.revoke','seller_access.read') $function$;
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'pg_catalog'
AS $$ BEGIN NULL; END; $$;

CREATE TABLE IF NOT EXISTS public.marketplace_checkouts (
  id uuid PRIMARY KEY,
  payment_method text NOT NULL,
  payment_status text NOT NULL,
  total_amount numeric(12,2) NOT NULL,
  collection_status text NOT NULL DEFAULT 'pending',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.cod_collection_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_id uuid NOT NULL,
  expected_amount numeric(12,2) NOT NULL,
  collected_amount numeric(12,2) NOT NULL,
  cumulative_collected numeric(12,2) NOT NULL,
  discrepancy_amount numeric(12,2) NOT NULL,
  note text,
  collected_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_id uuid NOT NULL,
  payment_status text NOT NULL,
  paid_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.user_module_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module text NOT NULL,
  status text NOT NULL,
  revoked_by uuid,
  revoked_at timestamptz,
  reason text,
  scope_type text NOT NULL,
  scope_id uuid
);
CREATE TABLE IF NOT EXISTS public.module_access_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module text NOT NULL,
  status text NOT NULL,
  organization_id uuid,
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.green_exchange_listings (
  id uuid PRIMARY KEY,
  moderation_status text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY,
  marketplace_channel text NOT NULL,
  shipping_class text,
  shipping_weight_grams integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bulk_requests (
  id uuid PRIMARY KEY,
  buyer_id uuid NOT NULL,
  buyer_type text NOT NULL,
  visibility text NOT NULL,
  status text NOT NULL,
  product_name text NOT NULL,
  specification text NOT NULL DEFAULT '',
  quantity numeric NOT NULL,
  unit text NOT NULL,
  district text NOT NULL,
  upazila text NOT NULL,
  desired_date date,
  quote_deadline timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bulk_requests ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS public.bulk_request_items (
  id uuid PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES public.bulk_requests(id),
  product_name text NOT NULL DEFAULT 'Crop'
);
CREATE TABLE IF NOT EXISTS public.bulk_public_listings (
  id uuid PRIMARY KEY,
  product_name text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  district text NOT NULL,
  upazila text NOT NULL,
  desired_date date,
  quote_deadline timestamptz,
  created_at timestamptz NOT NULL,
  item_count integer NOT NULL
);
CREATE TABLE IF NOT EXISTS public.bulk_wholesalers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  status text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.bulk_invitations (
  id uuid PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES public.bulk_requests(id),
  wholesaler_id uuid NOT NULL REFERENCES public.bulk_wholesalers(user_id),
  revoked_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.bulk_quotes (
  id uuid PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES public.bulk_requests(id),
  wholesaler_id uuid NOT NULL REFERENCES public.bulk_wholesalers(user_id),
  unit_price numeric NOT NULL,
  shipping_fee numeric NOT NULL,
  extra_fee numeric NOT NULL,
  lead_days integer NOT NULL,
  details text NOT NULL,
  expires_at timestamptz NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.bulk_selections (
  request_id uuid PRIMARY KEY REFERENCES public.bulk_requests(id),
  quote_id uuid NOT NULL REFERENCES public.bulk_quotes(id),
  buyer_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  fulfillment_status text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.bulk_item_offers (
  id uuid PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES public.bulk_requests(id),
  quote_id uuid NOT NULL REFERENCES public.bulk_quotes(id),
  item_id uuid NOT NULL REFERENCES public.bulk_request_items(id),
  unit_price numeric NOT NULL,
  shipping_fee numeric NOT NULL,
  extra_fee numeric NOT NULL
);
CREATE TABLE IF NOT EXISTS public.bulk_item_awards (
  item_id uuid PRIMARY KEY REFERENCES public.bulk_request_items(id),
  offer_id uuid NOT NULL REFERENCES public.bulk_item_offers(id),
  request_id uuid NOT NULL REFERENCES public.bulk_requests(id),
  buyer_id uuid NOT NULL REFERENCES auth.users(id),
  fulfillment_status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
