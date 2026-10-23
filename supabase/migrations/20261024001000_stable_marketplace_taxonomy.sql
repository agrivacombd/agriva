-- Stable, database-backed marketplace taxonomy.
-- Keep products.category as a legacy display/compatibility field during rollout.
insert into public.product_categories (name, slug, description, is_active, sort_order)
values
  ('বীজ', 'seeds', 'ধান, সবজি ও মৌসুমি ফসলের বীজ', true, 10),
  ('সার', 'fertilizer', 'জৈব, রাসায়নিক ও মাটির পুষ্টি উপকরণ', true, 20),
  ('ফসল সুরক্ষা', 'crop-protection', 'ফসলের রোগবালাই ও পোকা ব্যবস্থাপনার উপকরণ', true, 30),
  ('কৃষি যন্ত্রপাতি', 'tools-equipment', 'চাষাবাদ, সেচ ও ফসল সংগ্রহের যন্ত্র', true, 40),
  ('তাজা কৃষিপণ্য', 'produce', 'ধান, শস্য, সবজি, ফল ও মৌসুমি উৎপাদন', true, 50),
  ('পশুখাদ্য', 'animal-feed', 'গবাদিপশু ও পোলট্রির খাদ্য', true, 60)
on conflict (slug) do update set
  description = excluded.description,
  is_active = true,
  sort_order = excluded.sort_order,
  updated_at = now();

create table if not exists public.product_subcategories (
  category_slug text not null references public.product_categories(slug) on update cascade on delete restrict,
  slug text not null,
  name text not null,
  description text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (category_slug, slug)
);

insert into public.product_subcategories (category_slug, slug, name, description, is_active, sort_order)
values
  ('seeds','rice-seeds','ধানের বীজ','ধান চাষের জন্য বীজের পণ্য ও সংশ্লিষ্ট তথ্য দেখুন।',true,10),
  ('seeds','vegetable-seeds','সবজির বীজ','বিভিন্ন সবজি চাষের বীজের তালিকা ও পণ্যের বিবরণ দেখুন।',true,20),
  ('fertilizer','organic-fertilizer','জৈব সার','মাটির পরিচর্যা ও পুষ্টি ব্যবস্থাপনায় ব্যবহৃত জৈব সারের পণ্য দেখুন।',true,10),
  ('fertilizer','chemical-fertilizer','রাসায়নিক সার','ফসলের পুষ্টি ব্যবস্থাপনায় ব্যবহৃত রাসায়নিক সারের পণ্য ও তথ্য দেখুন।',true,20),
  ('crop-protection','pesticides','কীটনাশক','ফসলের পোকা ব্যবস্থাপনায় ব্যবহৃত কীটনাশকের পণ্য ও লেবেল-সংক্রান্ত তথ্য দেখুন।',true,10),
  ('crop-protection','fungicides','ছত্রাকনাশক','ফসলের ছত্রাকজনিত রোগ ব্যবস্থাপনায় ব্যবহৃত পণ্যের তালিকা দেখুন।',true,20),
  ('tools-equipment','irrigation','সেচ সরঞ্জাম','জমিতে পানি সরবরাহ ও সেচ ব্যবস্থাপনার সরঞ্জামের পণ্য দেখুন।',true,10),
  ('tools-equipment','farm-tools','চাষাবাদের সরঞ্জাম','চাষাবাদ ও কৃষিকাজে ব্যবহৃত সরঞ্জামের পণ্য ও বিবরণ দেখুন।',true,20),
  ('produce','vegetables','সবজি','তাজা সবজি ও উপলভ্য কৃষিপণ্যের তালিকা দেখুন।',true,10),
  ('produce','fruits','ফল','মৌসুমি ফল ও উপলভ্য কৃষিপণ্যের তালিকা দেখুন।',true,20),
  ('produce','grains','শস্য ও ধান','শস্য ও ধানজাত কৃষিপণ্যের তালিকা এবং পণ্যের বিবরণ দেখুন।',true,30),
  ('animal-feed','poultry-feed','পোলট্রি ফিড','পোলট্রি পালনে ব্যবহৃত ফিডের পণ্য ও প্যাকেটের তথ্য দেখুন।',true,10),
  ('animal-feed','cattle-feed','গবাদিপশুর খাদ্য','গবাদিপশুর খাদ্য পণ্য ও প্যাকেটের তথ্য দেখুন।',true,20)
