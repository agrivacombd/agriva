-- Persist multiple self-selected AGRIVA roles without granting privileged access.
-- Role membership is the source of truth for dashboard personalization; profiles.role
-- remains a legacy compatibility field and is not forced into every new user's roles.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS selected_roles text[] NOT NULL DEFAULT ARRAY['farmer']::text[];

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_selected_roles_allowed;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_selected_roles_allowed
  CHECK (
    cardinality(selected_roles) BETWEEN 1 AND 9
    AND selected_roles <@ ARRAY['farmer', 'buyer', 'seller', 'transport', 'job_seeker', 'employer', 'student', 'agriculturist', 'rooftop_gardener']::text[]
  );

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
  v_selected_roles text[];
BEGIN
  -- Keep the legacy profile field non-privileged. It is not used as a role grant.
  v_role := CASE
    WHEN (NEW.raw_user_meta_data ->> 'role') IN ('farmer', 'reseller')
      THEN (NEW.raw_user_meta_data ->> 'role')::public.user_role
    ELSE 'farmer'::public.user_role
  END;

  v_roles := CASE
    WHEN jsonb_typeof(NEW.raw_user_meta_data -> 'selected_roles') = 'array'
      THEN NEW.raw_user_meta_data -> 'selected_roles'
    ELSE '[]'::jsonb
  END;

  SELECT coalesce(array_agg(DISTINCT value), ARRAY['farmer']::text[])
    INTO v_selected_roles
  FROM jsonb_array_elements_text(v_roles) AS item(value)
  WHERE value IN (
    'farmer', 'buyer', 'seller', 'transport', 'job_seeker',
    'employer', 'student', 'agriculturist', 'rooftop_gardener'
  );

  INSERT INTO public.profiles (id, full_name, phone, role, selected_roles)
  VALUES (
    NEW.id,
    coalesce(nullif(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''), ''),
    nullif(btrim(NEW.raw_user_meta_data ->> 'phone'), ''),
    v_role,
    v_selected_roles
  )
  ON CONFLICT (id) DO NOTHING;

  -- Only explicitly selected, allow-listed roles become memberships.
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

  -- Preserve compatibility for signup paths that do not submit role selections.
  IF NOT EXISTS (
    SELECT 1 FROM public.user_role_memberships WHERE user_id = NEW.id
  ) THEN
    INSERT INTO public.user_role_memberships (user_id, role)
    VALUES (NEW.id, 'farmer')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Users may update only their own non-admin role selections.
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

  IF EXISTS (
    SELECT 1 FROM unnest(p_roles) AS requested(role)
    WHERE NOT (requested.role = ANY(v_allowed))
  ) THEN
    RAISE EXCEPTION 'One or more roles are not allowed';
  END IF;

  -- Admin memberships are managed only by trusted administrators.
  DELETE FROM public.user_role_memberships
  WHERE user_id = v_user_id
    AND role <> 'admin';

  UPDATE public.profiles
  SET selected_roles = ARRAY(SELECT DISTINCT requested.role FROM unnest(p_roles) AS requested(role))
  WHERE id = v_user_id;

  FOREACH v_role IN ARRAY (
    SELECT array_agg(DISTINCT item.role)
    FROM unnest(p_roles) AS item(role)
  )
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
