-- These records are written only by trusted SECURITY DEFINER review/lifecycle functions.
-- Clients may read their own grants and application events through RLS, but never mutate them.
revoke insert, update, delete, truncate, references, trigger on public.module_access_application_events from authenticated;
revoke insert, update, delete, truncate, references, trigger on public.user_module_grants from authenticated;
