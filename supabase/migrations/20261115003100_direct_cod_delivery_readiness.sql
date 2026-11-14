-- Fix direct COD fee without affecting cart's checkout-level shipping.
begin;
CREATE OR REPLACE FUNCTION public.finalize_marketplace_cod_order_safe(p_product_id uuid, p_quantity integer, p_shipping_address jsonb, p_attribution_code text DEFAULT NULL::text, p_visitor_token text DEFAULT NULL::text)
 RETURNS marketplace_orders
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
AS $function$
declare
  v_session public.attribution_sessions%rowtype;
  v_has_attribution boolean := false;
  v_order public.marketplace_orders%rowtype;
  v_product public.products%rowtype;
  v_delivery numeric(12,2) := 0;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_attribution_code is not null and p_visitor_token is not null then
    select * into v_session from public.attribution_sessions a
    where a.product_id=p_product_id and a.code=p_attribution_code
      and a.visitor_token=p_visitor_token and a.expires_at>now()
    order by a.created_at desc limit 1;
    v_has_attribution := found;
  end if;
  if v_has_attribution then
    v_order := private.finalize_marketplace_cod_order(
      p_product_id,p_quantity,p_shipping_address,v_session.reseller_id,
      v_session.code,v_session.expires_at,p_visitor_token
    );
  else
    v_order := private.finalize_marketplace_cod_order(
      p_product_id,p_quantity,p_shipping_address,null,null,null,null
    );
  end if;
  -- Only direct COD: cart checkout calls the private writer directly.
  select * into v_product from public.products where id = v_order.product_id;
  if not found then raise exception 'Product unavailable'; end if;
  if v_product.shipping_class = 'paddy' then
    if v_product.shipping_weight_grams is null or v_product.shipping_weight_grams < 1 then
      raise exception 'Paddy shipping weight is missing';
    end if;
    v_delivery := 135 + greatest(0,
      ceil((v_product.shipping_weight_grams::numeric * v_order.quantity) / 1000)::integer - 1
    ) * 20;
  elsif v_product.shipping_class = 'packet' then
    v_delivery := 70;
  else
    raise exception 'Invalid shipping class';
  end if;
  update public.marketplace_orders
    set delivery_fee = v_delivery,
        total_amount = round(v_order.unit_price * v_order.quantity, 2) + v_delivery
    where id = v_order.id and buyer_id = auth.uid()
    returning * into v_order;
  if not found then raise exception 'Order not found'; end if;
  return v_order;
end;
$function$;
update public.products set unit='kg' where slug='black-rice-seeds'
  and unit is null and name like '%১ কেজি%' and marketplace_channel='marketplace';
revoke all on function public.finalize_marketplace_cod_order_safe(uuid,integer,jsonb,text,text) from public,anon;
grant execute on function public.finalize_marketplace_cod_order_safe(uuid,integer,jsonb,text,text) to authenticated;
commit;
