-- Prevent non-admin users from publishing or changing product moderation status.
-- Product owners may still edit their own product details under existing RLS,
-- but activation/suspension must go through the admin moderation workflow.

create or replace function public.guard_product_status_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  if new.status is distinct from old.status
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only an admin may change product moderation status'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_product_status_change() from public, anon, authenticated;

drop trigger if exists products_guard_status_change on public.products;
create trigger products_guard_status_change
before update of status on public.products
for each row
execute function public.guard_product_status_change();
