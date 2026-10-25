-- Prevent self-service privilege escalation through public.profiles.role.
-- Profile owners may edit personal fields only; privileged role changes must go
-- through the server-authorized admin RPC.

REVOKE UPDATE ON TABLE public.profiles FROM PUBLIC;
REVOKE UPDATE ON TABLE public.profiles FROM anon;
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;

GRANT UPDATE (full_name, phone)
ON TABLE public.profiles
TO authenticated;
