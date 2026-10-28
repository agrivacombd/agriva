-- Add a consumer-facing premium foods category while preserving existing product taxonomy.
insert into public.product_categories (name, slug, description, is_active, sort_order)
values ('প্রিমিয়াম ও সুপারফুড', 'premium-superfoods', 'প্রিমিয়াম চাল, চিয়া সিড, বীজ, বাদাম ও স্বাস্থ্যকর খাদ্যপণ্য', true, 70)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = true,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.product_subcategories (category_slug, slug, name, description, is_active, sort_order)
values
  ('premium-superfoods', 'premium-rice', 'প্রিমিয়াম চাল', 'বাসমতি, কালিজিরা, চিনিগুঁড়া ও অন্যান্য প্রিমিয়াম চালের পণ্য দেখুন।', true, 10),
  ('premium-superfoods', 'superfoods-seeds', 'সুপারফুড ও সিডস', 'চিয়া সিড, ফ্ল্যাক্স সিড, পাম্পকিন সিড ও অন্যান্য খাদ্যবীজের পণ্য দেখুন।', true, 20),
  ('premium-superfoods', 'nuts-dried-fruit', 'বাদাম ও শুকনো ফল', 'বাদাম, খেজুর ও শুকনো ফলের প্যাকেটজাত পণ্য দেখুন।', true, 30),
  ('premium-superfoods', 'honey-natural-foods', 'মধু ও প্রাকৃতিক খাদ্য', 'মধু ও অন্যান্য প্যাকেটজাত প্রাকৃতিক খাদ্যপণ্যের বিবরণ দেখুন।', true, 40)
on conflict (category_slug, slug) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = true,
  sort_order = excluded.sort_order,
  updated_at = now();
