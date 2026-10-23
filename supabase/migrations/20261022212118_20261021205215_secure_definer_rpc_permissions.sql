-- AGRIVA production safety: narrow execution rights for SECURITY DEFINER RPCs.
-- Public-facing attribution/settings/search functions remain callable where intended.
-- Payment-event writes are restricted to trusted server-side service_role callers.

ALTER FUNCTION public.prevent_role_escalation()
  SET search_path = pg_catalog, public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.add_cart_item(uuid, integer, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_cart_item(uuid, integer, numeric) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_save_product_category(uuid, text, text, text, boolean, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_save_product_category(uuid, text, text, text, boolean, integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_set_product_category(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_product_category(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.user_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.user_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_update_product(uuid, text, text, numeric, numeric, numeric, public.product_status) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_product(uuid, text, text, numeric, numeric, numeric, public.product_status) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_update_site_setting(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_site_setting(text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.approve_commission_payout(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_commission_payout(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.approve_reseller_commission(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_reseller_commission(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.clear_active_cart() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clear_active_cart() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.complete_commission_payout(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_commission_payout(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_content_draft_from_opportunity(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_content_draft_from_opportunity(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_referral(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_referral(uuid, integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_reseller_link(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_reseller_link(uuid, integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.finalize_marketplace_cod_order(uuid, integer, jsonb, uuid, text, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finalize_marketplace_cod_order(uuid, integer, jsonb, uuid, text, timestamptz) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.finalize_marketplace_cod_order(uuid, integer, jsonb, uuid, text, timestamptz, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finalize_marketplace_cod_order(uuid, integer, jsonb, uuid, text, timestamptz, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.place_referral_order(text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_referral_order(text, numeric) TO authenticated;

-- Critical: the prior function allowed arbitrary payment status/event insertion
-- from anon/authenticated callers. Keep this server-side only.
REVOKE EXECUTE ON FUNCTION public.record_payment_event(uuid, text, text, numeric, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_payment_event(uuid, text, text, numeric, text, text, jsonb) TO service_role;

REVOKE EXECUTE ON FUNCTION public.request_commission_payout(numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_commission_payout(numeric, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.set_marketplace_order_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_marketplace_order_status(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.set_order_status(uuid, public.order_status) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_order_status(uuid, public.order_status) TO authenticated;

-- This is an auth.users trigger function, not a public RPC endpoint.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
