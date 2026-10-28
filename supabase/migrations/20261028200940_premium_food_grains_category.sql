-- Add a consumer-facing premium foods category while preserving existing product taxonomy.
-- Legacy production did not yet have product subcategories or product taxonomy columns.
create table if not exists public.product_subcategories (
  id uuid primary key default gen_random_uuid(),
  category_slug text not null references public.product_categories(slug) on update cascade on delete cascade,
  slug text not null,
  name text not null,
  description text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_subcategories_category_slug_slug_key unique (category_slug, slug)
);

alter table public.product_subcategories enable row level security;

alter table public.products
  add column if not exists category_slug text,
  add column if not exists subcategory_slug text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_category_subcategory_fkey'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_category_subcategory_fkey
      foreign key (category_slug, subcategory_slug)
      references public.product_subcategories(category_slug, slug)
      on update cascade on delete set null;
  end if;
end $$;

create index if not exists product_subcategories_active_sort_idx
  on public.product_subcategories (category_slug, is_active, sort_order);

insert into public.product_categories (name, slug, description, is_active, sort_order)
values ('Premium Food & Grains', 'premium-food-grains', 'চিয়া সিড, কালো চাল, লাল চাল, ব্রাউন রাইস ও অন্যান্য প্রিমিয়াম খাদ্যশস্য', true, 70)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = true,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.product_subcategories (category_slug, slug, name, description, is_active, sort_order)
values
  ('premium-food-grains', 'premium-rice', 'প্রিমিয়াম চাল', 'কালো চাল, লাল চাল, ব্রাউন রাইস, বাসমতি ও অন্যান্য প্রিমিয়াম চালের পণ্য দেখুন।', true, 10),
  ('premium-food-grains', 'edible-seeds', 'খাদ্যোপযোগী সিডস', 'খাওয়ার উপযোগী চিয়া সিড ও অন্যান্য খাদ্যবীজের প্যাকেটজাত পণ্য; বপনের বীজ থেকে আলাদা।', true, 20),
  ('premium-food-grains', 'nuts-dried-fruit', 'বাদাম ও শুকনো ফল', 'বাদাম, খেজুর ও শুকনো ফলের প্যাকেটজাত পণ্য দেখুন।', true, 30),
  ('premium-food-grains', 'honey-natural-foods', 'মধু ও প্রাকৃতিক খাদ্য', 'মধু ও অন্যান্য প্যাকেটজাত প্রাকৃতিক খাদ্যপণ্যের বিবরণ দেখুন।', true, 40)
on conflict (category_slug, slug) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = true,
  sort_order = excluded.sort_order,
  updated_at = now();