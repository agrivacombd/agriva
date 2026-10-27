-- Run after applying 20261027230000_revoke_client_truncate_privileges.sql.
-- Safe regression assertion: checks privileges only; performs no writes.
DO $$
DECLARE
  table_row record;
BEGIN
  FOR table_row IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    IF has_table_privilege('anon', format('%I.%I', table_row.schemaname, table_row.tablename), 'TRUNCATE') THEN
      RAISE EXCEPTION 'anon must not have TRUNCATE on public.%', table_row.tablename;
    END IF;
    IF has_table_privilege('authenticated', format('%I.%I', table_row.schemaname, table_row.tablename), 'TRUNCATE') THEN
      RAISE EXCEPTION 'authenticated must not have TRUNCATE on public.%', table_row.tablename;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM pg_default_acl d
    CROSS JOIN LATERAL aclexplode(d.defaclacl) a
    WHERE d.defaclrole = 'postgres'::regrole
      AND d.defaclnamespace = 'public'::regnamespace
      AND d.defaclobjtype = 'r'
      AND a.grantee IN ('anon'::regrole, 'authenticated'::regrole)
      AND a.privilege_type = 'TRUNCATE'
  ) THEN
    RAISE EXCEPTION 'default privileges must not grant TRUNCATE to client roles';
  END IF;
END
$$;
