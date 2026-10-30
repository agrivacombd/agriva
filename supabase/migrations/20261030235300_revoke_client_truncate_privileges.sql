-- Remove client TRUNCATE defaults from every schema/creator pair observed in Production.
-- The first migration closed current public-table grants; this closes future grants
-- inherited by tables created by Supabase-managed roles in exposed and storage schemas.

REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA storage FROM anon, authenticated;
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA graphql FROM anon, authenticated;
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA graphql_public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
  REVOKE TRUNCATE ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql
  REVOKE TRUNCATE ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public
  REVOKE TRUNCATE ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage
  REVOKE TRUNCATE ON TABLES FROM anon, authenticated;
