-- Align the legacy product-status trigger with the newer scoped moderation
-- workflow. Platform admins use the shared platform-admin helper; scoped
-- moderators may update status only where enforce_seller_product_moderation()
-- permits a valid, attributed, non-self moderation transition.
CREATE OR REPLACE FUNCTION public.guard_product_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
BEGIN
  -- Trusted server/service-role operations may have no auth.uid(); preserve
  -- that established workflow.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS DISTINCT FROM 'draft'::public.product_status
       AND NOT public.has_platform_admin_access() THEN
      RAISE EXCEPTION 'Only a platform administrator may publish a product on insert'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT public.has_platform_admin_access()
     AND NOT public.has_product_moderation_permission() THEN
    RAISE EXCEPTION 'Product status changes require moderation permission'
      USING ERRCODE = '42501';
  END IF;

  -- Product-moderator scope, ownership checks, transition validation and audit
  -- attribution are enforced by enforce_seller_product_moderation().
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_product_status_change() FROM PUBLIC, anon, authenticated;
