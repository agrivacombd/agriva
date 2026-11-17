-- Bulk RFQ units are seller/buyer supplied labels (e.g., পিস, ডজন, লিটার, ট্রে).
-- Delivery location is entered once after products and may be omitted at RFQ stage.
-- Existing legacy units, requests and public listing projection remain compatible.
alter table public.bulk_requests drop constraint if exists bulk_requests_unit_check;
alter table public.bulk_request_items drop constraint if exists bulk_request_items_unit_check;
alter table public.bulk_requests drop constraint if exists bulk_requests_district_check;

alter table public.bulk_requests add constraint bulk_requests_unit_check
  check (length(trim(unit)) between 1 and 30 and unit <> '__custom__' and unit !~ '[[:cntrl:]<>]');
alter table public.bulk_request_items add constraint bulk_request_items_unit_check
  check (length(trim(unit)) between 1 and 30 and unit <> '__custom__' and unit !~ '[[:cntrl:]<>]');
alter table public.bulk_requests add constraint bulk_requests_district_check
  check (length(trim(district)) <= 80);

-- Preserve buyer auth, rate limiting and atomic insert while validating custom units.
create or replace function public.bulk_create_multi_request(
 p_buyer_type text,p_visibility text,p_district text,p_upazila text,p_items jsonb)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid();v_request uuid;v_item jsonb;v_i integer:=0;
 v_name text;v_spec text;v_qty numeric;v_unit text;
begin
 if v_user is null then raise exception 'Login required' using errcode='42501'; end if;
 if p_buyer_type not in ('individual','business') or p_visibility not in ('public','private') or
 length(trim(coalesce(p_district,''))) > 80 or length(coalesce(p_upazila,''))>80 then
 raise exception 'Invalid buyer or address details'; end if;
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 20 then
 raise exception 'Provide 1 to 20 products'; end if;
 -- Preserve the same rate rules even though SECURITY DEFINER bypasses base-table INSERT RLS.
 if exists(select 1 from public.bulk_requests where buyer_id=v_user and created_at>now()-interval '30 seconds')
 or (select count(*) from public.bulk_requests where buyer_id=v_user and created_at>now()-interval '24 hours')>=20
 then raise exception 'Please wait before creating another order'; end if;
 for v_item in select value from jsonb_array_elements(p_items) loop
   if jsonb_typeof(v_item) is distinct from 'object' then raise exception 'Invalid item'; end if;
   v_name:=trim(coalesce(v_item->>'name',''));
   v_spec:=coalesce(v_item->>'specification','');
   v_unit:=trim(coalesce(v_item->>'unit',''));
   if (v_item->>'quantity') !~ '^[0-9]{1,7}(\.[0-9]{1,3})?$'
   then raise exception 'Invalid quantity'; end if;
   v_qty:=(v_item->>'quantity')::numeric;
   if length(v_name) not between 2 and 120 or length(v_spec)>2000
   or v_qty<=0 or v_qty>1000000 or length(v_unit) not between 1 and 30 or v_unit='__custom__' or v_unit ~ '[[:cntrl:]<>]'
   then raise exception 'Invalid product details'; end if;
   if v_i=0 then
     insert into public.bulk_requests(buyer_id,buyer_type,visibility,product_name,specification,
       quantity,unit,district,upazila,status)
     values(v_user,p_buyer_type,p_visibility,v_name,v_spec,v_qty,v_unit,
       trim(coalesce(p_district,'')),trim(coalesce(p_upazila,'')),'pending_review')
     returning id into v_request;
   end if;
   insert into public.bulk_request_items(request_id,position,product_name,specification,quantity,unit)
   values(v_request,v_i,v_name,v_spec,v_qty,v_unit);
   v_i:=v_i+1;
 end loop;
 return v_request;
end $$;

-- Keep the authenticated RPC contract and deny anonymous access.
revoke execute on function public.bulk_create_multi_request(text,text,text,text,jsonb) from public,anon;
grant execute on function public.bulk_create_multi_request(text,text,text,text,jsonb) to authenticated;
