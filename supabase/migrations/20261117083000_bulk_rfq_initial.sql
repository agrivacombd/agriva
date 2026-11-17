-- AGRIVA private-quote/public-discovery RFQ (additive; apply to staging first)
create extension if not exists pgcrypto;
create or replace function public.bulk_is_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin') $$;
revoke all on function public.bulk_is_admin() from public;
grant execute on function public.bulk_is_admin() to authenticated;

create table if not exists public.bulk_requests (
 id uuid primary key default gen_random_uuid(),
 buyer_id uuid not null references auth.users(id),
 buyer_type text not null check (buyer_type in ('individual','business')),
 visibility text not null default 'public' check(visibility in ('public','private')),
 status text not null default 'pending_review' check(status in ('pending_review','open','closed','selected','cancelled')),
 product_name text not null check(length(trim(product_name)) between 2 and 120),
 specification text not null default '' check(length(specification)<=2000),
 quantity numeric(15,3) not null check(quantity>0 and quantity<=10000000),
 unit text not null check(unit in ('kg','ton','maund','bag','packet')),
 district text not null check(length(trim(district)) between 2 and 80),
 upazila text not null default '' check(length(upazila)<=80),
 desired_date date,
 quote_deadline timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists bulk_requests_buyer_idx on public.bulk_requests(buyer_id,created_at desc);
create table if not exists public.bulk_invitations (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.bulk_requests(id) on delete cascade,
 wholesaler_id uuid not null references auth.users(id),
 expires_at timestamptz not null default(now()+interval '7 days'),
 revoked_at timestamptz,
 created_at timestamptz not null default now(),
 unique(request_id,wholesaler_id)
);
create table if not exists public.bulk_quotes (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.bulk_requests(id) on delete cascade,
 wholesaler_id uuid not null references auth.users(id),
 unit_price numeric(15,2) not null check(unit_price>0 and unit_price<=100000000),
 shipping_fee numeric(15,2) not null default 0 check(shipping_fee>=0),
 extra_fee numeric(15,2) not null default 0 check(extra_fee>=0),
 lead_days integer not null check(lead_days between 1 and 365),
 details text not null default '' check(length(details)<=2000),
 expires_at timestamptz not null,
 status text not null default 'pending' check(status in ('pending','approved','rejected','withdrawn')),
 created_at timestamptz not null default now(),
 unique(request_id,wholesaler_id)
);
create table if not exists public.bulk_selections (
 request_id uuid primary key references public.bulk_requests(id) on delete cascade,
 quote_id uuid not null unique references public.bulk_quotes(id),
 buyer_id uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create view public.bulk_public_listings with (security_barrier=true) as
 select id, product_name, quantity, unit, district, upazila, desired_date, quote_deadline, created_at
 from public.bulk_requests where status='open' and visibility='public'
 and (quote_deadline is null or quote_deadline>now());
revoke all on public.bulk_public_listings from public;
grant select on public.bulk_public_listings to anon,authenticated;

alter table public.bulk_requests enable row level security;
alter table public.bulk_invitations enable row level security;
alter table public.bulk_quotes enable row level security;
alter table public.bulk_selections enable row level security;
revoke all on public.bulk_requests, public.bulk_invitations, public.bulk_quotes, public.bulk_selections from anon;
revoke all on public.bulk_requests, public.bulk_invitations, public.bulk_quotes, public.bulk_selections from authenticated;
grant select,insert on public.bulk_requests to authenticated;
grant select,insert on public.bulk_invitations to authenticated;
grant select,insert on public.bulk_quotes to authenticated;
grant select on public.bulk_selections to authenticated;
-- Admin status changes happen ONLY through the admin RPCs below.
create policy bulk_request_read on public.bulk_requests for select to authenticated
 using (buyer_id=auth.uid() or public.bulk_is_admin() or
 exists(select 1 from public.bulk_invitations i where i.request_id=id and i.wholesaler_id=auth.uid() and i.revoked_at is null and i.expires_at>now()));
create policy bulk_request_create on public.bulk_requests for insert to authenticated
 with check (buyer_id=auth.uid() and status='pending_review');
create policy bulk_invitation_read on public.bulk_invitations for select to authenticated
 using (wholesaler_id=auth.uid() or public.bulk_is_admin());
create policy bulk_invitation_admin_create on public.bulk_invitations for insert to authenticated
 with check (public.bulk_is_admin());
create policy bulk_quote_read on public.bulk_quotes for select to authenticated
 using (wholesaler_id=auth.uid() or public.bulk_is_admin() or
 (status='approved' and exists(select 1 from public.bulk_requests r where r.id=request_id and r.buyer_id=auth.uid())));
create policy bulk_quote_create on public.bulk_quotes for insert to authenticated
 with check (wholesaler_id=auth.uid() and status='pending' and expires_at>now() and
 exists(select 1 from public.bulk_requests r where r.id=request_id and r.status='open' and r.buyer_id<>auth.uid() and (r.quote_deadline is null or r.quote_deadline>now())) and
 exists(select 1 from public.bulk_invitations i where i.request_id=request_id and i.wholesaler_id=auth.uid() and i.revoked_at is null and i.expires_at>now()));
create policy bulk_selection_read on public.bulk_selections for select to authenticated
 using (buyer_id=auth.uid() or public.bulk_is_admin() or exists(select 1 from public.bulk_quotes q where q.id=quote_id and q.wholesaler_id=auth.uid()));

create or replace function public.bulk_moderate_request(p_request uuid, p_status text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not public.bulk_is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_status not in ('open','closed','cancelled') then raise exception 'Invalid status'; end if;
 update public.bulk_requests set status=p_status where id=p_request and status in ('pending_review','open','closed');
 if not found then raise exception 'Request not found or status transition forbidden'; end if;
end $$;
create or replace function public.bulk_moderate_quote(p_quote uuid,p_status text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not public.bulk_is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_status not in ('approved','rejected') then raise exception 'Invalid status'; end if;
 update public.bulk_quotes q set status=p_status
 from public.bulk_requests r
 where q.id=p_quote and q.request_id=r.id and q.status in ('pending','approved') and r.status='open'
 and (p_status='rejected' or q.expires_at>now());
 if not found then raise exception 'Quote unavailable'; end if;
end $$;
create or replace function public.bulk_select_quote(p_quote uuid)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_request uuid; v_buyer uuid; v_deadline timestamptz;
begin
 select r.id,r.buyer_id,r.quote_deadline into v_request,v_buyer,v_deadline
 from public.bulk_requests r join public.bulk_quotes q on q.request_id=r.id
 where q.id=p_quote for update of r;
 if v_request is null or v_buyer<>auth.uid() then raise exception 'Not permitted' using errcode='42501'; end if;
 if not exists(select 1 from public.bulk_quotes q where q.id=p_quote and q.status='approved' and q.expires_at>now())
 or not exists(select 1 from public.bulk_requests where id=v_request and status='open')
 then raise exception 'Quote not available'; end if;
 insert into public.bulk_selections(request_id,quote_id,buyer_id) values(v_request,p_quote,auth.uid());
 update public.bulk_requests set status='selected' where id=v_request;
 return v_request;
exception when unique_violation then raise exception 'Request already selected';
end $$;
revoke all on function public.bulk_moderate_request(uuid,text),public.bulk_moderate_quote(uuid,text),public.bulk_select_quote(uuid) from public;
grant execute on function public.bulk_moderate_request(uuid,text),public.bulk_moderate_quote(uuid,text),public.bulk_select_quote(uuid) to authenticated;
