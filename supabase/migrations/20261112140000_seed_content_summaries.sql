alter table public.seed_category_content_sections
  add column if not exists summary text not null default '';
alter table public.seed_category_content_sections
  add constraint seed_category_content_summary_length
  check (length(summary) <= 500);
