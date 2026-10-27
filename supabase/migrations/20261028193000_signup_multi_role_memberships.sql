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
