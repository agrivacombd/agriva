-- AGRIVA commission ledger compatibility layer.
-- Real marketplace inventory and settlement are implemented atomically in 014_marketplace_production.sql.
create table if not exists public.commission_ledger (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  reseller_id uuid references public.profiles(id) on delete set null,
  farmer_id uuid references public.profiles(id) on delete set null,
  amount numeric(12,2) not null check(amount>=0),
  status text not null default 'pending' check(status in ('pending','earned','reversed')),
  created_at timestamptz not null default now()
);
create index if not exists commission_ledger_reseller_idx on public.commission_ledger(reseller_id,created_at desc);
alter table public.commission_ledger enable row level security;
create policy if not exists "commission_owner_read" on public.commission_ledger for select using(auth.uid()=reseller_id or auth.uid()=farmer_id or exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
