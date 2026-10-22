-- Do not trust a client-supplied cart price. Preserve the existing RPC signature
-- for compatibility, but always read the active product's current price server-side.
CREATE OR REPLACE FUNCTION public.add_cart_item(
  p_product_id uuid,
  p_quantity integer,
  p_unit_price numeric
)
RETURNS public.cart_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public, pg_temp
AS $function$
DECLARE
  c public.carts;
  i public.cart_items;
  p public.products;
  uid uuid;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_product_id IS NULL OR p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 1000 THEN
    RAISE EXCEPTION 'Invalid product or quantity';
  END IF;

  SELECT * INTO p
  FROM public.products
  WHERE id = p_product_id
    AND status = 'active'
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product unavailable';
  END IF;

  SELECT * INTO c
  FROM public.carts
  WHERE user_id = uid AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.carts(user_id)
    VALUES (uid)
    RETURNING * INTO c;
  END IF;

  INSERT INTO public.cart_items(cart_id, product_id, quantity, unit_price)
  VALUES (c.id, p.id, p_quantity, p.price)
  ON CONFLICT (cart_id, product_id)
  DO UPDATE SET
    quantity = LEAST(1000, public.cart_items.quantity + EXCLUDED.quantity),
    unit_price = EXCLUDED.unit_price,
    updated_at = now()
  RETURNING * INTO i;

  UPDATE public.carts SET updated_at = now() WHERE id = c.id;
  RETURN i;
END;
$function$;
