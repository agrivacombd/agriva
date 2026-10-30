-- Explicit sale unit for marketplace product price and stock quantities.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS unit text;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_unit_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_unit_check
  CHECK (unit IS NULL OR unit IN ('kg', 'g', 'piece', 'pack', 'liter', 'bag'));

COMMENT ON COLUMN public.products.unit IS
  'Seller-selected unit used for both the listed unit price and available stock quantity. NULL means legacy listing has no declared unit.';
