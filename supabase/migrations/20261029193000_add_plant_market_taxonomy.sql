-- Add a dedicated Plant Market taxonomy to the canonical product catalogue.
-- This migration is additive and idempotent; it does not publish or recategorize existing products.

INSERT INTO public.product_categories (slug, name, description, is_active, sort_order)
VALUES (
  'plants-gardening',
  'গাছ ও বাগান',
  'ইনডোর গাছ, ফল ও ফুলের চারা, টব এবং বাগানের পরিচর্যার পণ্য',
  true,
  15
)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = true,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

INSERT INTO public.product_subcategories (category_slug, slug, name, description, is_active, sort_order)
VALUES
  ('plants-gardening', 'indoor-plants', 'ইনডোর ও শোভাবর্ধক গাছ', 'ঘর, অফিস ও বারান্দার ইনডোর এবং শোভাবর্ধক গাছ', true, 10),
  ('plants-gardening', 'fruit-saplings', 'ফলের গাছ ও চারা', 'ফলজ গাছের চারা ও কলম', true, 20),
  ('plants-gardening', 'flowering-plants', 'ফুলের গাছ ও চারা', 'ফুলের গাছ, চারা ও মৌসুমি ফুল', true, 30),
  ('plants-gardening', 'vegetable-herb-seedlings', 'সবজি ও ভেষজ চারা', 'সবজি, রান্নার ভেষজ ও মসলা গাছের চারা', true, 40),
  ('plants-gardening', 'plant-pots-planters', 'টব ও প্ল্যান্টার', 'মাটি, সিরামিক ও প্লাস্টিকের টব এবং প্ল্যান্টার', true, 50),
  ('plants-gardening', 'soil-compost-growing-media', 'মাটি, কম্পোস্ট ও গ্রোয়িং মিডিয়া', 'পটিং মিক্স, কোকোপিট ও বাগানের জন্য কম্পোস্ট', true, 60),
  ('plants-gardening', 'gardening-tools', 'বাগানের সরঞ্জাম', 'হ্যান্ড টুল, স্প্রে ও গাছের পরিচর্যার সরঞ্জাম', true, 70),
  ('plants-gardening', 'plant-seeds-bulbs', 'গাছের বীজ ও বাল্ব', 'ফুল, সবজি ও শোভাবর্ধক গাছের বপনের বীজ ও বাল্ব', true, 80)
ON CONFLICT (category_slug, slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = true,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();
