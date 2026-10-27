-- Prevent non-admin users from publishing products on INSERT as well as UPDATE.
-- The previous guard only ran on UPDATE, leaving a path for a farmer to insert
-- a product with status='active' under the existing farmer insert policy.

create or replace function public.guard_product_status_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  -- Trusted server/service-role operations may have no auth.uid(); preserve
  -- that established workflow. Authenticated non-admin users are constrained.
  if auth.uid() is not null and not public.is_admin() then
    if tg_op = 'INSERT' and new.status is distinct from 'draft' then
      raise exception 'Only an admin may publish a product'
        using errcode = '42501';
    end if;

    if tg_op = 'UPDATE' and new.status is distinct from old.status then
      raise exception 'Only an admin may change product moderation status'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.guard_product_status_change() from public, anon, authenticated;

drop trigger if exists products_guard_status_change on public.products;
create trigger products_guard_status_change
before insert or update on public.products
for each row
execute function public.guard_product_status_change();
