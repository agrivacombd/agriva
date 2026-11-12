-- Consolidate public/admin SELECT policies to avoid overlapping permissive policies.
drop policy if exists "Enabled seed content is public" on public.seed_category_content_sections;
drop policy if exists "Admins manage seed category content" on public.seed_category_content_sections;
create policy "Seed category content readable by public and admins"
  on public.seed_category_content_sections for select to anon, authenticated
  using (
    is_enabled = true
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );
create policy "Admins insert seed category content"
  on public.seed_category_content_sections for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "Admins update seed category content"
  on public.seed_category_content_sections for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "Admins delete seed category content"
  on public.seed_category_content_sections for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists "Active seed crop guides are public" on public.seed_crop_guides;
drop policy if exists "Admins manage seed crop guides" on public.seed_crop_guides;
create policy "Seed crop guides readable by public and admins"
  on public.seed_crop_guides for select to anon, authenticated
  using (
    is_active = true
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );
create policy "Admins insert seed crop guides"
  on public.seed_crop_guides for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "Admins update seed crop guides"
  on public.seed_crop_guides for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "Admins delete seed crop guides"
  on public.seed_crop_guides for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

drop policy if exists "Seed product details are public only for active seed products" on public.product_seed_details;
drop policy if exists "Admins manage product seed details" on public.product_seed_details;
create policy "Seed product details readable by eligible buyers and admins"
  on public.product_seed_details for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_seed_details.product_id
        and p.category_slug = 'seeds'
        and p.status = 'active'
        and p.marketplace_channel = 'marketplace'
    )
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );
create policy "Admins insert product seed details"
  on public.product_seed_details for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "Admins update product seed details"
  on public.product_seed_details for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy "Admins delete product seed details"
  on public.product_seed_details for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

create or replace function public.set_seed_information_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.set_seed_information_updated_at() from public, anon, authenticated;

drop trigger if exists seed_category_content_sections_updated_at on public.seed_category_content_sections;
create trigger seed_category_content_sections_updated_at
  before update on public.seed_category_content_sections
  for each row execute function public.set_seed_information_updated_at();
drop trigger if exists seed_crop_guides_updated_at on public.seed_crop_guides;
create trigger seed_crop_guides_updated_at
  before update on public.seed_crop_guides
  for each row execute function public.set_seed_information_updated_at();
drop trigger if exists product_seed_details_updated_at on public.product_seed_details;
create trigger product_seed_details_updated_at
  before update on public.product_seed_details
  for each row execute function public.set_seed_information_updated_at();
