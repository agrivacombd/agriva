-- Synthetic integration assertions for the Admin P0 migration set.
-- Execute after the fixture and three P0 migrations in disposable local Supabase.
BEGIN;

DO $test$
DECLARE
  v_admin uuid;
  v_buyer uuid;
  v_checkout uuid := '44444444-4444-4444-8444-444444444444';
  v_listing uuid := '77777777-7777-4777-8777-777777777777';
  v_product uuid := '88888888-8888-4888-8888-888888888888';
  v_request uuid := '99999999-9999-4999-8999-999999999999';
  v_quote uuid := 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  v_wholesaler uuid;
  v_revoked_user uuid := '55555555-5555-4555-8555-555555555555';
  v_scope uuid := '66666666-6666-4666-8666-666666666666';
BEGIN
  SELECT id INTO v_admin
  FROM public.profiles
  WHERE role = 'admin'
  ORDER BY id
  LIMIT 1;
  SELECT id INTO v_buyer
  FROM auth.users
  WHERE email LIKE 'agriva-buyer-%@example.test'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_admin IS NULL OR v_buyer IS NULL THEN
    RAISE EXCEPTION 'Synthetic Admin and buyer Auth users must exist before P0 migration tests';
  END IF;

  INSERT INTO public.profiles(id, role, full_name)
  VALUES (v_buyer, 'user', 'Synthetic CI Buyer')
  ON CONFLICT (id) DO UPDATE SET role = 'user';

  v_wholesaler := v_buyer;
  PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);

  INSERT INTO public.admin_roles(id, role_key)
  VALUES ('33333333-3333-4333-8333-333333333333', 'super_admin')
  ON CONFLICT (role_key) DO NOTHING;

  INSERT INTO public.marketplace_checkouts(id, payment_method, payment_status, total_amount)
  VALUES (v_checkout, 'cod', 'pending', 100.00);
  INSERT INTO public.marketplace_orders(checkout_id, payment_status)
  VALUES (v_checkout, 'pending');
  PERFORM public.record_cod_collection(v_checkout, 50.00, 'first collection');
  PERFORM public.record_cod_collection(v_checkout, 50.00, 'final collection');

  INSERT INTO public.organizations(id, name) VALUES (v_scope, 'Synthetic seller organization');
  INSERT INTO public.user_module_grants(user_id, module, status, scope_type, scope_id)
  VALUES (v_revoked_user, 'marketplace', 'active', 'organization', v_scope);
  INSERT INTO public.module_access_applications(user_id, module, status, organization_id)
  VALUES (v_revoked_user, 'marketplace', 'approved', v_scope);
  PERFORM public.admin_revoke_market_access(v_revoked_user, 'marketplace', v_scope, 'Synthetic test revocation reason');

  INSERT INTO public.green_exchange_listings(id, moderation_status)
  VALUES (v_listing, 'pending');
  PERFORM public.admin_moderate_green_exchange_listing(v_listing, 'approved');

  INSERT INTO public.products(id, marketplace_channel)
  VALUES (v_product, 'marketplace');
  PERFORM public.admin_set_product_shipping(v_product, 'packet', NULL);

  INSERT INTO public.bulk_requests(
    id, buyer_id, buyer_type, visibility, status, product_name, specification,
    quantity, unit, district, upazila
  )
  VALUES (v_request, v_buyer, 'business', 'public', 'pending_review', 'Rice', 'Synthetic', 100, 'kg', 'Dhaka', 'Savar');
  INSERT INTO public.bulk_request_items(id, request_id, product_name)
  VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', v_request, 'Rice');
  PERFORM public.bulk_moderate_request(v_request, 'open');

  INSERT INTO public.bulk_wholesalers(user_id, status, display_name)
  VALUES (v_wholesaler, 'verified', 'Synthetic wholesaler');
  INSERT INTO public.bulk_invitations(id, request_id, wholesaler_id)
  VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', v_request, v_wholesaler);
  INSERT INTO public.bulk_quotes(
    id, request_id, wholesaler_id, unit_price, shipping_fee, extra_fee,
    lead_days, details, expires_at, status
  )
  VALUES (v_quote, v_request, v_wholesaler, 10, 0, 0, 2, 'Synthetic quote', now() + interval '2 days', 'pending');
  PERFORM public.bulk_moderate_quote(v_quote, 'approved');

  INSERT INTO public.bulk_selections(request_id, quote_id, buyer_id, fulfillment_status)
  VALUES (v_request, v_quote, v_buyer, 'pending_confirmation');
  PERFORM public.bulk_transition_fulfillment(v_request, 'confirmed');

  INSERT INTO public.bulk_item_offers(id, request_id, quote_id, item_id, unit_price, shipping_fee, extra_fee)
  VALUES ('abababab-abab-4bab-8bab-abababababab', v_request, v_quote, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 10, 0, 0);
  INSERT INTO public.bulk_item_awards(item_id, offer_id, request_id, buyer_id, fulfillment_status)
  VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'abababab-abab-4bab-8bab-abababababab', v_request, v_buyer, 'pending_confirmation');
  PERFORM public.bulk_transition_item_fulfillment('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'confirmed');
  PERFORM public.bulk_verify_named_wholesaler(v_wholesaler, 'verified', 'Verified synthetic wholesaler');
  PERFORM public.bulk_verify_wholesaler(v_wholesaler, 'suspended');

  IF (SELECT payment_status FROM public.marketplace_checkouts WHERE id = v_checkout) <> 'paid' THEN
    RAISE EXCEPTION 'COD reconciliation did not mark the checkout paid';
  END IF;
  IF (SELECT count(*) FROM public.cod_collection_events WHERE checkout_id = v_checkout) <> 2 THEN
    RAISE EXCEPTION 'COD collection events were not persisted';
  END IF;
  IF (SELECT status FROM public.user_module_grants WHERE user_id = v_revoked_user) <> 'revoked' THEN
    RAISE EXCEPTION 'Seller access grant was not revoked';
  END IF;
  IF (SELECT moderation_status FROM public.green_exchange_listings WHERE id = v_listing) <> 'approved' THEN
    RAISE EXCEPTION 'Green Exchange moderation did not update listing';
  END IF;
  IF (SELECT shipping_class FROM public.products WHERE id = v_product) <> 'packet' THEN
    RAISE EXCEPTION 'Product shipping update failed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.bulk_public_listings WHERE id = v_request) THEN
    RAISE EXCEPTION 'Public bulk request listing was not synchronized';
  END IF;
  IF (SELECT count(*) FROM public.admin_audit_log) < 10 THEN
    RAISE EXCEPTION 'Expected transactional audit events were not written';
  END IF;
  IF has_function_privilege('anon', 'public.rls_auto_enable()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.rls_auto_enable()', 'EXECUTE') THEN
    RAISE EXCEPTION 'RLS event-trigger function remains executable by client roles';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', v_buyer::text, true);
  BEGIN
    PERFORM public.record_cod_collection(v_checkout, 1.00, 'unauthorized test');
    RAISE EXCEPTION 'Non-admin unexpectedly reconciled COD';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  BEGIN
    PERFORM public.admin_moderate_green_exchange_listing(v_listing, 'rejected');
    RAISE EXCEPTION 'Non-admin unexpectedly moderated a Green Exchange listing';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  BEGIN
    PERFORM public.bulk_moderate_request(v_request, 'closed');
    RAISE EXCEPTION 'Non-admin unexpectedly moderated a bulk request';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END;
$test$;

ROLLBACK;
