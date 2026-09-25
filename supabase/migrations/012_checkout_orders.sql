-- AGRIVA checkout compatibility migration.
-- Cart/order settlement is implemented by 014_marketplace_production.sql.
-- This migration intentionally contains only the persistent cart primitives so it can run safely after the legacy 001 order schema.
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  session_id text,
  status text not null default 'active' check(status in ('active','converted','abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(user_id is not null or session_id is not null)
);
create unique index if not exists carts_user_active_idx on public.carts(user_id) where status='active' and user_id is not null;
create unique index if not exists carts_session_active_idx on public.carts(session_id) where status='active' and session_id is not null;
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null,
  quantity integer not null check(quantity>0 and quantity<=1000),
  unit_price numeric(12,2) not null check(unit_price>=0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cart_id,product_id)
);
create index if not exists cart_items_cart_idx on public.cart_items(cart_id);
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
create policy if not exists "cart_owner_read" on public.carts for select using(auth.uid()=user_id);
create policy if not exists "cart_owner_write" on public.carts for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy if not exists "cart_item_owner_read" on public.cart_items for select using(exists(select 1 from public.carts c where c.id=cart_id and c.user_id=auth.uid()));
create policy if not exists "cart_item_owner_write" on public.cart_items for all using(exists(select 1 from public.carts c where c.id=cart_id and c.user_id=auth.uid())) with check(exists(select 1 from public.carts c where c.id=cart_id and c.user_id=auth.uid()));
create or replace function public.add_cart_item(p_product_id uuid,p_quantity integer,p_unit_price numeric) returns public.cart_items language plpgsql security definer set search_path=public as $$
declare c public.carts; i public.cart_items; uid uuid;
begin uid:=auth.uid(); if uid is null then raise exception 'Authentication required'; end if; if p_quantity<1 or p_quantity>1000 then raise exception 'Invalid quantity'; end if; select * into c from public.carts where user_id=uid and status='active' for update; if not found then insert into public.carts(user_id) values(uid) returning * into c; end if; insert into public.cart_items(cart_id,product_id,quantity,unit_price) values(c.id,p_product_id,p_quantity,p_unit_price) on conflict(cart_id,product_id) do update set quantity=least(1000,public.cart_items.quantity+excluded.quantity),unit_price=excluded.unit_price,updated_at=now() returning * into i; update public.carts set updated_at=now() where id=c.id; return i; end;$$;
grant execute on function public.add_cart_item(uuid,integer,numeric) to authenticated;
create or replace function public.clear_active_cart() returns void language plpgsql security definer set search_path=public as $$ declare uid uuid; c uuid; begin uid:=auth.uid(); if uid is null then raise exception 'Authentication required'; end if; select id into c from public.carts where user_id=uid and status='active'; if c is not null then update public.carts set status='converted',updated_at=now() where id=c; end if; end;$$;
grant execute on function public.clear_active_cart() to authenticated;
