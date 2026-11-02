-- Cover newly introduced checkout foreign keys so deletes/updates and joins
-- do not require sequential scans on the referencing tables.
create index if not exists plant_market_cart_items_product_id_idx
  on public.plant_market_cart_items (product_id);

create index if not exists plant_market_order_items_product_id_idx
  on public.plant_market_order_items (product_id);

-- The COD collection event actor FK is used by the Marketplace operational
-- collection audit view and was also reported by the production advisor.
create index if not exists cod_collection_events_collected_by_idx
  on public.cod_collection_events (collected_by);
