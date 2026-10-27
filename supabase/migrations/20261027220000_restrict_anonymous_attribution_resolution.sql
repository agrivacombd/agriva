-- Attribution resolution is only needed during authenticated checkout.
-- Do not expose reseller identifiers through an anonymous SECURITY DEFINER RPC.
revoke all on function public.resolve_reseller_attribution(text, text, uuid) from public, anon;
grant execute on function public.resolve_reseller_attribution(text, text, uuid) to authenticated, service_role;
