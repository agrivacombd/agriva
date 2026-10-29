-- Align product moderation's platform-admin branch with the shared helper.
-- Keep the existing membership fallback; the helper also recognizes profile-provisioned super_admin users.
DO $migration$
DECLARE
  v_signature text;
  v_oid regprocedure;
  v_definition text;
  v_updated text;
BEGIN
  FOREACH v_signature IN ARRAY ARRAY[
    'public.enforce_seller_product_moderation()',
    'public.admin_moderate_marketplace_product(uuid,text,text)'
  ]
  LOOP
    v_oid := to_regprocedure(v_signature);
    IF v_oid IS NULL THEN
      RAISE EXCEPTION 'Required product moderation function is missing: %', v_signature;
    END IF;
    v_definition := pg_get_functiondef(v_oid);
    v_updated := replace(v_definition, 'public.is_admin()', 'public.has_platform_admin_access()');
    IF v_updated = v_definition THEN
      RAISE EXCEPTION 'Could not align platform-admin check in %', v_signature;
    END IF;
    EXECUTE v_updated;
  END LOOP;
END;
$migration$;
