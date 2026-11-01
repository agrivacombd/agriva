-- Keep all Marketplace COD order creation behind the attribution-safe public wrapper.
revoke all on function public.finalize_marketplace_cod_order(uuid,integer,jsonb,uuid,text,timestamptz) from public,anon,authenticated;
revoke all on function public.finalize_marketplace_cod_order(uuid,integer,jsonb,uuid,text,timestamptz,text) from public,anon,authenticated;
grant execute on function public.finalize_marketplace_cod_order_safe(uuid,integer,jsonb,text,text) to authenticated;
