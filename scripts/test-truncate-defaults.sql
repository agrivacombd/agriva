\set ON_ERROR_STOP on

-- Simulate tables created by the two roles whose Production default ACLs were found.
CREATE TABLE storage.future_postgres_table (id bigint);
SET ROLE supabase_admin;
CREATE TABLE public.future_public_table (id bigint);
CREATE TABLE graphql.future_graphql_table (id bigint);
CREATE TABLE graphql_public.future_graphql_public_table (id bigint);
RESET ROLE;

DO $future_tables$
DECLARE
  item record;
BEGIN
  FOR item IN
    SELECT *
    FROM (VALUES
      ('storage', 'future_postgres_table'),
      ('public', 'future_public_table'),
      ('graphql', 'future_graphql_table'),
      ('graphql_public', 'future_graphql_public_table')
    ) AS t(schema_name, table_name)
  LOOP
    IF has_table_privilege('anon', format('%I.%I', item.schema_name, item.table_name), 'TRUNCATE') THEN
      RAISE EXCEPTION 'anon received TRUNCATE on future %.%', item.schema_name, item.table_name;
    END IF;
    IF has_table_privilege('authenticated', format('%I.%I', item.schema_name, item.table_name), 'TRUNCATE') THEN
      RAISE EXCEPTION 'authenticated received TRUNCATE on future %.%', item.schema_name, item.table_name;
    END IF;
  END LOOP;
END
$future_tables$;
