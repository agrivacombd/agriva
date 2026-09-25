-- Step 1: Farmer product moderation and verification foundation
alter table if exists products add column if not exists moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','rejected'));
alter table if exists products add column if not exists rejection_reason text;
alter table if exists profiles add column if not exists verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified','rejected'));
create index if not exists products_moderation_idx on products(moderation_status, created_at desc);

-- Only approved products should be publicly visible. Keep existing farmer/admin policies intact.
