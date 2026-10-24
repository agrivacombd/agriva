-- Public pages need to read active category labels/slugs; mutations remain RPC-only.
alter table public.product_categories enable row level security;
grant select on public.product_categories to anon, authenticated;
drop policy if exists "Active product categories are readable" on public.product_categories;
create policy "Active product categories are readable"
  on public.product_categories for select to anon, authenticated
  using (is_active = true);
drop policy if exists "Admins can read all product categories" on public.product_categories;
create policy "Admins can read all product categories"
  on public.product_categories for select to authenticated
  using (public.is_admin());

-- Admin-only subcategory management with validation and audit logging.
create or replace function public.admin_save_product_subcategory(
  p_category_slug text,
  p_old_slug text,
  p_name text,
  p_slug text,
  p_description text default '',
  p_is_active boolean default true,
  p_sort_order integer default 100
)
returns public.product_subcategories
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  result public.product_subcategories;
  old_row public.product_subcategories;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin role required';
  end if;
  if p_category_slug is null or trim(p_category_slug) = ''
     or p_name is null or trim(p_name) = ''
     or p_slug is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     or length(p_slug) > 120
     or p_sort_order is null or abs(p_sort_order) > 100000 then
    raise exception 'Invalid subcategory fields';
  end if;
  if not exists (
    select 1 from public.product_categories c
    where c.slug = trim(p_category_slug)
  ) then
    raise exception 'Category does not exist';
  end if;

  if p_old_slug is not null and trim(p_old_slug) <> '' then
    select * into old_row
      from public.product_subcategories
      where category_slug = trim(p_category_slug) and slug = trim(p_old_slug)
      for update;
    if not found then raise exception 'Subcategory not found'; end if;
    if trim(p_old_slug) <> trim(p_slug) and exists (
      select 1 from public.products p
      where p.category_slug = trim(p_category_slug)
        and p.subcategory_slug = trim(p_old_slug)
    ) then
      raise exception 'Cannot change a subcategory slug after products have been assigned; create a new subcategory and remap products deliberately';
    end if;

    update public.product_subcategories
      set slug = trim(p_slug),
          name = trim(p_name),
          description = coalesce(trim(p_description), ''),
          is_active = p_is_active,
          sort_order = p_sort_order,
          updated_at = now()
      where category_slug = trim(p_category_slug) and slug = trim(p_old_slug)
      returning * into result;
  else
    insert into public.product_subcategories(category_slug, slug, name, description, is_active, sort_order)
    values (trim(p_category_slug), trim(p_slug), trim(p_name), coalesce(trim(p_description), ''), p_is_active, p_sort_order)
    returning * into result;
  end if;

  insert into public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(), 'taxonomy.subcategory_saved', 'product_subcategory', null,
    jsonb_build_object(
      'category_slug', result.category_slug,
      'slug', result.slug,
      'previous_slug', p_old_slug,
      'name', result.name,
      'is_active', result.is_active
    )
  );
  return result;
end;
$$;

revoke all on function public.admin_save_product_subcategory(text, text, text, text, text, boolean, integer) from public, anon;
grant execute on function public.admin_save_product_subcategory(text, text, text, text, text, boolean, integer) to authenticated;
