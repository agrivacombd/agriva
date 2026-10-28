-- The legacy user-role RPC only changes profiles.role. In the multi-role model,
-- an admin/super_admin membership would survive a profile-role demotion and keep
-- platform access. This limited RPC must not be used to demote privileged users.
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_user_id uuid,
  p_role public.user_role
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  result public.profiles;
  previous_role public.user_role;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_platform_admin_access() THEN
    RAISE EXCEPTION 'Platform admin permission required' USING ERRCODE = '42501';
  END IF;

  IF p_user_id IS NULL OR p_role IS NULL THEN
    RAISE EXCEPTION 'User ID and role are required' USING ERRCODE = '22023';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role' USING ERRCODE = '42501';
  END IF;
  IF p_role NOT IN ('farmer', 'reseller') THEN
    RAISE EXCEPTION 'Admin role changes require a separate privileged process' USING ERRCODE = '22023';
  END IF;

  SELECT p.role INTO previous_role
  FROM public.profiles p
  WHERE p.id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  IF previous_role IN ('admin', 'super_admin') OR EXISTS (
    SELECT 1
    FROM public.user_role_memberships m
    WHERE m.user_id = p_user_id AND m.role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Privileged accounts require the dedicated platform-admin revocation workflow'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET role = p_role, updated_at = now()
  WHERE id = p_user_id
  RETURNING * INTO result;

  INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'user.role_changed',
    'profile',
    result.id,
    jsonb_build_object('from', previous_role, 'to', result.role)
  );

  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, public.user_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.user_role) TO authenticated;
