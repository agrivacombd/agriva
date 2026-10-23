-- Allow Super Admin to assign existing managed categories to products.
create or replace function public.admin_set_product_category(p_product_id uuid, p_category text)
returns public.products
language plpgsql security definer set search_path=public
as $$
declare result public.products;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Admin role required'; end if;
 if p_category is not null and not exists(select 1 from public.product_categories where name=trim(p_category)) then
   raise exception 'Category does not exist';
 end if;
 update public.products set category=nullif(trim(p_category),''), updated_at=now()
 where id=p_product_id returning * into result;
 if not found then raise exception 'Product not found'; end if;
 insert into public.admin_audit_log(admin_id,action,entity_type,entity_id,metadata)
 values(auth.uid(),'product.category_updated','product',result.id,jsonb_build_object('category',result.category));
 return result;
end; $$;
grant execute on function public.admin_set_product_category(uuid,text) to authenticated;
