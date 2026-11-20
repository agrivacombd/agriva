-- Support up to four Marketplace product photos and remove the bucket-specific 5 MiB cap.
alter table public.products
  add column if not exists image_urls text[] not null default '{}'::text[];

do $
begin
  -- Some deployed AGRIVA schemas already use image_urls and never had image_url.
  -- Backfill only when the legacy single-image column is actually present.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'image_url'
  ) then
    execute $backfill$
      update public.products
      set image_urls = array[image_url]
      where image_url is not null
        and btrim(image_url) <> ''
        and coalesce(cardinality(image_urls), 0) = 0
    $backfill$;
  end if;
end;
$;

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
