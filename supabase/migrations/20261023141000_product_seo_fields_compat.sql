-- Add product SEO metadata columns without replacing existing admin RPCs.
-- Kept separate from legacy 029/030 migrations because production history differs.
alter table public.products
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_keywords text,
  add column if not exists image_url text,
  add column if not exists brand text,
  add column if not exists sku text;

create unique index if not exists products_sku_unique
  on public.products (sku)
  where sku is not null and length(trim(sku)) > 0;

do $constraints$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_seo_title_length' and conrelid = 'public.products'::regclass) then
    alter table public.products add constraint products_seo_title_length
      check (seo_title is null or length(seo_title) <= 70);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_seo_description_length' and conrelid = 'public.products'::regclass) then
    alter table public.products add constraint products_seo_description_length
      check (seo_description is null or length(seo_description) <= 170);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_seo_keywords_length' and conrelid = 'public.products'::regclass) then
    alter table public.products add constraint products_seo_keywords_length
      check (seo_keywords is null or length(seo_keywords) <= 500);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_image_url_length' and conrelid = 'public.products'::regclass) then
    alter table public.products add constraint products_image_url_length
      check (image_url is null or (length(image_url) <= 2048 and image_url ~* '^https://'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_brand_length' and conrelid = 'public.products'::regclass) then
    alter table public.products add constraint products_brand_length
      check (brand is null or length(brand) <= 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_sku_length' and conrelid = 'public.products'::regclass) then
    alter table public.products add constraint products_sku_length
      check (sku is null or length(sku) <= 100);
  end if;
end;
$constraints$;
