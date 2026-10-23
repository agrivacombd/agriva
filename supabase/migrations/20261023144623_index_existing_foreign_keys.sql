-- Add covering indexes for existing foreign keys identified by the Supabase performance advisor.
-- These indexes improve joins and parent-row update/delete checks; no application rows are changed.
create index if not exists admin_audit_log_admin_id_idx on public.admin_audit_log (admin_id);
create index if not exists attribution_sessions_product_id_idx on public.attribution_sessions (product_id);
create index if not exists commission_ledger_farmer_id_idx on public.commission_ledger (farmer_id);
create index if not exists commission_payouts_approved_by_idx on public.commission_payouts (approved_by);
create index if not exists commissions_product_id_idx on public.commissions (product_id);
create index if not exists content_drafts_created_by_idx on public.content_drafts (created_by);
create index if not exists content_drafts_reviewed_by_idx on public.content_drafts (reviewed_by);
create index if not exists content_opportunities_reviewed_by_idx on public.content_opportunities (reviewed_by);
create index if not exists farm_diary_farm_id_idx on public.farm_diary (farm_id);
create index if not exists farm_expenses_crop_cycle_id_idx on public.farm_expenses (crop_cycle_id);
create index if not exists farm_sales_crop_cycle_id_idx on public.farm_sales (crop_cycle_id);
create index if not exists marketplace_orders_product_id_idx on public.marketplace_orders (product_id);
create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_referral_id_idx on public.orders (referral_id);
create index if not exists referrals_product_id_idx on public.referrals (product_id);
create index if not exists search_opportunities_query_id_idx on public.search_opportunities (query_id);
create index if not exists search_opportunities_reviewed_by_idx on public.search_opportunities (reviewed_by);
create index if not exists search_queries_user_id_idx on public.search_queries (user_id);
create index if not exists site_settings_updated_by_idx on public.site_settings (updated_by);
create index if not exists transport_booking_contacts_customer_id_idx on public.transport_booking_contacts (customer_id);
create index if not exists transport_bookings_selected_quote_id_id_idx on public.transport_bookings (selected_quote_id, id);
create index if not exists transport_bookings_selected_partner_id_idx on public.transport_bookings (selected_partner_id);
create index if not exists transport_partners_reviewed_by_idx on public.transport_partners (reviewed_by);
