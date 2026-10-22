-- Public, non-secret Google site integration settings; editable only by admins.
create table if not exists public.site_public_integrations (
  id integer primary key default 1 check (id = 1),
  ga4_measurement_id text,
  google_site_verification text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.site_public_integrations enable row level security;

drop policy if exists "Public can read public Google integration settings" on public.site_public_integrations;
create policy "Public can read public Google integration settings"
  on public.site_public_integrations for select to anon, authenticated using (true);

drop policy if exists "Admins can manage public Google integration settings" on public.site_public_integrations;
create policy "Admins can manage public Google integration settings"
  on public.site_public_integrations for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.site_public_integrations to anon, authenticated;
grant insert, update, delete on public.site_public_integrations to authenticated;
