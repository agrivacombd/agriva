-- Seed-specific product attributes. Optional fields keep non-seed products compatible.
alter table public.products
  add column if not exists crop_name text,
  add column if not exists seed_variety text,
  add column if not exists pack_size text,
  add column if not exists germination_rate numeric(5,2),
  add column if not exists sowing_season text,
  add column if not exists suitable_regions text,
  add column if not exists seed_expiry_date date;

alter table public.products
  add constraint products_crop_name_length check (crop_name is null or length(crop_name) <= 120),
  add constraint products_seed_variety_length check (seed_variety is null or length(seed_variety) <= 160),
  add constraint products_pack_size_length check (pack_size is null or length(pack_size) <= 80),
  add constraint products_germination_rate_range check (germination_rate is null or (germination_rate >= 0 and germination_rate <= 100)),
  add constraint products_sowing_season_length check (sowing_season is null or length(sowing_season) <= 160),
  add constraint products_suitable_regions_length check (suitable_regions is null or length(suitable_regions) <= 500);

create or replace function public.admin_set_seed_details(
  p_product_id uuid,
  p_crop_name text default null,
  p_seed_variety text default null,
  p_pack_size text default null,
  p_germination_rate numeric default null,
  p_sowing_season text default null,
  p_suitable_regions text default null,
  p_seed_expiry_date date default null
) returns public.products
language plpgsql security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare result public.products;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Admin role required'; end if;
  if p_product_id is null then raise exception 'Product ID required'; end if;
  if length(coalesce(p_crop_name,'')) > 120 or length(coalesce(p_seed_variety,'')) > 160
    or length(coalesce(p_pack_size,'')) > 80 or length(coalesce(p_sowing_season,'')) > 160
    or length(coalesce(p_suitable_regions,'')) > 500 then raise exception 'Seed field length exceeded'; end if;
  if p_germination_rate is not null and (p_germination_rate < 0 or p_germination_rate > 100) then raise exception 'Germination rate must be between 0 and 100'; end if;
  update public.products set
    crop_name=nullif(trim(coalesce(p_crop_name,'')),''),
    seed_variety=nullif(trim(coalesce(p_seed_variety,'')),''),
    pack_size=nullif(trim(coalesce(p_pack_size,'')),''),
    germination_rate=p_germination_rate,
    sowing_season=nullif(trim(coalesce(p_sowing_season,'')),''),
    suitable_regions=nullif(trim(coalesce(p_suitable_regions,'')),''),
    seed_expiry_date=p_seed_expiry_date,
    updated_at=now()
  where id=p_product_id returning * into result;
  if not found then raise exception 'Product not found'; end if;
  insert into public.admin_audit_log(admin_id,action,entity_type,entity_id,metadata)
  values(auth.uid(),'product.seed_details_updated','product',result.id,jsonb_build_object('crop_name',result.crop_name,'seed_variety',result.seed_variety,'has_seed_details',result.crop_name is not null or result.seed_variety is not null));
  return result;
end;
$$;
revoke all on function public.admin_set_seed_details(uuid,text,text,text,numeric,text,text,date) from public, anon;
grant execute on function public.admin_set_seed_details(uuid,text,text,text,numeric,text,text,date) to authenticated;
