-- Prevent users from changing their own role or immutable profile fields.
-- RLS limits rows; column privileges limit which fields a client may update.
REVOKE UPDATE ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE UPDATE (id, full_name, phone, role, created_at, updated_at)
  ON TABLE public.profiles FROM PUBLIC, anon, authenticated;

GRANT UPDATE (full_name, phone) ON TABLE public.profiles TO authenticated;
