-- A staff role can be represented in either the legacy profiles.role column or
-- the canonical membership table. Revocation must remove both representations
-- or the profile role would continue to grant the capability after membership deletion.
CREATE OR REPLACE FUNCTION public.admin_set_staff_role(
  p_user_id uuid,
  p_role text,
  p_enabled boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  allowed_roles constant text[] := ARRAY[
    'operations', 'product_moderator', 'content_seo_manager',
    'marketing_manager', 'finance_manager', 'support_agent'
  ]::text[];
  previous_profile_role text;
  new_profile_role text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_platform_admin_access() THEN
    RAISE EXCEPTION 'Platform admin permission required' USING ERRCODE = '42501';
  END IF;

  IF p_user_id IS NULL OR p_role IS NULL
     OR NOT (p_role = ANY(allowed_roles)) OR p_enabled IS NULL THEN
    RAISE EXCEPTION 'Invalid staff role assignment' USING ERRCODE = '22023';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Self-service staff role changes are not allowed' USING ERRCODE = '42501';
  END IF;

  SELECT p.role::text INTO previous_profile_role
  FROM public.profiles p
  WHERE p.id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user profile not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_enabled THEN
    INSERT INTO public.user_role_memberships(user_id, role)
    VALUES (p_user_id, p_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    new_profile_role := previous_profile_role;
  ELSE
    DELETE FROM public.user_role_memberships
    WHERE user_id = p_user_id AND role = p_role;

    -- Legacy profile-role grants are still included by application authorization.
    -- Normalize only when the revoked staff role is the profile's primary role.
    IF previous_profile_role = p_role THEN
      UPDATE public.profiles
      SET role = 'farmer', updated_at = now()
      WHERE id = p_user_id;
      new_profile_role := 'farmer';
    ELSE
      new_profile_role := previous_profile_role;
    END IF;
  END IF;

  INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    CASE WHEN p_enabled THEN 'staff.role.granted' ELSE 'staff.role.revoked' END,
    'user',
    p_user_id,
    jsonb_build_object(
      'role', p_role,
      'enabled', p_enabled,
      'profile_role_before', previous_profile_role,
      'profile_role_after', new_profile_role
    )
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_set_staff_role(uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_staff_role(uuid, text, boolean) TO authenticated;
