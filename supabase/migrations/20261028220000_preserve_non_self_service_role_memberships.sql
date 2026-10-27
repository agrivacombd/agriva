-- Preserve memberships that are not managed by the self-service profile role picker.
-- Only the nine allow-listed self-service roles are replaced by update_my_role_memberships.
CREATE OR REPLACE FUNCTION public.update_my_role_memberships(p_roles text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_allowed text[] := ARRAY[
    'farmer', 'buyer', 'seller', 'transport', 'job_seeker',
    'employer', 'student', 'agriculturist', 'rooftop_gardener'
  ]::text[];
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_roles IS NULL OR cardinality(p_roles) < 1 OR cardinality(p_roles) > 9 THEN
    RAISE EXCEPTION 'Select between one and nine roles';
  END IF;

  IF EXISTS (
    SELECT 1 FROM unnest(p_roles) AS requested(role)
    WHERE NOT (requested.role = ANY(v_allowed))
  ) THEN
    RAISE EXCEPTION 'One or more roles are not allowed';
  END IF;

  -- Replace only self-service memberships. Preserve admin and any separately
  -- managed memberships (for example worker, expert, educator, or organization).
  DELETE FROM public.user_role_memberships
  WHERE user_id = v_user_id
    AND role = ANY(v_allowed);

  UPDATE public.profiles
  SET selected_roles = ARRAY(SELECT DISTINCT requested.role FROM unnest(p_roles) AS requested(role))
  WHERE id = v_user_id;

  INSERT INTO public.user_role_memberships (user_id, role)
  SELECT v_user_id, requested.role
  FROM (SELECT DISTINCT role FROM unnest(p_roles) AS item(role)) AS requested
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_my_role_memberships(text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_my_role_memberships(text[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_my_role_memberships(text[]) TO authenticated;
