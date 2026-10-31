-- Secure Supabase anonymous checkout identities.
-- Anonymous users are buyer-only: never inherit the farmer fallback or selectable roles.
begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_role public.user_role;
  v_roles jsonb;
  v_selected_roles text[];
  v_selected_role text;
begin
  if coalesce(new.is_anonymous, false) then
    insert into public.profiles (id, full_name, phone, role, selected_roles)
    values (
      new.id,
      coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), ''),
      null,
      'buyer'::public.user_role,
      array['buyer']::text[]
    )
    on conflict (id) do update
      set role = 'buyer'::public.user_role,
          selected_roles = array['buyer']::text[];

    delete from public.user_role_memberships
    where user_id = new.id;

    insert into public.user_role_memberships (user_id, role)
    values (new.id, 'buyer')
    on conflict (user_id, role) do nothing;

    return new;
  end if;

  -- Preserve the existing allow-listed signup behavior for regular accounts.
  v_role := case
    when (new.raw_user_meta_data ->> 'role') in ('farmer', 'reseller')
      then (new.raw_user_meta_data ->> 'role')::public.user_role
    else 'farmer'::public.user_role
  end;

  v_roles := case
    when jsonb_typeof(new.raw_user_meta_data -> 'selected_roles') = 'array'
      then new.raw_user_meta_data -> 'selected_roles'
    else '[]'::jsonb
  end;

  select coalesce(array_agg(distinct value), array['farmer']::text[])
    into v_selected_roles
  from jsonb_array_elements_text(v_roles) as item(value)
  where value in (
    'farmer', 'buyer', 'seller', 'transport', 'job_seeker',
    'employer', 'student', 'agriculturist', 'rooftop_gardener'
  );

  insert into public.profiles (id, full_name, phone, role, selected_roles)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'phone'), ''),
    v_role,
    v_selected_roles
  )
  on conflict (id) do nothing;

  for v_selected_role in
    select distinct value
    from jsonb_array_elements_text(v_roles) as item(value)
    where value in (
      'farmer', 'buyer', 'seller', 'transport', 'job_seeker',
      'employer', 'student', 'agriculturist', 'rooftop_gardener'
    )
  loop
    insert into public.user_role_memberships (user_id, role)
    values (new.id, v_selected_role)
    on conflict (user_id, role) do nothing;
  end loop;

  if not exists (select 1 from public.user_role_memberships where user_id = new.id) then
    insert into public.user_role_memberships (user_id, role)
    values (new.id, 'farmer')
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$$;

-- Repair anonymous profiles created before this migration, removing every role grant.
update public.profiles p
set role = 'buyer'::public.user_role,
    selected_roles = array['buyer']::text[]
from auth.users u
where u.id = p.id and coalesce(u.is_anonymous, false);

delete from public.user_role_memberships m
using auth.users u
where u.id = m.user_id and coalesce(u.is_anonymous, false);

insert into public.user_role_memberships (user_id, role)
select u.id, 'buyer'
from auth.users u
where coalesce(u.is_anonymous, false)
on conflict (user_id, role) do nothing;

-- A guest cannot promote its own account through the role-picker RPC.
create or replace function private.update_my_role_memberships(p_roles text[])
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_allowed text[] := array[
    'farmer', 'buyer', 'seller', 'transport', 'job_seeker',
    'employer', 'student', 'agriculturist', 'rooftop_gardener'
  ]::text[];
  v_is_anonymous boolean;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select coalesce(is_anonymous, false) into v_is_anonymous
  from auth.users where id = v_user_id;
  if coalesce(v_is_anonymous, false) then
    raise exception 'Anonymous accounts cannot change role memberships';
  end if;

  if p_roles is null or cardinality(p_roles) < 1 or cardinality(p_roles) > 9 then
    raise exception 'Select between one and nine roles';
  end if;
  if exists (select 1 from unnest(p_roles) as requested(role) where not (requested.role = any(v_allowed))) then
    raise exception 'One or more roles are not allowed';
  end if;

  delete from public.user_role_memberships
  where user_id = v_user_id and role = any(v_allowed);

  update public.profiles
  set selected_roles = array(select distinct requested.role from unnest(p_roles) as requested(role))
  where id = v_user_id;

  insert into public.user_role_memberships (user_id, role)
  select v_user_id, requested.role
  from (select distinct role from unnest(p_roles) as item(role)) as requested
  on conflict (user_id, role) do nothing;
end;
$$;

revoke all on function private.update_my_role_memberships(text[]) from public, anon;
grant execute on function private.update_my_role_memberships(text[]) to authenticated;
revoke all on function public.update_my_role_memberships(text[]) from public, anon;
grant execute on function public.update_my_role_memberships(text[]) to authenticated;

-- Database boundary: direct RPC callers cannot bypass the verified-phone check.
create or replace function public.require_verified_guest_checkout_phone()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_is_anonymous boolean;
  v_phone text;
  v_phone_confirmed_at timestamptz;
begin
  select coalesce(is_anonymous, false), phone, phone_confirmed_at
    into v_is_anonymous, v_phone, v_phone_confirmed_at
  from auth.users
  where id = new.buyer_id;

  if coalesce(v_is_anonymous, false) then
    if v_phone_confirmed_at is null
       or v_phone is null
       or v_phone is distinct from (new.shipping_address ->> 'phone') then
      raise exception 'Guest checkout requires a verified matching phone number';
    end if;

    if not exists (
      select 1 from public.profiles p
      where p.id = new.buyer_id
        and p.role = 'buyer'::public.user_role
        and p.selected_roles = array['buyer']::text[]
    ) then
      raise exception 'Guest account is not restricted to buyer permissions';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists marketplace_checkout_require_verified_guest_phone
  on public.marketplace_checkouts;
create trigger marketplace_checkout_require_verified_guest_phone
before insert on public.marketplace_checkouts
for each row execute function public.require_verified_guest_checkout_phone();

revoke all on function public.require_verified_guest_checkout_phone() from public, anon, authenticated;

commit;
