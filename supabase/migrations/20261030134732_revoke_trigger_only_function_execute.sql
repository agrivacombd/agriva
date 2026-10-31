-- Trigger-only function: callers must not be able to invoke it as a Data API RPC.
-- Trigger execution itself does not require the calling role to have EXECUTE privilege.
revoke all on function public.guard_organization_verification() from public, anon, authenticated;
