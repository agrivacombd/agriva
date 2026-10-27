-- Persist multiple self-selected AGRIVA roles without granting privileged access.
-- Role membership remains separate from the legacy primary profile role.
ALTER TABLE public.user_role_memberships
  DROP CONSTRAINT IF EXISTS user_role_memberships_role_check;

ALTER TABLE public.user_role_memberships
  ADD CONSTRAINT user_role_memberships_role_check
  CHECK (role IN (
    'farmer', 'seller', 'reseller', 'buyer', 'job_seeker', 'worker',
    'employer', 'expert', 'educator', 'transport_provider', 'organization', 'admin',
    'transport', 'student', 'agriculturist', 'rooftop_gardener'
  ));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_role public.user_role;
  v_selected_role text;
  v_roles jsonb;
BEGIN
  -- Client metadata may choose only non-privileged profile roles.
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

  -- Preserve the server-controlled primary role membership.
  INSERT INTO public.user_role_memberships (user_id, role)
  SELECT p.id, p.role::text
  FROM public.profiles p
  WHERE p.id = NEW.id
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Validate and save only known non-admin selections from signup metadata.
  v_roles := CASE
    WHEN jsonb_typeof(NEW.raw_user_meta_data -> 'selected_roles') = 'array'
      THEN NEW.raw_user_meta_data -> 'selected_roles'
    ELSE '[]'::jsonb
  END;

  FOR v_selected_role IN
    SELECT DISTINCT value
    FROM jsonb_array_elements_text(v_roles) AS item(value)
    WHERE value IN (
      'farmer', 'buyer', 'seller', 'transport', 'job_seeker',
      'employer', 'student', 'agriculturist', 'rooftop_gardener'
    )
  LOOP
    INSERT INTO public.user_role_memberships (user_id, role)
    VALUES (NEW.id, v_selected_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$function$;


-- Allow signed-in users to manage only their own non-privileged role selections.
CREATE OR REPLACE FUNCTION public.update_my_role_memberships(p_roles text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_role text;
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

  IF EXISTS (SELECT 1 FROM unnest(p_roles) AS requested(role) WHERE NOT (requested.role = ANY(v_allowed))) THEN
    RAISE EXCEPTION 'One or more roles are not allowed';
  END IF;

  -- Keep the trusted primary role and any admin membership untouched.
  DELETE FROM public.user_role_memberships
  WHERE user_id = v_user_id
    AND role <> ALL(ARRAY['admin']::text[])
    AND role NOT IN (
      SELECT p.role::text FROM public.profiles p WHERE p.id = v_user_id
    )
    ;

  FOREACH v_role IN ARRAY (SELECT array_agg(DISTINCT item.role) FROM unnest(p_roles) AS item(role))
  LOOP
    INSERT INTO public.user_role_memberships (user_id, role)
    VALUES (v_user_id, v_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_my_role_memberships(text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_my_role_memberships(text[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_my_role_memberships(text[]) TO authenticated;
