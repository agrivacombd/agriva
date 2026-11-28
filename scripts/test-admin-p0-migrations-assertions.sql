-- Synthetic integration assertions for the Admin P0 migration set.
-- Execute after the fixture and the three P0 migrations in disposable local Supabase.
BEGIN;

INSERT INTO public.profiles(id, role) VALUES
  ('11111111-1111-4111-8111-111111111111', 'admin'),
  ('22222222-2222-4222-8222-222222222222', 'user')
ON CONFLICT (id) DO UPDATE SET role = excluded.role;
INSERT INTO public.admin_roles(id, role_key)
VALUES ('33333333-3333-4333-8333-333333333333', 'super_admin')
ON CONFLICT (role_key) DO NOTHING;

SELECT set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

INSERT INTO public.marketplace_checkouts(id, payment_method, payment_status, total_amount)
VALUES ('44444444-4444-4444-8444-444444444444', 'cod', 'pending', 100.00);
INSERT INTO public.marketplace_orders(checkout_id, payment_status)
VALUES ('44444444-4444-4444-8444-444444444444', 'pending');

SELECT public.record_cod_collection('44444444-4444-4444-8444-444444444444', 50.00, 'first collection');
SELECT public.record_cod_collection('44444444-4444-4444-8444-444444444444', 50.00, 'final collection');

INSERT INTO public.user_module_grants(user_id, module, status, scope_type, scope_id)
VALUES ('55555555-5555-4555-8555-555555555555', 'marketplace', 'active', 'organization', '66666666-6666-4666-8666-666666666666');
INSERT INTO public.module_access_applications(user_id, module, status, organization_id)
VALUES ('55555555-5555-4555-8555-555555555555', 'marketplace', 'approved', '66666666-6666-4666-8666-666666666666');
SELECT public.admin_revoke_market_access(
  '55555555-5555-4555-8555-555555555555',
  'marketplace',
  '66666666-6666-4666-8666-666666666666',
  'Synthetic test revocation reason'
);

INSERT INTO public.green_exchange_listings(id, moderation_status)
VALUES ('77777777-7777-4777-8777-777777777777', 'pending');
SELECT public.admin_moderate_green_exchange_listing('77777777-7777-4777-8777-777777777777', 'approved');

INSERT INTO public.products(id, marketplace_channel)
VALUES ('88888888-8888-4888-8888-888888888888', 'marketplace');
SELECT public.admin_set_product_shipping('88888888-8888-4888-8888-888888888888', 'packet', NULL);

INSERT INTO public.bulk_requests(
  id, buyer_id, buyer_type, visibility, status, product_name, specification,
  quantity, unit, district, upazila
)
VALUES (
  '99999999-9999-4999-8999-999999999999',
  '55555555-5555-4555-8555-555555555555',
  'business', 'public', 'pending_review', 'Rice', 'Synthetic',
  100, 'kg', 'Dhaka', 'Savar'
);
INSERT INTO public.bulk_request_items(id, request_id, product_name)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '99999999-9999-4999-8999-999999999999', 'Rice');
SELECT public.bulk_moderate_request('99999999-9999-4999-8999-999999999999', 'open');

INSERT INTO public.bulk_wholesalers(user_id, status, display_name)
VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'verified', 'Synthetic wholesaler');
INSERT INTO public.bulk_invitations(id, request_id, wholesaler_id)
VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '99999999-9999-4999-8999-999999999999', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
INSERT INTO public.bulk_quotes(
  id, request_id, wholesaler_id, unit_price, shipping_fee, extra_fee,
  lead_days, details, expires_at, status
)
VALUES (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  '99999999-9999-4999-8999-999999999999',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  10, 0, 0, 2, 'Synthetic quote', now() + interval '2 days', 'pending'
);
SELECT public.bulk_moderate_quote('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'approved');

INSERT INTO public.bulk_selections(request_id, quote_id, buyer_id, fulfillment_status)
VALUES (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  '55555555-5555-4555-8555-555555555555',
  'pending_confirmation'
);
SELECT public.bulk_transition_fulfillment('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'confirmed');

INSERT INTO public.bulk_item_awards(item_id, offer_id, request_id, buyer_id, fulfillment_status)
VALUES (
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  '99999999-9999-4999-8999-999999999999',
  '55555555-5555-4555-8555-555555555555',
  'pending_confirmation'
);
SELECT public.bulk_transition_item_fulfillment('ffffffff-ffff-4fff-8fff-ffffffffffff', 'confirmed');
SELECT public.bulk_verify_named_wholesaler('12121212-1212-4121-8121-121212121212', 'verified', 'Verified synthetic wholesaler');
SELECT public.bulk_verify_wholesaler('12121212-1212-4121-8121-121212121212', 'suspended');

DO $$
BEGIN
  IF (SELECT payment_status FROM public.marketplace_checkouts WHERE id = '44444444-4444-4444-8444-444444444444') <> 'paid' THEN
    RAISE EXCEPTION 'COD reconciliation did not mark the checkout paid';
  END IF;
  IF (SELECT count(*) FROM public.cod_collection_events WHERE checkout_id = '44444444-4444-4444-8444-444444444444') <> 2 THEN
    RAISE EXCEPTION 'COD collection events were not persisted';
  END IF;
  IF (SELECT status FROM public.user_module_grants WHERE user_id = '55555555-5555-4555-8555-555555555555') <> 'revoked' THEN
    RAISE EXCEPTION 'Seller access grant was not revoked';
  END IF;
  IF (SELECT moderation_status FROM public.green_exchange_listings WHERE id = '77777777-7777-4777-8777-777777777777') <> 'approved' THEN
    RAISE EXCEPTION 'Green Exchange moderation did not update listing';
  END IF;
  IF (SELECT shipping_class FROM public.products WHERE id = '88888888-8888-4888-8888-888888888888') <> 'packet' THEN
    RAISE EXCEPTION 'Product shipping update failed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.bulk_public_listings WHERE id = '99999999-9999-4999-8999-999999999999') THEN
    RAISE EXCEPTION 'Public bulk request listing was not synchronized';
  END IF;
  IF (SELECT count(*) FROM public.admin_audit_log) < 10 THEN
    RAISE EXCEPTION 'Expected transactional audit events were not written';
  END IF;
  IF has_function_privilege('anon', 'public.rls_auto_enable()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.rls_auto_enable()', 'EXECUTE') THEN
    RAISE EXCEPTION 'RLS event-trigger function remains executable by client roles';
  END IF;
END;
$$;

SELECT set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
DO $$
BEGIN
  BEGIN
    PERFORM public.admin_moderate_green_exchange_listing('77777777-7777-4777-8777-777777777777', 'rejected');
    RAISE EXCEPTION 'Non-admin unexpectedly moderated a Green Exchange listing';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  BEGIN
    PERFORM public.bulk_moderate_request('99999999-9999-4999-8999-999999999999', 'closed');
    RAISE EXCEPTION 'Non-admin unexpectedly moderated a bulk request';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END;
$$;

ROLLBACK;
