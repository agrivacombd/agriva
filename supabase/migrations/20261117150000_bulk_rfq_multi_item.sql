-- Additive multi-item RFQ extension; legacy single-item requests remain supported.
create table public.bulk_request_items (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.bulk_requests(id) on delete cascade,
 position integer not null check (position between 0 and 19),
 product_name text not null check (length(trim(product_name)) between 2 and 120),
 specification text not null default '' check (length(specification)<=2000),
 quantity numeric(15,3) not null check (quantity>0 and quantity<=1000000),
 unit text not null check (unit in ('kg','ton','maund','bag','packet')),
 unique (request_id,position),
 unique (id,request_id)
);
create table public.bulk_item_offers (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null,
 quote_id uuid not null references public.bulk_quotes(id) on delete cascade,
 item_id uuid not null,
 unit_price numeric(15,2) not null check (unit_price>0 and unit_price<=1000000),
 shipping_fee numeric(15,2) not null default 0 check(shipping_fee>=0 and shipping_fee<=100000000),
 extra_fee numeric(15,2) not null default 0 check(extra_fee>=0 and extra_fee<=100000000),
 unique (quote_id,item_id),
 foreign key (item_id,request_id) references public.bulk_request_items(id,request_id) on delete cascade
);
create table public.bulk_item_awards (
 item_id uuid primary key references public.bulk_request_items(id) on delete cascade,
 offer_id uuid not null unique references public.bulk_item_offers(id),
 request_id uuid not null references public.bulk_requests(id) on delete cascade,
 buyer_id uuid not null references auth.users(id),
 fulfillment_status text not null default 'pending_confirmation'
  check(fulfillment_status in ('pending_confirmation','confirmed','processing','shipped','delivered','completed','cancelled')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index bulk_request_items_request_idx on public.bulk_request_items(request_id,position);
create index bulk_item_offers_request_idx on public.bulk_item_offers(request_id,quote_id);
create index bulk_item_awards_request_idx on public.bulk_item_awards(request_id);
alter table public.bulk_request_items enable row level security;
alter table public.bulk_item_offers enable row level security;
alter table public.bulk_item_awards enable row level security;
revoke all on public.bulk_request_items,public.bulk_item_offers,public.bulk_item_awards from public,anon,authenticated;
grant select on public.bulk_request_items,public.bulk_item_offers,public.bulk_item_awards to authenticated;
create policy bulk_items_read on public.bulk_request_items for select to authenticated
using (exists(select 1 from public.bulk_requests r where r.id=request_id));
create policy bulk_item_offers_read on public.bulk_item_offers for select to authenticated
using (exists(select 1 from public.bulk_quotes q where q.id=quote_id and
 (q.wholesaler_id=auth.uid() or public.bulk_is_admin() or
 (q.status='approved' and exists(select 1 from public.bulk_requests r
 where r.id=q.request_id and r.buyer_id=auth.uid())))));
create policy bulk_item_awards_read on public.bulk_item_awards for select to authenticated
using (buyer_id=auth.uid() or public.bulk_is_admin() or
 exists(select 1 from public.bulk_item_offers o join public.bulk_quotes q on q.id=o.quote_id
 where o.id=offer_id and q.wholesaler_id=auth.uid()));
-- New requests and items are atomically created. No client INSERT to item tables.
create or replace function public.bulk_create_multi_request(
 p_buyer_type text,p_visibility text,p_district text,p_upazila text,p_items jsonb)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid();v_request uuid;v_item jsonb;v_i integer:=0;
 v_name text;v_spec text;v_qty numeric;v_unit text;
begin
 if v_user is null then raise exception 'Login required' using errcode='42501'; end if;
 if p_buyer_type not in ('individual','business') or p_visibility not in ('public','private') or
 length(trim(coalesce(p_district,''))) not between 2 and 80 or length(coalesce(p_upazila,''))>80 then
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
   v_unit:=coalesce(v_item->>'unit','');
   if (v_item->>'quantity') !~ '^[0-9]{1,7}(\.[0-9]{1,3})?$'
   then raise exception 'Invalid quantity'; end if;
   v_qty:=(v_item->>'quantity')::numeric;
   if length(v_name) not between 2 and 120 or length(v_spec)>2000
   or v_qty<=0 or v_qty>1000000 or v_unit not in ('kg','ton','maund','bag','packet')
   then raise exception 'Invalid product details'; end if;
   if v_i=0 then
     insert into public.bulk_requests(buyer_id,buyer_type,visibility,product_name,specification,
       quantity,unit,district,upazila,status)
     values(v_user,p_buyer_type,p_visibility,v_name,v_spec,v_qty,v_unit,
       trim(p_district),coalesce(trim(p_upazila),''),'pending_review')
     returning id into v_request;
   end if;
   insert into public.bulk_request_items(request_id,position,product_name,specification,quantity,unit)
   values(v_request,v_i,v_name,v_spec,v_qty,v_unit);
   v_i:=v_i+1;
 end loop;
 return v_request;
end $$;
-- Supplier prices subset of request items; shipping and fees are per line (no double-count).
create or replace function public.bulk_submit_multi_quote(
 p_request uuid,p_lines jsonb,p_lead_days integer,p_details text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid();v_quote uuid;v_line jsonb;v_item uuid;
v_price numeric;v_shipping numeric;v_extra numeric;v_first numeric;v_count integer:=0;
begin
 if v_user is null or p_lead_days not between 1 and 365 or length(coalesce(p_details,''))>2000
 or jsonb_typeof(p_lines) is distinct from 'array' or jsonb_array_length(p_lines) not between 1 and 20
 then raise exception 'Invalid quotation'; end if;
 perform 1 from public.bulk_requests r where r.id=p_request and r.status='open'
 and r.buyer_id<>v_user and (r.quote_deadline is null or r.quote_deadline>now()) for update;
 if not found then raise exception 'Request unavailable'; end if;
 if not exists(select 1 from public.bulk_wholesalers w where w.user_id=v_user and w.status='verified')
 or not exists(select 1 from public.bulk_invitations i where i.wholesaler_id=v_user
 and i.request_id=p_request and i.revoked_at is null and i.expires_at>now())
 then raise exception 'Not invited or not verified' using errcode='42501'; end if;
 for v_line in select value from jsonb_array_elements(p_lines) loop
   if jsonb_typeof(v_line) is distinct from 'object' or
    (v_line->>'item_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or
    (v_line->>'unit_price') !~ '^[0-9]{1,7}(\.[0-9]{1,2})?$' or
    (v_line->>'shipping_fee') !~ '^[0-9]{1,9}(\.[0-9]{1,2})?$' or
    (v_line->>'extra_fee') !~ '^[0-9]{1,9}(\.[0-9]{1,2})?$'
   then raise exception 'Invalid line price'; end if;
   v_item:=(v_line->>'item_id')::uuid;
   v_price:=(v_line->>'unit_price')::numeric;
   v_shipping:=(v_line->>'shipping_fee')::numeric;
   v_extra:=(v_line->>'extra_fee')::numeric;
   if v_price<=0 or v_price>1000000 or v_shipping>100000000 or v_extra>100000000 or
    not exists(select 1 from public.bulk_request_items where id=v_item and request_id=p_request)
   then raise exception 'Invalid product or price'; end if;
   if v_count=0 then
    insert into public.bulk_quotes(request_id,wholesaler_id,unit_price,shipping_fee,extra_fee,lead_days,
     details,expires_at,status)
    values(p_request,v_user,v_price,0,0,p_lead_days,coalesce(p_details,''),now()+interval '7 days','pending')
    returning id into v_quote;
    v_first:=v_price;
   end if;
   insert into public.bulk_item_offers(request_id,quote_id,item_id,unit_price,shipping_fee,extra_fee)
   values(p_request,v_quote,v_item,v_price,v_shipping,v_extra);
   v_count:=v_count+1;
 end loop;
 return v_quote;
end $$;
-- Atomic per-item buyer selection; different wholesalers can win different items.
create or replace function public.bulk_select_item_offer(p_offer uuid)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_item uuid;v_request uuid;v_owner uuid;v_supplier uuid;
begin
 select o.item_id,o.request_id,r.buyer_id,q.wholesaler_id
 into v_item,v_request,v_owner,v_supplier
 from public.bulk_item_offers o join public.bulk_quotes q on q.id=o.quote_id
 join public.bulk_requests r on r.id=o.request_id
 where o.id=p_offer for update of r;
 if v_item is null or v_owner is distinct from auth.uid() then
 raise exception 'Not your order' using errcode='42501'; end if;
 if not exists(select 1 from public.bulk_item_offers o join public.bulk_quotes q on q.id=o.quote_id
 join public.bulk_wholesalers w on w.user_id=q.wholesaler_id and w.status='verified'
 where o.id=p_offer and q.status='approved' and q.expires_at>now())
 or not exists(select 1 from public.bulk_requests where id=v_request and status='open')
 then raise exception 'Offer unavailable'; end if;
 insert into public.bulk_item_awards(item_id,offer_id,request_id,buyer_id)
 values(v_item,p_offer,v_request,auth.uid());
 if not exists (
 select 1 from public.bulk_request_items i where i.request_id=v_request
 and not exists(select 1 from public.bulk_item_awards a where a.item_id=i.id)
 ) then
  update public.bulk_requests set status='selected' where id=v_request;
  delete from public.bulk_public_listings where id=v_request;
 end if;
 return v_item;
exception when unique_violation then raise exception 'Item already awarded';
end $$;
-- Admin can track each product independently.
create or replace function public.bulk_transition_item_fulfillment(p_item uuid,p_status text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_current text;
begin
 if not public.bulk_is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 select fulfillment_status into v_current from public.bulk_item_awards where item_id=p_item for update;
 if v_current is null then raise exception 'Award not found'; end if;
 if not ((v_current='pending_confirmation' and p_status in ('confirmed','cancelled'))
 or (v_current='confirmed' and p_status in ('processing','cancelled'))
 or (v_current='processing' and p_status in ('shipped','cancelled'))
 or (v_current='shipped' and p_status='delivered')
 or (v_current='delivered' and p_status='completed')) then raise exception 'Invalid status'; end if;
 update public.bulk_item_awards set fulfillment_status=p_status,updated_at=now() where item_id=p_item;
end $$;
revoke execute on function public.bulk_create_multi_request(text,text,text,text,jsonb),
 public.bulk_submit_multi_quote(uuid,jsonb,integer,text),public.bulk_select_item_offer(uuid),
 public.bulk_transition_item_fulfillment(uuid,text) from public,anon;
grant execute on function public.bulk_create_multi_request(text,text,text,text,jsonb),
 public.bulk_submit_multi_quote(uuid,jsonb,integer,text),public.bulk_select_item_offer(uuid),
 public.bulk_transition_item_fulfillment(uuid,text) to authenticated;
