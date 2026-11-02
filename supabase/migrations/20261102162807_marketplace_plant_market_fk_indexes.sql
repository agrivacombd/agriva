-- Cover newly introduced foreign keys for collection actors and Plant Market items.
begin;

create index if not exists cod_collection_events_collected_by_idx
  on public.cod_collection_events(collected_by);

create index if not exists plant_market_cart_items_product_id_idx
  on public.plant_market_cart_items(product_id);

create index if not exists plant_market_order_items_product_id_idx
  on public.plant_market_order_items(product_id);

commit;
