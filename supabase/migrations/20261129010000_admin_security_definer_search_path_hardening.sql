-- Harden the remaining authenticated-callable bulk SECURITY DEFINER RPCs.
-- Keep this as a reviewed migration candidate; never apply directly to production.
-- pg_catalog first prevents object shadowing while preserving explicitly qualified public objects.
ALTER FUNCTION public.bulk_select_item_offer(uuid)
  SET search_path TO 'pg_catalog', 'public', 'pg_temp';

ALTER FUNCTION public.bulk_select_quote(uuid)
  SET search_path TO 'pg_catalog', 'public', 'pg_temp';

ALTER FUNCTION public.bulk_submit_multi_quote(uuid, jsonb, integer, text)
  SET search_path TO 'pg_catalog', 'public', 'pg_temp';

-- These are authenticated user actions, never anonymous/public RPC endpoints.
-- Remove PostgreSQL's default PUBLIC EXECUTE privilege and grant only the intended role.
REVOKE ALL ON FUNCTION public.bulk_select_item_offer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bulk_select_item_offer(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.bulk_select_quote(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bulk_select_quote(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.bulk_submit_multi_quote(uuid, jsonb, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bulk_submit_multi_quote(uuid, jsonb, integer, text) TO authenticated;
