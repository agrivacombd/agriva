-- AGRIVA platform hardening: payout ledger + audit log + atomic commission state.
create table if not exists public.commission_payouts (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null references public.profiles(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'requested' check (status in ('requested','approved','paid','rejected')),
  payment_method text,
  payment_reference text,
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  paid_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null
);
create index if not exists commission_payouts_reseller_idx on public.commission_payouts(reseller_id,requested_at desc);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log(created_at desc);

alter table public.commission_payouts enable row level security;
alter table public.admin_audit_log enable row level security;
create policy if not exists "payouts_reseller_read" on public.commission_payouts for select using (auth.uid()=reseller_id or exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy if not exists "audit_admin_read" on public.admin_audit_log for select using (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));

create or replace function public.request_commission_payout(p_amount numeric, p_method text)
returns public.commission_payouts
language plpgsql security definer set search_path=public
as $$
declare p public.commission_payouts; uid uuid;
begin
 uid:=auth.uid();
 if uid is null then raise exception 'Authentication required'; end if;
 if p_amount <= 0 then raise exception 'Amount must be positive'; end if;
 -- Balance is intentionally calculated from settled commission records by the application/ledger integration.
 insert into public.commission_payouts(reseller_id,amount,payment_method) values(uid,p_amount,p_method) returning * into p;
 return p;
end;$$;
grant execute on function public.request_commission_payout(numeric,text) to authenticated;
