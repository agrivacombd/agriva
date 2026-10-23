-- Admin-only transport partner verification workflow.
alter table public.transport_partners
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists verification_note text not null default '' check (char_length(verification_note) <= 1000);

drop policy if exists transport_partners_read on public.transport_partners;
create policy transport_partners_read on public.transport_partners for select to authenticated
using (
  user_id = (select auth.uid())
  or verification_status = 'verified'
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

create or replace function public.admin_set_transport_partner_verification(
  p_user_id uuid,
  p_status text,
  p_note text default ''
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ) then
    raise exception 'Admin role required' using errcode = '42501';
  end if;

  if p_status not in ('verified', 'rejected', 'suspended') then
    raise exception 'Invalid verification status' using errcode = '22023';
  end if;

  if p_note is null or char_length(p_note) > 1000 then
    raise exception 'Review note must be 1000 characters or fewer' using errcode = '22023';
  end if;

  update public.transport_partners
  set verification_status = p_status,
      reviewed_at = now(),
      reviewed_by = (select auth.uid()),
      verification_note = trim(p_note)
  where user_id = p_user_id;

  if not found then
    raise exception 'Transport partner application not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_set_transport_partner_verification(uuid, text, text) from public, anon;
grant execute on function public.admin_set_transport_partner_verification(uuid, text, text) to authenticated;
