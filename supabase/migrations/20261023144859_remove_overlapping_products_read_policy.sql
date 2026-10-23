-- The scoped anon/authenticated policies fully replace this broad policy.
drop policy if exists products_public_active on public.products;
