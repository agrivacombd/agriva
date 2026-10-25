-- Keep legacy profile role and role memberships synchronized for new signups
-- and administrative primary-role changes. Signup metadata can only set the
-- existing low-risk farmer/reseller primary roles; admin remains privileged.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_role public.user_role;
BEGIN
  v_role := CASE
    WHEN (NEW.raw_user_meta_data ->> 'role') IN ('farmer', 'reseller')
      THEN (NEW.raw_user_meta_data ->> 'role')::public.user_role
    ELSE 'farmer'::public.user_role
  END;

  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data ->> 'full_name', ''),
    coalesce(NEW.raw_user_meta_data ->> 'phone', ''),
    v_role
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_role_memberships (user_id, role)
  SELECT p.id, p.role::text
  FROM public.profiles p
  WHERE p.id = NEW.id
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(p_user_id uuid, p_role public.user_role)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  result public.profiles;
  previous_role public.user_role;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  IF p_user_id IS NULL OR p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  IF p_role NOT IN ('farmer', 'reseller') THEN
    RAISE EXCEPTION 'Admin role changes require a separate privileged process';
  END IF;

  SELECT role INTO previous_role
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  UPDATE public.profiles
  SET role = p_role, updated_at = now()
  WHERE id = p_user_id
  RETURNING * INTO result;

  INSERT INTO public.user_role_memberships (user_id, role)
  VALUES (result.id, result.role::text)
  ON CONFLICT (user_id, role) DO NOTHING;

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
