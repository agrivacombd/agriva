-- Add a consumer-facing premium foods category while preserving existing product taxonomy.
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
