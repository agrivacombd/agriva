-- AGRIVA REVIEW-ONLY DRAFT — DO NOT APPLY
-- File intentionally lives under docs/drafts/, not supabase/migrations/.
-- Date: 2026-10-23
--
-- BLOCKING PRECONDITION:
-- Canonical schema currently defines public.user_role as ('farmer','reseller','admin')
-- and public.is_admin() treats every role='admin' as admin. No canonical Super Admin
-- identity/role or trusted permission system was confirmed in the inspected migrations.
-- Therefore this draft deliberately calls public.is_super_admin() and will NOT be
-- executable until a separately reviewed, non-user-editable Super Admin bootstrap/
-- authorization mechanism is designed and confirmed. Never implement it by treating
-- every admin as Super Admin or by trusting client-supplied profile fields.
--
-- Additional preconditions:
-- 1. Confirm current live schema/migration history in the intended Supabase project.
-- 2. Inspect current grants and RLS policies for profiles/admin_audit_log/products.
-- 3. Confirm storage bucket policies for private business documents.
-- 4. Extend the existing checkout/order path atomically; this draft does NOT replace it.
-- 5. Validate quantity units: current marketplace_orders.quantity is integer while
--    products.stock is numeric. Resolve unit/pack semantics before wholesale tier rollout.
--
-- This file is a schema/RPC DESIGN DRAFT only. It has not been run against any database.

begin;

-- 1) Narrowly scoped delegated permission grants. The key allowlist is enforced
--    inside grant/revoke RPCs below; direct writes must remain unavailable to clients.
create table if not exists public.admin_permission_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  permission_key text not null check (
    permission_key in ('marketplace.category_config.manage')
  ),
  granted_by uuid not null references public.profiles(id) on delete restrict,
  reason text not null check (length(trim(reason)) between 3 and 500),
  created_at timestamptz not null default now(),
  revoked_by uuid null references public.profiles(id) on delete restrict,
  revoked_at timestamptz null,
  revoke_reason text null check (revoke_reason is null or length(trim(revoke_reason)) between 3 and 500),
  check ((revoked_at is null and revoked_by is null) or
         (revoked_at is not null and revoked_by is not null))
);

create unique index if not exists admin_permission_grants_one_active
  on public.admin_permission_grants(user_id, permission_key)
  where revoked_at is null;
create index if not exists admin_permission_grants_user_active
  on public.admin_permission_grants(user_id, permission_key, revoked_at);

alter table public.admin_permission_grants enable row level security;
-- No client-facing SELECT/INSERT/UPDATE/DELETE policies are intentionally created.
-- Privileged reads and mutations must use narrow RPCs after authorization review.
revoke all on public.admin_permission_grants from anon, authenticated;

-- 2) B2B business account application. Documents must live in a private bucket;
--    this table stores storage paths only, never public URLs or file contents.
create table if not exists public.b2b_business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  business_type text not null check (
    business_type in ('entrepreneur','business','enterprise','wholesaler','other')
  ),
  legal_name text not null check (length(trim(legal_name)) between 2 and 200),
  business_registration_id text null check (
    business_registration_id is null or length(trim(business_registration_id)) <= 120
  ),
  contact_name text not null check (length(trim(contact_name)) between 2 and 160),
  contact_phone text not null check (length(trim(contact_phone)) between 5 and 40),
  business_address jsonb not null check (jsonb_typeof(business_address) = 'object'),
  document_storage_paths text[] not null default '{}',
  verification_status text not null default 'pending_verification'
    check (verification_status in ('pending_verification','approved','rejected','suspended')),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid null references public.profiles(id) on delete restrict,
  reviewed_at timestamptz null,
  decision_reason text null check (decision_reason is null or length(trim(decision_reason)) between 3 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id),
  check (
    (verification_status = 'pending_verification' and reviewed_by is null and reviewed_at is null)
    or
    (verification_status <> 'pending_verification' and reviewed_by is not null and reviewed_at is not null)
  )
);
create index if not exists b2b_business_profiles_review_queue
  on public.b2b_business_profiles(verification_status, submitted_at);
create index if not exists b2b_business_profiles_user_status
  on public.b2b_business_profiles(user_id, verification_status);

