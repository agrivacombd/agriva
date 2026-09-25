-- Step 3: reseller wallet, 15-day attribution reporting and withdrawal requests
alter table if exists reseller_profiles add column if not exists wallet_balance numeric(12,2) not null default 0;

create table if not exists reseller_withdrawals (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null references reseller_profiles(user_id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method text not null default 'manual',
  account_reference text,
  status text not null default 'pending' check (status in ('pending','approved','paid','rejected')),
  note text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index if not exists reseller_withdrawals_idx on reseller_withdrawals(reseller_id, created_at desc);
create index if not exists reseller_commissions_window_idx on reseller_commissions(reseller_id, created_at desc, status);

alter table reseller_withdrawals enable row level security;
create policy "reseller own withdrawals" on reseller_withdrawals for select using (reseller_id = auth.uid() or public.is_admin());
create policy "reseller create withdrawals" on reseller_withdrawals for insert with check (reseller_id = auth.uid());