on conflict (category_slug, slug) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = true,
  sort_order = excluded.sort_order,
  updated_at = now();

alter table public.products
  add column if not exists category_slug text,
  add column if not exists subcategory_slug text;

-- Backfill only exact, known legacy category labels; unknown values remain untouched.
update public.products p
set category_slug = c.slug
from public.product_categories c
where p.category_slug is null
  and lower(trim(p.category)) = lower(trim(c.name));

update public.products p
set subcategory_slug = s.slug
from public.product_subcategories s
where p.category_slug = s.category_slug
  and p.subcategory_slug is null
  and lower(trim(p.category)) = lower(trim(s.name));

alter table public.products
  drop constraint if exists products_category_slug_fkey,
  drop constraint if exists products_category_subcategory_slug_fkey;

alter table public.products
  add constraint products_category_slug_fkey
    foreign key (category_slug) references public.product_categories(slug) on update cascade on delete restrict,
  add constraint products_category_subcategory_slug_fkey
    foreign key (category_slug, subcategory_slug)
    references public.product_subcategories(category_slug, slug) on update cascade on delete restrict;

create index if not exists products_category_slug_status_idx
  on public.products (category_slug, status);
create index if not exists products_category_subcategory_status_idx
  on public.products (category_slug, subcategory_slug, status);

alter table public.product_subcategories enable row level security;
grant select on public.product_subcategories to anon, authenticated;
drop policy if exists "Active product subcategories are readable" on public.product_subcategories;
create policy "Active product subcategories are readable"
  on public.product_subcategories for select to anon, authenticated
  using (
    is_active = true and exists (
      select 1 from public.product_categories c
      where c.slug = product_subcategories.category_slug and c.is_active = true
    )
  );

create or replace function public.admin_set_product_taxonomy(
  p_product_id uuid,
  p_category_slug text,
  p_subcategory_slug text
)
returns public.products
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  result public.products;
  category_name text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin role required';
  end if;

  if p_category_slug is null or trim(p_category_slug) = '' then
    if p_subcategory_slug is not null and trim(p_subcategory_slug) <> '' then
      raise exception 'A subcategory requires a category';
    end if;
    update public.products
      set category = null, category_slug = null, subcategory_slug = null, updated_at = now()
      where id = p_product_id
      returning * into result;
  else
    select c.name into category_name
      from public.product_categories c
      where c.slug = trim(p_category_slug) and c.is_active = true;
    if category_name is null then raise exception 'Category does not exist or is inactive'; end if;

    if p_subcategory_slug is not null and trim(p_subcategory_slug) <> '' and not exists (
      select 1 from public.product_subcategories s
      where s.category_slug = trim(p_category_slug)
        and s.slug = trim(p_subcategory_slug)
        and s.is_active = true
    ) then
      raise exception 'Subcategory does not belong to category or is inactive';
    end if;

    update public.products
      set category = case
            when p_subcategory_slug is not null and trim(p_subcategory_slug) <> ''
            then (select s.name from public.product_subcategories s
                  where s.category_slug = trim(p_category_slug) and s.slug = trim(p_subcategory_slug))
            else category_name
          end,
          category_slug = trim(p_category_slug),
          subcategory_slug = nullif(trim(p_subcategory_slug), ''),
          updated_at = now()
      where id = p_product_id
      returning * into result;
  end if;

  if not found then raise exception 'Product not found'; end if;
  insert into public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(), 'product.taxonomy_updated', 'product', result.id,
    jsonb_build_object('category_slug', result.category_slug, 'subcategory_slug', result.subcategory_slug, 'legacy_category', result.category)
  );
  return result;
end;
$$;
revoke all on function public.admin_set_product_taxonomy(uuid, text, text) from public, anon;
grant execute on function public.admin_set_product_taxonomy(uuid, text, text) to authenticated;
