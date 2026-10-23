-- Forward-safe repair for projects where the earlier policy migrations were already recorded.
-- PostgreSQL CREATE POLICY has no IF NOT EXISTS clause; recreate named policies safely.
drop policy if exists "payouts_reseller_read" on public.commission_payouts;
create policy "payouts_reseller_read" on public.commission_payouts
  for select using (
    auth.uid() = reseller_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "audit_admin_read" on public.admin_audit_log;
create policy "audit_admin_read" on public.admin_audit_log
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "reseller_links_owner_read" on public.reseller_links;
create policy "reseller_links_owner_read" on public.reseller_links
  for select using (auth.uid() = reseller_id or public.is_admin());

drop policy if exists "attribution_owner_read" on public.attribution_sessions;
create policy "attribution_owner_read" on public.attribution_sessions
  for select using (auth.uid() = reseller_id or public.is_admin());

drop policy if exists "marketplace_orders_parties_read" on public.marketplace_orders;
create policy "marketplace_orders_parties_read" on public.marketplace_orders
  for select using (
    auth.uid() = buyer_id
    or auth.uid() = farmer_id
    or auth.uid() = reseller_id
    or public.is_admin()
  );

drop policy if exists "reseller_commissions_owner_read" on public.reseller_commissions;
create policy "reseller_commissions_owner_read" on public.reseller_commissions
  for select using (auth.uid() = reseller_id or public.is_admin());