create table if not exists public.b2b_verification_events (
  id uuid primary key default gen_random_uuid(),
  business_profile_id uuid not null references public.b2b_business_profiles(id) on delete restrict,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  previous_status text null,
  new_status text not null check (
    new_status in ('pending_verification','approved','rejected','suspended')
  ),
  reason text not null check (length(trim(reason)) between 3 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists b2b_verification_events_profile_time
  on public.b2b_verification_events(business_profile_id, created_at desc);

alter table public.b2b_business_profiles enable row level security;
alter table public.b2b_verification_events enable row level security;
revoke all on public.b2b_business_profiles from anon, authenticated;
revoke all on public.b2b_verification_events from anon, authenticated;
-- Add only reviewed narrow RPCs; do not add a broad profile/document read policy.

-- 3) Wholesale quantity tiers are separate from products.price (retail price).
--    The final schema may need product variant IDs after variant support is audited.
create table if not exists public.product_wholesale_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  min_quantity numeric(12,2) not null check (min_quantity > 0),
  max_quantity numeric(12,2) null check (max_quantity is null or max_quantity >= min_quantity),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  currency text not null default 'BDT' check (currency = 'BDT'),
  is_active boolean not null default true,
  valid_from timestamptz null,
  valid_until timestamptz null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_until is null or valid_from is null or valid_until > valid_from)
);
create index if not exists product_wholesale_prices_product_active
  on public.product_wholesale_prices(product_id, is_active, min_quantity);
alter table public.product_wholesale_prices enable row level security;
revoke all on public.product_wholesale_prices from anon, authenticated;
-- IMPORTANT: prevent overlapping quantity tiers/effective windows in the final draft.
-- A correct exclusion constraint needs a reviewed range model and likely btree_gist;
-- do not approximate this with a simple unique constraint.

-- 4) Proposed server-side authorization functions.
-- These are intentionally not defined here because the canonical Super Admin
-- identity/bootstrap mechanism is unresolved. Do not replace with public.is_admin().
--
-- Required helper contract before these RPCs can be enabled:
--   public.is_super_admin() returns boolean, SECURITY DEFINER, fixed search_path,
--   reads a server-managed source of truth, and cannot be changed by user profile edits.
--   public.has_admin_permission(text) returns boolean, SECURITY DEFINER, fixed
--   search_path, and checks auth.uid() against an active permission grant.
--
-- Pseudocode for grant/revoke/review RPCs (must be implemented after helper review):
--
-- super_admin_grant_permission(target_user_id, permission_key, reason):
--   require auth.uid() IS NOT NULL AND public.is_super_admin()
--   allow only marketplace.category_config.manage
--   reject target_user_id = auth.uid()
--   lock target profile; verify target is an Admin using canonical role
--   insert grant + admin_audit_log row in same transaction
--
-- super_admin_revoke_permission(grant_id, reason):
--   require public.is_super_admin(); lock active grant; mark revoked_by/revoked_at;
--   append admin_audit_log row in same transaction
--
-- super_admin_review_b2b_application(profile_id, decision, reason):
--   require public.is_super_admin(); lock application; reject self-approval;
--   validate transition; update status/reviewer/time and append event + audit atomically
--
-- get_wholesale_prices(product_ids, quantities):
--   require authenticated buyer and current verification_status='approved';
--   filter to active/public products and valid effective tier;
--   return only requested products and matching quantity tiers; never bulk dump
--
-- checkout:
--   modify the existing finalize/order RPC after inspecting all callers;
--   lock product + matching tier + B2B profile, compute price on server, persist
--   price_mode/unit_price/tier snapshot in marketplace_orders, update stock once,
--   and preserve commission/cancel/refund semantics. Do not add a second checkout RPC.

-- 5) Order snapshot columns (PROPOSED, DO NOT APPLY until existing code is updated).
-- Existing marketplace_orders already has unit_price, quantity, total_amount and
-- commission fields. Additive candidates only after reviewing all order consumers:
--   pricing_mode text NOT NULL DEFAULT 'retail' CHECK (pricing_mode IN ('retail','wholesale'))
--   wholesale_price_tier_id uuid NULL REFERENCES product_wholesale_prices(id)
--   unit_price_at_order numeric(12,2) -- likely redundant with existing unit_price
-- Prefer reusing existing unit_price and add only pricing_mode + tier reference if
-- proven necessary. Preserve historical totals; do not backfill guessed price modes.

-- 6) Category attribute configuration tables are not included yet:
-- the current product_categories table exists, but its existing shape, category
-- usage, dynamic form consumers, and attribute validation contract must be inventoried
-- before drafting this schema. Do not allow arbitrary SQL, column names or expressions.

rollback;

-- END REVIEW-ONLY DRAFT. Transaction rollback is an extra guard, not a substitute
-- for never running this file against any database.
