-- AGRIVA order/payment/commission integrity foundation.
create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  provider text not null,
  provider_transaction_id text,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'BDT',
  status text not null default 'pending' check (status in ('pending','authorized','paid','failed','refunded','partially_refunded')),
  idempotency_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists payment_provider_tx_idx on public.payment_transactions(provider,provider_transaction_id) where provider_transaction_id is not null;

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  event_type text not null check (event_type in ('created','payment_authorized','payment_paid','payment_failed','fulfilled','cancelled','refunded','commission_approved','commission_reversed')),
  event_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists order_events_order_idx on public.order_events(order_id,created_at);

alter table public.payment_transactions enable row level security;
alter table public.order_events enable row level security;
create policy if not exists "payment_transactions_admin_read" on public.payment_transactions for select using (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy if not exists "order_events_admin_read" on public.order_events for select using (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));

create or replace function public.record_payment_event(
  p_order_id uuid,
  p_provider text,
  p_provider_transaction_id text,
  p_amount numeric,
  p_status text,
  p_idempotency_key text,
  p_metadata jsonb default '{}'::jsonb
) returns public.payment_transactions
language plpgsql security definer set search_path=public
as $$
declare t public.payment_transactions;
begin
  insert into public.payment_transactions(order_id,provider,provider_transaction_id,amount,status,idempotency_key,metadata)
  values(p_order_id,p_provider,p_provider_transaction_id,p_amount,p_status,p_idempotency_key,p_metadata)
  on conflict(idempotency_key) do update set updated_at=now()
  returning * into t;
  insert into public.order_events(order_id,event_type,event_key,metadata)
  values(p_order_id,case when p_status='paid' then 'payment_paid' when p_status='failed' then 'payment_failed' when p_status='refunded' then 'refunded' else 'payment_authorized' end,p_idempotency_key,p_metadata)
  on conflict(event_key) do nothing;
  return t;
end;
$$;
grant execute on function public.record_payment_event(uuid,text,text,numeric,text,text,jsonb) to authenticated;
