-- Tune the new feature-control RLS policies for initplan evaluation and avoid overlapping permissive policies.
-- Remove anonymous direct execution of is_admin(); authenticated application RPCs can still call it.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- Cache the JWT claim/uid per statement rather than reevaluating for every row.
drop policy if exists "Authorized admins update product form feature settings" on public.product_form_feature_settings;
create policy "Authorized admins update product form feature settings"
  on public.product_form_feature_settings for update to authenticated
  using (
    (select coalesce((auth.jwt()->'app_metadata'->>'agriva_super_admin') = 'true', false))
    or (
      exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
      and exists (
        select 1 from public.admin_feature_permission_grants g
        where g.user_id = (select auth.uid())
          and g.permission_key = 'product_form_features.manage'
          and g.revoked_at is null
      )
    )
  )
  with check (
    (select coalesce((auth.jwt()->'app_metadata'->>'agriva_super_admin') = 'true', false))
    or (
      exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
      and exists (
        select 1 from public.admin_feature_permission_grants g
        where g.user_id = (select auth.uid())
          and g.permission_key = 'product_form_features.manage'
          and g.revoked_at is null
      )
    )
  );

drop policy if exists "Admins can read their own feature grant" on public.admin_feature_permission_grants;
drop policy if exists "Super Admin manages feature grants" on public.admin_feature_permission_grants;
create policy "Read own active grant or Super Admin reads grants"
  on public.admin_feature_permission_grants for select to authenticated
  using (
    (select coalesce((auth.jwt()->'app_metadata'->>'agriva_super_admin') = 'true', false))
    or (user_id = (select auth.uid()) and revoked_at is null)
  );
create policy "Super Admin inserts feature grants"
  on public.admin_feature_permission_grants for insert to authenticated
  with check ((select coalesce((auth.jwt()->'app_metadata'->>'agriva_super_admin') = 'true', false)));
create policy "Super Admin updates feature grants"
  on public.admin_feature_permission_grants for update to authenticated
  using ((select coalesce((auth.jwt()->'app_metadata'->>'agriva_super_admin') = 'true', false)))
  with check ((select coalesce((auth.jwt()->'app_metadata'->>'agriva_super_admin') = 'true', false)));
create policy "Super Admin deletes feature grants"
  on public.admin_feature_permission_grants for delete to authenticated
  using ((select coalesce((auth.jwt()->'app_metadata'->>'agriva_super_admin') = 'true', false)));

drop policy if exists "Super Admin reads feature audit" on public.product_form_feature_audit;
create policy "Super Admin reads feature audit"
  on public.product_form_feature_audit for select to authenticated
  using ((select coalesce((auth.jwt()->'app_metadata'->>'agriva_super_admin') = 'true', false)));
