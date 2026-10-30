-- Client roles must never be able to truncate exposed application tables.
-- RLS does not protect against TRUNCATE; revoke the privilege across public
-- and prevent future tables created by postgres migrations from inheriting it.

REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE ON TABLES FROM anon, authenticated;
