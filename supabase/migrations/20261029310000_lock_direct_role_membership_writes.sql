-- Role grants/revocations must go through audited SECURITY DEFINER RPCs.
-- Authenticated users need to read their own memberships, but must not mutate
-- the membership table directly and bypass admin_set_staff_role / role RPC audit.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_role_memberships FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_role_memberships FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_role_memberships FROM authenticated;
GRANT SELECT ON TABLE public.user_role_memberships TO authenticated;

DO $validation$
BEGIN
  IF has_table_privilege('authenticated', 'public.user_role_memberships', 'INSERT')
     OR has_table_privilege('authenticated', 'public.user_role_memberships', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.user_role_memberships', 'DELETE') THEN
    RAISE EXCEPTION 'Authenticated users must not have direct role-membership write privileges';
  END IF;
  IF NOT has_table_privilege('authenticated', 'public.user_role_memberships', 'SELECT') THEN
    RAISE EXCEPTION 'Authenticated users must retain role-membership read privileges';
  END IF;
END;
$validation$;
