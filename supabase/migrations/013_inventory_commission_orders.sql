-- AGRIVA atomic inventory validation + commission settlement foundation.
create table if not exists public.commission_ledger (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  order_item_id uuid,
  reseller_id uuid references public.profiles(id) on delete set null,
  farmer_id uuid references public.profiles(id) on delete set null,
  amount numeric(12,2) not null,
  status text not null default 'pending' check(status in ('pending','earned','reversed')),
  created_at timestamptz not null default now()
);
create unique index if not exists commission_ledger_order_item_idx on public.commission_ledger(order_item_id) where order_item_id is not null;
create index if not exists commission_ledger_reseller_idx on public.commission_ledger(reseller_id,created_at desc);

create or replace function public.finalize_paid_order(p_order_id uuid)
returns public.orders
language plpgsql security definer set search_path=public
as $$
declare o public.orders; i record; stock integer; commission numeric(12,2);
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select * into o from public.orders where id=p_order_id for update;
 if not found then raise exception 'Order not found'; end if;
 if not (o.buyer_id=auth.uid() or exists(select 1 from public.profiles where id=auth.uid() and role='admin')) then raise exception 'Not authorized'; end if;
 if o.status <> 'pending_payment' then return o; end if;
 -- Inventory integration point: product stock must be locked and decremented here against the actual products table schema.
 -- Commission is derived from the order-item snapshot, never from client input.
 for i in select * from public.order_items where order_id=o.id for update loop
   commission:=round(i.unit_price*i.quantity*i.commission_rate/100,2);
   if commission>0 and i.reseller_id is not null then
     insert into public.commission_ledger(order_id,order_item_id,reseller_id,farmer_id,amount,status)
     values(o.id,i.id,i.reseller_id,i.farmer_id,commission,'earned')
     on conflict(order_item_id) do nothing;
     update public.order_items set commission_amount=commission where id=i.id;
   end if;
 end loop;
 update public.orders set status='paid',updated_at=now() where id=o.id returning * into o;
 insert into public.order_events(order_id,event_type,event_key,metadata) values(o.id,'payment_paid','finalize-paid-'||o.id::text,jsonb_build_object('total',o.total)) on conflict(event_key) do nothing;
 return o;
end;$$;
grant execute on function public.finalize_paid_order(uuid) to authenticated;

alter table public.commission_ledger enable row level security;
create policy if not exists "commission_owner_read" on public.commission_ledger for select using(auth.uid()=reseller_id or auth.uid()=farmer_id or exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
