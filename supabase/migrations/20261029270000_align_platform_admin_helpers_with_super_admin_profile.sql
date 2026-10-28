-- Keep database authorization consistent with the application role model.
-- A super_admin provisioned through the protected legacy profiles.role field must
-- be recognized even when the separate membership constraint intentionally does
-- not permit self-service or ordinary staff provisioning of super_admin.
CREATE OR REPLACE FUNCTION public.has_platform_admin_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
    OR EXISTS (
      SELECT 1 FROM public.user_role_memberships m
      WHERE m.user_id = auth.uid() AND m.role IN ('admin', 'super_admin')
    )
  );
$function$;

REVOKE ALL ON FUNCTION public.has_platform_admin_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_platform_admin_access() TO authenticated, service_role;

-- Product moderation uses a separate helper, so align its legacy profile path too.
CREATE OR REPLACE FUNCTION public.has_product_moderation_permission()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
    OR EXISTS (
      SELECT 1 FROM public.user_role_memberships m
      WHERE m.user_id = auth.uid()
        AND m.role IN ('admin', 'super_admin', 'product_moderator')
    )
  );
$function$;

REVOKE ALL ON FUNCTION public.has_product_moderation_permission() FROM PUBLIC, anon, authenticated;
