-- Add transactional audit coverage and safer validation to privileged Admin operations.
-- Repository-only migration; it must be validated in an isolated local database
-- before any production rollout.

CREATE OR REPLACE FUNCTION public.admin_set_product_shipping(
  p_product_id uuid,
  p_shipping_class text,
  p_shipping_weight_grams integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_product public.products;
BEGIN
  IF v_actor IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin required' USING ERRCODE = '42501';
  END IF;
  IF p_product_id IS NULL
     OR p_shipping_class IS NULL
     OR p_shipping_class NOT IN ('packet', 'paddy')
     OR (p_shipping_class = 'paddy' AND (p_shipping_weight_grams IS NULL OR p_shipping_weight_grams < 1 OR p_shipping_weight_grams > 1000000))
     OR (p_shipping_class = 'packet' AND p_shipping_weight_grams IS NOT NULL) THEN
    RAISE EXCEPTION 'Invalid shipping class or weight' USING ERRCODE = '22023';
  END IF;

  UPDATE public.products
  SET shipping_class = p_shipping_class,
      shipping_weight_grams = p_shipping_weight_grams,
      updated_at = now()
  WHERE id = p_product_id
    AND marketplace_channel = 'marketplace'
  RETURNING * INTO v_product;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Marketplace product not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.admin_audit_log (admin_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_actor,
    'product.shipping_updated',
    'product',
    v_product.id,
    jsonb_build_object(
      'shipping_class', v_product.shipping_class,
      'shipping_weight_grams', v_product.shipping_weight_grams
    )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.bulk_moderate_quote(p_quote uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_quote public.bulk_quotes%ROWTYPE;
  v_previous_status text;
BEGIN
  IF v_actor IS NULL OR NOT public.bulk_is_admin() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_quote IS NULL OR p_status IS NULL OR p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid quote or status' USING ERRCODE = '22023';
  END IF;

  SELECT q.* INTO v_quote
  FROM public.bulk_quotes q
  JOIN public.bulk_requests r ON r.id = q.request_id
  WHERE q.id = p_quote
    AND q.status IN ('pending', 'approved')
    AND r.status = 'open'
  FOR UPDATE OF q, r;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not eligible' USING ERRCODE = 'P0002';
  END IF;
  v_previous_status := v_quote.status;

  UPDATE public.bulk_quotes q
  SET status = p_status
  FROM public.bulk_requests r
  WHERE q.id = p_quote
    AND q.request_id = r.id
    AND q.status IN ('pending', 'approved')
    AND r.status = 'open'
    AND (
      p_status = 'rejected'
      OR (
        q.expires_at > now()
        AND EXISTS (
          SELECT 1 FROM public.bulk_wholesalers w
          WHERE w.user_id = q.wholesaler_id AND w.status = 'verified'
        )
        AND EXISTS (
          SELECT 1 FROM public.bulk_invitations i
          WHERE i.request_id = q.request_id
            AND i.wholesaler_id = q.wholesaler_id
            AND i.revoked_at IS NULL
        )
      )
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not eligible' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.admin_audit_log (admin_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_actor, 'bulk.quote_moderated', 'bulk_quote', p_quote,
    jsonb_build_object(
      'request_id', v_quote.request_id,
      'wholesaler_id', v_quote.wholesaler_id,
      'previous_status', v_previous_status,
      'new_status', p_status
    )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.bulk_moderate_request(p_request uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  r public.bulk_requests%ROWTYPE;
  v_previous_status text;
  v_items integer;
BEGIN
  IF v_actor IS NULL OR NOT public.bulk_is_admin() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_request IS NULL OR p_status IS NULL OR p_status NOT IN ('open', 'closed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid request or status' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO r
  FROM public.bulk_requests
  WHERE id = p_request
    AND status IN ('pending_review', 'open', 'closed')
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or status transition forbidden' USING ERRCODE = 'P0002';
  END IF;
  v_previous_status := r.status;
  r.status := p_status;

  UPDATE public.bulk_requests
  SET status = p_status
  WHERE id = p_request;

  IF p_status = 'open' AND r.visibility = 'public' THEN
    SELECT greatest(1, count(*)::int) INTO v_items
    FROM public.bulk_request_items
    WHERE request_id = p_request;

    INSERT INTO public.bulk_public_listings (
      id, product_name, quantity, unit, district, upazila, desired_date,
      quote_deadline, created_at, item_count
    )
    VALUES (
      r.id, r.product_name, r.quantity, r.unit, r.district, r.upazila,
      r.desired_date, r.quote_deadline, r.created_at, v_items
    )
    ON CONFLICT (id) DO UPDATE SET
      product_name = excluded.product_name,
      quantity = excluded.quantity,
      unit = excluded.unit,
      district = excluded.district,
      upazila = excluded.upazila,
      desired_date = excluded.desired_date,
      quote_deadline = excluded.quote_deadline,
      created_at = excluded.created_at,
      item_count = excluded.item_count;
  ELSE
    DELETE FROM public.bulk_public_listings WHERE id = p_request;
  END IF;

  INSERT INTO public.admin_audit_log (admin_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_actor, 'bulk.request_moderated', 'bulk_request', p_request,
    jsonb_build_object(
      'previous_status', v_previous_status,
      'new_status', p_status,
      'visibility', r.visibility
    )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.bulk_transition_fulfillment(p_request uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_selection public.bulk_selections%ROWTYPE;
  v_old_status text;
BEGIN
  IF v_actor IS NULL OR NOT public.bulk_is_admin() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_request IS NULL OR p_status IS NULL THEN
    RAISE EXCEPTION 'Request and status are required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_selection
  FROM public.bulk_selections
  WHERE request_id = p_request
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Selected quote not found' USING ERRCODE = 'P0002'; END IF;
  v_old_status := v_selection.fulfillment_status;

  IF NOT (
    (v_old_status = 'pending_confirmation' AND p_status IN ('confirmed', 'cancelled'))
    OR (v_old_status = 'confirmed' AND p_status IN ('processing', 'cancelled'))
    OR (v_old_status = 'processing' AND p_status IN ('shipped', 'cancelled'))
    OR (v_old_status = 'shipped' AND p_status = 'delivered')
    OR (v_old_status = 'delivered' AND p_status = 'completed')
  ) THEN
    RAISE EXCEPTION 'Invalid fulfillment status transition' USING ERRCODE = '22023';
  END IF;

  UPDATE public.bulk_selections
  SET fulfillment_status = p_status, updated_at = now()
  WHERE request_id = p_request;

  INSERT INTO public.admin_audit_log (admin_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_actor, 'bulk.fulfillment_transitioned', 'bulk_selection', p_request,
    jsonb_build_object(
      'request_id', p_request,
      'previous_status', v_old_status,
      'new_status', p_status
    )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.bulk_transition_item_fulfillment(p_item uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_award public.bulk_item_awards%ROWTYPE;
  v_old_status text;
BEGIN
  IF v_actor IS NULL OR NOT public.bulk_is_admin() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_item IS NULL OR p_status IS NULL THEN
    RAISE EXCEPTION 'Item and status are required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_award
  FROM public.bulk_item_awards
  WHERE item_id = p_item
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Award not found' USING ERRCODE = 'P0002'; END IF;
  v_old_status := v_award.fulfillment_status;

  IF NOT (
    (v_old_status = 'pending_confirmation' AND p_status IN ('confirmed', 'cancelled'))
    OR (v_old_status = 'confirmed' AND p_status IN ('processing', 'cancelled'))
    OR (v_old_status = 'processing' AND p_status IN ('shipped', 'cancelled'))
    OR (v_old_status = 'shipped' AND p_status = 'delivered')
    OR (v_old_status = 'delivered' AND p_status = 'completed')
  ) THEN
    RAISE EXCEPTION 'Invalid fulfillment status' USING ERRCODE = '22023';
  END IF;

  UPDATE public.bulk_item_awards
  SET fulfillment_status = p_status, updated_at = now()
  WHERE item_id = p_item;

  INSERT INTO public.admin_audit_log (admin_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_actor, 'bulk.item_fulfillment_transitioned', 'bulk_item_award', p_item,
    jsonb_build_object(
      'item_id', p_item,
      'previous_status', v_old_status,
      'new_status', p_status
    )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.bulk_verify_named_wholesaler(
  p_user uuid,
  p_status text,
  p_display_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_previous_status text;
  v_display_name text := btrim(coalesce(p_display_name, ''));
BEGIN
  IF v_actor IS NULL OR NOT public.bulk_is_admin() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_user IS NULL OR p_status IS NULL OR p_status NOT IN ('verified', 'suspended') THEN
    RAISE EXCEPTION 'Invalid user or status' USING ERRCODE = '22023';
  END IF;
  IF p_status = 'verified' AND (char_length(v_display_name) < 2 OR char_length(v_display_name) > 120) THEN
    RAISE EXCEPTION 'Verified business name required' USING ERRCODE = '22023';
  END IF;

  SELECT status INTO v_previous_status
  FROM public.bulk_wholesalers
  WHERE user_id = p_user
  FOR UPDATE;

  INSERT INTO public.bulk_wholesalers (user_id, status, display_name, verified_at)
  VALUES (
    p_user, p_status, v_display_name,
    CASE WHEN p_status = 'verified' THEN now() ELSE NULL END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    status = excluded.status,
    display_name = CASE
      WHEN excluded.display_name <> '' THEN excluded.display_name
      ELSE bulk_wholesalers.display_name
    END,
    verified_at = excluded.verified_at;

  INSERT INTO public.admin_audit_log (admin_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_actor, 'bulk.wholesaler_verified', 'bulk_wholesaler', p_user,
    jsonb_build_object(
      'previous_status', v_previous_status,
      'new_status', p_status,
      'display_name_changed', v_display_name <> ''
    )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.bulk_verify_wholesaler(p_user uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_previous_status text;
BEGIN
  IF v_actor IS NULL OR NOT public.bulk_is_admin() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_user IS NULL OR p_status IS NULL OR p_status NOT IN ('verified', 'suspended', 'pending') THEN
    RAISE EXCEPTION 'Invalid user or status' USING ERRCODE = '22023';
  END IF;

  SELECT status INTO v_previous_status
  FROM public.bulk_wholesalers
  WHERE user_id = p_user
  FOR UPDATE;

  INSERT INTO public.bulk_wholesalers (user_id, status, verified_at)
  VALUES (p_user, p_status, CASE WHEN p_status = 'verified' THEN now() ELSE NULL END)
  ON CONFLICT (user_id) DO UPDATE SET
    status = excluded.status,
    verified_at = excluded.verified_at;

  INSERT INTO public.admin_audit_log (admin_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_actor, 'bulk.wholesaler_status_changed', 'bulk_wholesaler', p_user,
    jsonb_build_object(
      'previous_status', v_previous_status,
      'new_status', p_status
    )
  );
END;
$function$;
