-- Attribution resolution is only needed during authenticated checkout.
-- The visitor token is intentionally not exposed to anonymous RPC callers.
revoke all on function public.resolve_reseller_attribution(text, text, uuid) from public, anon;
grant execute on function public.resolve_reseller_attribution(text, text, uuid) to authenticated, service_role;
