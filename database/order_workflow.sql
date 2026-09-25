-- Step 4: order lifecycle + returns/refunds + commission lifecycle
alter table if exists marketplace_orders add column if not exists shipped_at timestamptz;
alter table if exists marketplace_orders add column if not exists delivered_at timestamptz;
alter table if exists marketplace_orders add column if not exists cancelled_at timestamptz;
alter table if exists marketplace_orders add column if not exists refund_amount numeric(12,2) default 0;
alter table if exists marketplace_orders add column if not exists refund_reason text;

create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references marketplace_orders(id) on delete cascade,
  status text not null,
  note text,
  actor_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists order_returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references marketplace_orders(id) on delete cascade,
  customer_id uuid references profiles(id) on delete set null,
  reason text not null,
  status text not null default 'requested' check (status in ('requested','approved','rejected','refunded')),
  refund_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists order_history_order_idx on order_status_history(order_id, created_at desc);
create index if not exists order_returns_order_idx on order_returns(order_id, created_at desc);

alter table order_status_history enable row level security;
alter table order_returns enable row level security;
create policy "order history participants" on order_status_history for select using (actor_id = auth.uid() or public.is_admin());
create policy "customer own returns" on order_returns for select using (customer_id = auth.uid() or public.is_admin());
create policy "customer create returns" on order_returns for insert with check (customer_id = auth.uid());
