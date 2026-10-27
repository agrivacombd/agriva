-- Honor only explicitly supported self-service roles from auth metadata.
-- Privileged admin access can never be granted through public signup metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  requested_role text := new.raw_user_meta_data->>'role';
  safe_role public.user_role;
BEGIN
  IF requested_role IN (
    'farmer', 'buyer', 'seller', 'transport_provider',
    'student', 'agronomist', 'gardener', 'reseller'
  ) THEN
    safe_role := requested_role::public.user_role;
  ELSE
    safe_role := 'farmer'::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data->>'full_name'), ''), ''),
    nullif(btrim(new.raw_user_meta_data->>'phone'), ''),
    safe_role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;
