-- Support up to four Marketplace product photos and remove the bucket-specific 5 MiB cap.
alter table public.products
  add column if not exists image_urls text[] not null default '{}'::text[];

update public.products
set image_urls = array[image_url]
where image_url is not null
  and btrim(image_url) <> ''
  and coalesce(cardinality(image_urls), 0) = 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_image_urls_max_four'
  ) then
    alter table public.products
      add constraint products_image_urls_max_four
      check (cardinality(image_urls) <= 4);
  end if;
end;
$$;

update storage.buckets
set file_size_limit = null
where id = 'product-images';
