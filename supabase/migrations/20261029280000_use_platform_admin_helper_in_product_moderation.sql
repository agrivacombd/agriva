-- Ensure profile-provisioned super_admin accounts use the same platform-admin
-- branch in product moderation as membership-provisioned administrators.
-- The shared helper was aligned in the prior migration, but these two functions
-- still had inline legacy checks that could downgrade a profile super_admin to
-- the narrower product-moderator branch.
DO $migration$
DECLARE
  v_signature text;
  v_oid regprocedure;
  v_definition text;
  v_updated text;
  v_old_trigger constant text := $old$
v_is_platform_admin boolean := auth.uid() IS NOT NULL AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.user_role_memberships m
      WHERE m.user_id = auth.uid() AND m.role IN ('admin', 'super_admin')
    )
  );$old$;
  v_new_trigger constant text := $new$
v_is_platform_admin boolean := auth.uid() IS NOT NULL AND public.has_platform_admin_access();$new$;
  v_old_rpc constant text := $oldrpc$
v_is_platform_admin boolean := public.is_admin() OR EXISTS (
    SELECT 1 FROM public.user_role_memberships m
    WHERE m.user_id = auth.uid() AND m.role IN ('admin', 'super_admin')
  );$oldrpc$;
  v_new_rpc constant text := $newrpc$
v_is_platform_admin boolean := public.has_platform_admin_access();$newrpc$;
BEGIN
  v_signature := 'public.enforce_seller_product_moderation()';
  v_oid := to_regprocedure(v_signature);
  IF v_oid IS NULL THEN
    RAISE EXCEPTION 'Required product moderation trigger function is missing';
  END IF;
  v_definition := pg_get_functiondef(v_oid);
  v_updated := replace(v_definition, v_old_trigger, v_new_trigger);
  IF v_updated = v_definition THEN
    RAISE EXCEPTION 'Could not align platform-admin check in enforce_seller_product_moderation';
  END IF;
  EXECUTE v_updated;

  v_signature := 'public.admin_moderate_marketplace_product(uuid,text,text)';
  v_oid := to_regprocedure(v_signature);
  IF v_oid IS NULL THEN
    RAISE EXCEPTION 'Required product moderation RPC is missing';
  END IF;
  v_definition := pg_get_functiondef(v_oid);
  v_updated := replace(v_definition, v_old_rpc, v_new_rpc);
  IF v_updated = v_definition THEN
    RAISE EXCEPTION 'Could not align platform-admin check in admin_moderate_marketplace_product';
  END IF;
  EXECUTE v_updated;
END;
$migration$;
