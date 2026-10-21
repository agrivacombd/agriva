-- Admin console read access for platform-wide metrics.
-- Mutations remain behind the existing admin-checked RPCs and role-specific policies.
drop policy if exists "profiles_admin_read" on public.profiles;
create policy "profiles_admin_read"
on public.profiles for select
using (public.is_admin());

drop policy if exists "products_admin_read" on public.products;
create policy "products_admin_read"
on public.products for select
using (public.is_admin());
