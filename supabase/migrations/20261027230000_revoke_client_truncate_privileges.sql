-- Revoke table-wide truncation from client-facing roles across the public schema.
-- RLS policies do not protect tables from TRUNCATE.
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- Prevent the same grant from being added to future tables created by postgres.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE ON TABLES FROM anon, authenticated;
