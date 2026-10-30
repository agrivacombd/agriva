-- Existing client grants are revoked by the preceding migration. This also
-- prevents future tables created by either Supabase's migration owner or the
-- platform admin role from inheriting TRUNCATE for API client roles.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
  REVOKE TRUNCATE ON TABLES FROM anon, authenticated;
