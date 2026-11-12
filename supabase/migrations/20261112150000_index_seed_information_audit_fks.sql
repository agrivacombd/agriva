create index if not exists seed_category_content_updated_by_idx
  on public.seed_category_content_sections (updated_by)
  where updated_by is not null;
create index if not exists seed_crop_guides_updated_by_idx
  on public.seed_crop_guides (updated_by)
  where updated_by is not null;
create index if not exists product_seed_details_updated_by_idx
  on public.product_seed_details (updated_by)
  where updated_by is not null;
