-- Multi-role support for AGRIVA profiles.
-- selected_roles is a user preference for personalization, not an authorization source.
-- Privileged access must continue to use server-controlled profiles.role / verified records.

alter table public.profiles
  add column if not exists selected_roles text[] not null default array['farmer']::text[];

alter table public.profiles
  drop constraint if exists profiles_selected_roles_allowed;

alter table public.profiles
  add constraint profiles_selected_roles_allowed
  check (
    cardinality(selected_roles) between 1 and 9
    and selected_roles <@ array[
      'farmer',
      'buyer',
      'seller',
      'transport',
      'job_seeker',
      'employer',
      'student',
      'agriculturist',
      'rooftop_gardener'
    ]::text[]
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_roles text[];
begin
  select coalesce(array_agg(valid_role), array['farmer']::text[])
    into requested_roles
  from (
    select distinct value as valid_role
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(new.raw_user_meta_data->'selected_roles') = 'array'
          then new.raw_user_meta_data->'selected_roles'
        else '[]'::jsonb
      end
    ) as role_values(value)
    where value = any (array[
      'farmer',
      'buyer',
      'seller',
      'transport',
      'job_seeker',
      'employer',
      'student',
      'agriculturist',
      'rooftop_gardener'
    ]::text[])
  ) as valid_roles;

  if coalesce(cardinality(requested_roles), 0) = 0 then
    requested_roles := array['farmer']::text[];
  end if;

  insert into public.profiles (id, full_name, selected_roles)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    requested_roles
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
