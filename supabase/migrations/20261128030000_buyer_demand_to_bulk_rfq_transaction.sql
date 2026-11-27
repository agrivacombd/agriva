-- Transactional, owner-scoped Buyer Demand → Wholesaler RFQ conversion.
-- Development branch only. Apply to an isolated staging database after review.
create table if not exists public.buyer_demand_rfq_conversions (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null unique references public.buyer_demands(id) on delete restrict,
  request_id uuid not null unique references public.bulk_requests(id) on delete restrict,
  buyer_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists buyer_demand_rfq_conversions_buyer_created_idx
  on public.buyer_demand_rfq_conversions (buyer_id, created_at desc);

alter table public.buyer_demand_rfq_conversions enable row level security;
revoke all on table public.buyer_demand_rfq_conversions from public, anon, authenticated;

create or replace function public.prevent_buyer_demand_rfq_conversion_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, public, pg_temp
as $$
begin
  raise exception 'Buyer demand RFQ conversion records are immutable'
    using errcode = '55000';
end;
$$;
revoke all on function public.prevent_buyer_demand_rfq_conversion_mutation() from public, anon, authenticated;

drop trigger if exists buyer_demand_rfq_conversions_immutable on public.buyer_demand_rfq_conversions;
create trigger buyer_demand_rfq_conversions_immutable
before update or delete on public.buyer_demand_rfq_conversions
for each row execute function public.prevent_buyer_demand_rfq_conversion_mutation();

create or replace function public.convert_buyer_demand_to_bulk_rfq(
  p_demand_id uuid,
  p_buyer_type text,
  p_visibility text,
  p_quote_deadline timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  v_buyer_id uuid := auth.uid();
  v_demand public.buyer_demands%rowtype;
  v_existing_request_id uuid;
  v_request_id uuid;
begin
  if v_buyer_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_demand_id is null then
    raise exception 'Demand is required' using errcode = '22023';
  end if;

  select d.* into v_demand
  from public.buyer_demands d
  where d.id = p_demand_id
  for update;

  if not found or v_demand.buyer_id is distinct from v_buyer_id then
    raise exception 'Demand not found or not owned by caller' using errcode = '42501';
  end if;

  if p_buyer_type is null or p_buyer_type not in ('individual', 'business')
     or p_visibility is null or p_visibility not in ('public', 'private')
     or p_quote_deadline is null
     or p_quote_deadline <= now()
     or p_quote_deadline > now() + interval '90 days' then
    raise exception 'Invalid RFQ options or quote deadline' using errcode = '22023';
  end if;

  -- Idempotent retry: return the already-created RFQ for this owned demand.
  select c.request_id into v_existing_request_id
  from public.buyer_demand_rfq_conversions c
  where c.demand_id = p_demand_id and c.buyer_id = v_buyer_id;

  if v_existing_request_id is not null then
    return v_existing_request_id;
  end if;

  if v_demand.status <> 'active' then
    raise exception 'Demand is not active' using errcode = '22023';
  end if;

  if v_demand.response_deadline is not null and v_demand.response_deadline < current_date then
    raise exception 'Demand response deadline has expired' using errcode = '22023';
  end if;

  -- Source demand units are a strict subset of the current bulk_requests unit enum.
  if v_demand.unit not in ('kg', 'maund', 'ton', 'bag')
     or char_length(trim(v_demand.crop_name)) not between 2 and 120
     or v_demand.quantity <= 0
     or v_demand.district is null
     or char_length(trim(v_demand.district)) not between 2 and 80
     or char_length(coalesce(v_demand.upazila, '')) > 80 then
    raise exception 'Demand fields cannot be represented as an RFQ' using errcode = '22023';
  end if;

  insert into public.bulk_requests (
    buyer_id, buyer_type, visibility, status, product_name, specification,
    quantity, unit, district, upazila, desired_date, quote_deadline
  ) values (
    v_buyer_id,
    p_buyer_type,
    p_visibility,
    'pending_review',
    trim(v_demand.crop_name),
    '',
    v_demand.quantity,
    v_demand.unit,
    trim(v_demand.district),
    coalesce(trim(v_demand.upazila), ''),
    case when v_demand.need_mode = 'specific_date' then v_demand.need_date else null end,
    p_quote_deadline
  )
  returning id into v_request_id;

  insert into public.buyer_demand_rfq_conversions (demand_id, request_id, buyer_id)
  values (p_demand_id, v_request_id, v_buyer_id);

  return v_request_id;
end;
$$;

revoke all on function public.convert_buyer_demand_to_bulk_rfq(uuid, text, text, timestamptz) from public, anon;
grant execute on function public.convert_buyer_demand_to_bulk_rfq(uuid, text, text, timestamptz) to authenticated;
