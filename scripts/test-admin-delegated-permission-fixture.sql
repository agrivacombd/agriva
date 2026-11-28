-- Replace the permissive P0 test stub with the production delegated-role semantics.
-- This supplemental fixture runs only in disposable local Supabase CI.
CREATE TABLE IF NOT EXISTS public.admin_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role_id uuid NOT NULL REFERENCES public.admin_roles(id),
  scope_type text NOT NULL DEFAULT 'global',
  scope_id uuid,
  granted_by uuid,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE OR REPLACE FUNCTION public.has_admin_permission(p_capability text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.admin_user_roles ur
    JOIN public.admin_role_permissions rp ON rp.role_id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND rp.capability = p_capability
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
      AND ur.scope_type = 'global'
      AND ur.scope_id IS NULL
  );
$function$;


-- Production catalog functions required by the search_path migration.
-- These inert stubs exist only so ALTER FUNCTION can be exercised in CI.
CREATE OR REPLACE FUNCTION public.bulk_select_item_offer(p_offer uuid)
RETURNS uuid LANGUAGE sql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$ SELECT NULL::uuid $function$;

CREATE OR REPLACE FUNCTION public.bulk_select_quote(p_quote uuid)
RETURNS uuid LANGUAGE sql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$ SELECT NULL::uuid $function$;

CREATE OR REPLACE FUNCTION public.bulk_submit_multi_quote(
  p_request uuid, p_items jsonb, p_lead_days integer, p_details text
)
RETURNS uuid LANGUAGE sql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$ SELECT NULL::uuid $function$;
