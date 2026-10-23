-- AGRIVA auth -> profile automation
-- Creates a profile whenever a new Supabase Auth user signs up.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    case
      when (new.raw_user_meta_data ->> 'role') in ('farmer','reseller')
        then (new.raw_user_meta_data ->> 'role')::public.user_role
      else 'farmer'::public.user_role
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Users must not be able to change themselves into admin through client metadata.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
as $$
begin
  if old.role = 'admin' then
    if new.role <> 'admin' and auth.uid() = old.id then
      raise exception 'Admin role cannot be changed by the user';
    end if;
  elsif new.role = 'admin' and auth.uid() = old.id then
    raise exception 'Admin role cannot be self-assigned';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
before update on public.profiles
for each row execute procedure public.prevent_role_escalation();

comment on function public.handle_new_user() is 'Creates a default farmer/reseller profile from signup metadata. Admin must be assigned through a trusted server-side process.';
