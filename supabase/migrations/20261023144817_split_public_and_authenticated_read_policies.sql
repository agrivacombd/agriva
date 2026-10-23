-- Keep admin-only SECURITY DEFINER checks out of anon RLS expressions.
-- Split public catalogue reads from authenticated/admin reads, and remove redundant SELECT policies.
drop policy if exists attribution_owner_read on public.attribution_sessions;
create policy attribution_owner_read on public.attribution_sessions
  for select to authenticated
  using (auth.uid() = reseller_id or public.is_admin());

drop policy if exists marketplace_orders_parties_read on public.marketplace_orders;
create policy marketplace_orders_parties_read on public.marketplace_orders
  for select to authenticated
  using (auth.uid() = buyer_id or auth.uid() = farmer_id or auth.uid() = reseller_id or public.is_admin());

drop policy if exists product_categories_public_read on public.product_categories;
create policy product_categories_public_read on public.product_categories
  for select to anon
  using (is_active);
drop policy if exists product_categories_authenticated_read on public.product_categories;
create policy product_categories_authenticated_read on public.product_categories
  for select to authenticated
  using (is_active or public.is_admin());

drop policy if exists products_admin_read on public.products;
create policy products_anon_active_read on public.products
  for select to anon
  using (status = 'active');
drop policy if exists products_authenticated_read on public.products;
create policy products_authenticated_read on public.products
  for select to authenticated
  using (status = 'active' or auth.uid() = farmer_id or public.is_admin());

drop policy if exists profiles_admin_read on public.profiles;
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_authenticated_read on public.profiles
  for select to authenticated
  using (auth.uid() = id or public.is_admin());

drop policy if exists reseller_commissions_owner_read on public.reseller_commissions;
create policy reseller_commissions_owner_read on public.reseller_commissions
  for select to authenticated
  using (auth.uid() = reseller_id or public.is_admin());

drop policy if exists reseller_links_owner_read on public.reseller_links;
create policy reseller_links_owner_read on public.reseller_links
  for select to authenticated
  using (auth.uid() = reseller_id or public.is_admin());

drop policy if exists site_settings_admin_read on public.site_settings;
create policy site_settings_admin_read on public.site_settings
  for select to authenticated
  using (public.is_admin());

-- The ALL policies already include SELECT with the same owner predicate.
drop policy if exists cart_item_owner_read on public.cart_items;
drop policy if exists cart_owner_read on public.carts;
