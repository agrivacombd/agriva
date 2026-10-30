-- Keep future public tables created by the application migration owner
-- from inheriting TRUNCATE for API client roles.
-- Supabase's supabase_admin role is platform-managed; project postgres cannot
-- alter its default ACL. The platform's own role defaults are not modified here.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE ON TABLES FROM anon, authenticated;
