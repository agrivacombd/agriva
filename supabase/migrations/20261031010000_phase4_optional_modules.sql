-- Phase 4 optional modules: plant-market taxonomy expansion and MFA-gated payout transitions.
-- Apply through the reviewed Supabase migration workflow; this file is not applied to production by this commit.

insert into public.product_categories (name, slug, description, is_active, sort_order)
values ('গাছ ও বাগান', 'plants-gardening', 'ইনডোর গাছ, ফুল ও ফলের চারা, বীজ, টব, মাটি এবং বাগানের সরঞ্জাম', true, 70)
on conflict (slug) do update set name = excluded.name, description = excluded.description, is_active = true, sort_order = excluded.sort_order, updated_at = now();

insert into public.product_subcategories (category_slug, slug, name, description, is_active, sort_order)
values
  ('plants-gardening', 'indoor-plants', 'ইনডোর গাছ', 'ঘর ও অফিসের ভেতরে রাখার উপযোগী গাছের পণ্য দেখুন।', true, 10),
  ('plants-gardening', 'flowering-plants', 'ফুলের গাছ', 'ফুলের গাছ, চারা ও মৌসুমি শোভাবর্ধক উদ্ভিদ দেখুন।', true, 20),
  ('plants-gardening', 'fruit-saplings', 'ফলের চারা', 'বাড়ি, ছাদ ও বাগানের জন্য ফলের চারা দেখুন।', true, 30),
  ('plants-gardening', 'seeds-cuttings', 'বীজ ও কাটিং', 'বাগান ও শোভাবর্ধক গাছের বীজ এবং কাটিং দেখুন।', true, 40),
  ('plants-gardening', 'pots-planters', 'টব ও প্ল্যান্টার', 'গাছ লাগানো ও স্থানান্তরের জন্য টব ও প্ল্যান্টার দেখুন।', true, 50),
  ('plants-gardening', 'soil-growing-media', 'মাটি ও গ্রোয়িং মিডিয়া', 'টব ও বাগানের জন্য মাটি, কম্পোস্ট ও গ্রোয়িং মিডিয়া দেখুন।', true, 60),
  ('plants-gardening', 'garden-tools', 'বাগানের সরঞ্জাম', 'ছাঁটাই, পানি দেওয়া ও পরিচর্যার সরঞ্জাম দেখুন।', true, 70)
on conflict (category_slug, slug) do update set name = excluded.name, description = excluded.description, is_active = true, sort_order = excluded.sort_order, updated_at = now();

-- Payout approval and settlement are high-risk state transitions. This trigger
-- is the final database boundary and protects against direct status updates.
create or replace function private.enforce_mfa_for_commission_payout_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $phase4_payout_mfa$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role text;
  v_aal text := auth.jwt() ->> 'aal';
  v_jwt_role text := auth.jwt() ->> 'role';
begin
  if new.status is not distinct from old.status or new.status not in ('approved', 'paid') then
    return new;
  end if;

  -- Trusted server-side service-role operations may proceed. Human admin
  -- sessions must present an AAL2 claim issued after MFA verification.
  if v_jwt_role = 'service_role' then
    return new;
  end if;

  if v_actor_id is null or v_aal is distinct from 'aal2' then
    raise exception 'MFA verification required for payout approval or settlement'
      using errcode = '42501';
  end if;

  select p.role into v_actor_role from public.profiles p where p.id = v_actor_id;
  if v_actor_role is distinct from 'admin' then
    raise exception 'Admin role required for payout approval or settlement'
      using errcode = '42501';
  end if;

  insert into public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  values (
    v_actor_id,
    case when new.status = 'approved' then 'payout.mfa_approved' else 'payout.mfa_settled' end,
    'commission_payout',
    new.id,
    jsonb_build_object('from_status', old.status, 'to_status', new.status, 'aal', v_aal, 'reseller_id', new.reseller_id, 'amount', new.amount)
  );
  return new;
end;
$phase4_payout_mfa$;

drop trigger if exists commission_payouts_require_mfa on public.commission_payouts;
create trigger commission_payouts_require_mfa
before update of status on public.commission_payouts
for each row execute function private.enforce_mfa_for_commission_payout_transition();

revoke all on function private.enforce_mfa_for_commission_payout_transition() from public, anon, authenticated;
